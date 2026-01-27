/* eslint-disable @typescript-eslint/no-explicit-any */

import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { getPool } from "@/lib/db/db";
import { initDb } from "@/lib/db/init";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
const MINIO_REGION = process.env.MINIO_REGION ?? "us-east-1";
const MINIO_ACCESS_KEY =
	process.env.MINIO_ROOT_USER ?? process.env.MINIO_ACCESS_KEY ?? "minio";
const MINIO_SECRET_KEY =
	process.env.MINIO_ROOT_PASSWORD ??
	process.env.MINIO_SECRET_KEY ??
	"minio123";
const MINIO_BUCKET = process.env.MINIO_BUCKET ?? "nimbus";

const s3 = new S3Client({
	endpoint: MINIO_ENDPOINT,
	region: MINIO_REGION,
	credentials: {
		accessKeyId: MINIO_ACCESS_KEY,
		secretAccessKey: MINIO_SECRET_KEY,
	},
	forcePathStyle: true,
});

async function ensureBucketExists() {
	try {
		await s3.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
	} catch (err: any) {
				const code = err?.Code ?? err?.code ?? err?.name;
		const msg = String(err?.message ?? "");
		const isAlreadyOwned =
			code === "BucketAlreadyOwnedByYou" ||
			code === "BucketAlreadyExists" ||
			/BucketAlreadyOwnedByYou|BucketAlreadyExists/.test(msg);
		if (!isAlreadyOwned) {
						throw err;
		}
	}
}

export async function getPresignedUploadUrl(
	filename: string,
	contentType: string,
) {
	await ensureBucketExists();
	const key = `${Date.now()}_${Math.random().toString(36).slice(2)}_${filename}`;
	const cmd = new PutObjectCommand({
		Bucket: MINIO_BUCKET,
		Key: key,
		ContentType: contentType,
	});
	const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 60 });
	return { url, key };
}

async function getPresignedDownloadUrl(key: string) {
	await ensureBucketExists();
	const cmd = new GetObjectCommand({ Bucket: MINIO_BUCKET, Key: key });
	const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 60 });
	return url;
}

export async function getObjectStream(key: string) {
	await ensureBucketExists();
	const cmd = new GetObjectCommand({ Bucket: MINIO_BUCKET, Key: key });
	const res = await s3.send(cmd);
	return res;
}

export async function registerFile(
	userId: string,
	key: string | null,
	filename: string,
	path: string = "/",
	isFolder: boolean = false,
	size?: number,
	contentType?: string,
) {
	const db = getPool();
	await initDb(db);
	const id = randomUUID();
	await db.query(
		`INSERT INTO files (id, user_id, object_key, filename, path, is_folder, size, content_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		[
			id,
			userId,
			key,
			filename,
			path,
			isFolder,
			size ?? null,
			contentType ?? null,
		],
	);
	return {
		id,
		userId,
		key,
		filename,
		path,
		isFolder,
		size,
		contentType,
	};
}

export async function listFilesByUsername(username: string) {
	const db = getPool();
	await initDb(db);
	const res = await db.query(
		`SELECT f.id, f.filename, f.size, f.content_type, f.object_key, f.created_at
		 , f.path, f.is_folder
		 FROM files f JOIN users u ON f.user_id = u.id
     WHERE u.username = $1
     ORDER BY f.created_at DESC`,
		[username],
	);
	return res.rows.map((r: any) => ({
		id: r.id,
		filename: r.filename,
		path: r.path,
		isFolder: r.is_folder,
		size: r.size,
		contentType: r.content_type,
		key: r.object_key,
		createdAt: r.created_at,
	}));
}

export async function deleteFile(userId: string, id: string) {
	const db = getPool();
	await initDb(db);
		const metaRes = await db.query(
		`SELECT id, filename, path, is_folder, object_key FROM files WHERE id = $1 AND user_id = $2`,
		[id, userId],
	);
	if (metaRes.rowCount === 0) {
		throw new Error("file not found");
	}
	const meta = metaRes.rows[0] as any;

	if (!meta.is_folder) {
				const key = meta.object_key as string | null;
		if (key) {
			await ensureBucketExists();
			await s3.send(
				new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: key }),
			);
		}
		await db.query(`DELETE FROM files WHERE id = $1`, [id]);
		return true;
	}

		const folderFullPath =
		(meta.path ?? "/").replace(/\/$/, "") + "/" + meta.filename + "/";

		const childrenRes = await db.query(
		`SELECT id, object_key FROM files WHERE path = $1 OR path LIKE $1 || '%'`,
		[folderFullPath],
	);

	const toDelete: { id: string; key: string | null }[] = childrenRes.rows.map(
		(r: any) => ({ id: r.id, key: r.object_key ?? null }),
	);
		toDelete.push({ id: meta.id, key: meta.object_key ?? null });

		const keys = toDelete.map((t) => t.key).filter(Boolean) as string[];
	if (keys.length > 0) {
		await ensureBucketExists();
		for (const k of keys) {
			try {
				await s3.send(
					new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: k }),
				);
			} catch (e) {
				console.warn("s3 delete object failed", k, e);
			}
		}
	}

		try {
		await db.query("BEGIN");
		for (const item of toDelete) {
			await db.query(`DELETE FROM files WHERE id = $1`, [item.id]);
		}
		await db.query("COMMIT");
	} catch (e) {
		await db.query("ROLLBACK");
		throw e;
	}

	return true;
}
