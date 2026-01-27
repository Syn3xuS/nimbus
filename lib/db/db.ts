import { Pool } from "pg";
import { initDb } from "./init";

type User = {
	id: string;
	email: string;
	username: string;
	passwordHash: string;
	createdAt: string;
};

type Session = {
	token: string;
	userId: string;
	createdAt: string;
};

type DB = {
	users: User[];
	sessions: Session[];
};

let pool: Pool | null = null;

function getPool() {
	if (!pool) {
		pool = new Pool({
			user: "dev",
			password: "dev",
			host: "localhost",
			port: 5432, 			database: "app",
		});
	}
	return pool;
}

export { getPool };

export async function readDB(): Promise<DB> {
	const db = getPool();
	await initDb(db);

	const [usersRes, sessionsRes] = await Promise.all([
		db.query("SELECT * FROM users ORDER BY created_at"),
		db.query("SELECT * FROM sessions ORDER BY created_at"),
	]);

	return {
		users: usersRes.rows.map((u) => ({
			id: u.id,
			email: u.email,
			username: u.username,
			passwordHash: u.password_hash,
			createdAt: u.created_at,
		})),
		sessions: sessionsRes.rows.map((s) => ({
			token: s.token,
			userId: s.user_id,
			createdAt: s.created_at,
		})),
	};
}

export async function writeDB(data: DB) {
	const db = getPool();
	await initDb(db);

	const client = await db.connect();
	try {
		await client.query("BEGIN");

				await client.query("TRUNCATE users, sessions RESTART IDENTITY CASCADE");

				for (const user of data.users) {
						const passwordHash = user.passwordHash ?? "temp_hash";
			const createdAt = user.createdAt ?? new Date().toISOString();

			await client.query(
				`
        INSERT INTO users (id, email, username, password_hash, created_at)
        VALUES ($1, $2, $3, $4, $5)
        `,
				[user.id, user.email, user.username, passwordHash, createdAt],
			);
		}

				for (const session of data.sessions) {
			const createdAt = session.createdAt ?? new Date().toISOString();

			await client.query(
				`
        INSERT INTO sessions (token, user_id, created_at)
        VALUES ($1, $2, $3)
        `,
				[session.token, session.userId, createdAt],
			);
		}

		await client.query("COMMIT");
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}
