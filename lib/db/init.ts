import { Pool } from "pg";

let initialized = false;

export async function initDb(pool: Pool) {
	if (initialized) return;

	// создаём таблицы, если их нет
	await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        object_key TEXT,
        filename TEXT NOT NULL,
        path TEXT NOT NULL DEFAULT '/',
        is_folder BOOLEAN NOT NULL DEFAULT FALSE,
        size BIGINT,
        content_type TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
  `);

	// Для уже существующих баз добавляем новые колонки безопасно
	await pool.query(`
    ALTER TABLE files ADD COLUMN IF NOT EXISTS path TEXT NOT NULL DEFAULT '/';
    ALTER TABLE files ADD COLUMN IF NOT EXISTS is_folder BOOLEAN NOT NULL DEFAULT FALSE;
    -- allow object_key to be NULL for folder entries
    ALTER TABLE files ALTER COLUMN object_key DROP NOT NULL;
    `);

	// Normalize existing folder rows that were stored with their own path (e.g. '/folder1/')
	// to be listed under their parent path (e.g. '/'). This fixes folders created
	// by older code that used the folder path as the `path` column.
	try {
		await pool.query(`
      UPDATE files
      SET path = regexp_replace(path, '/' || filename || '/$', '/', '')
      WHERE is_folder = TRUE AND path ~ ('/' || filename || '/$');
    `);
	} catch (e) {
		// ignore migration errors
		console.warn("files: folder-normalize migration failed", e);
	}

	initialized = true;
	console.log("🐘 Postgres (Docker) initialized");
}
