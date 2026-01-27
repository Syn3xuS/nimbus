import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/db";
import { initDb } from "@/lib/db/init";
import {
	getPresignedUploadUrl,
	registerFile,
	listFilesByUsername,
	getObjectStream,
} from "@/lib/services/files/files";

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ username: string }> },
) {
	const { params } = context;
	const { username } = await params;

	const db = getPool();
	await initDb(db);

	// auth: require valid session cookie and ensure owner
	const token = req.cookies.get("auth_token")?.value;
	if (!token) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const sessRes = await db.query(
		"SELECT user_id FROM sessions WHERE token = $1",
		[token],
	);
	if (sessRes.rowCount === 0) {
		const res = NextResponse.json(
			{ message: "Unauthorized" },
			{ status: 401 },
		);
		res.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
		return res;
	}

	const sessionUserId = sessRes.rows[0].user_id;

	// ensure requested username exists and is owned by session user
	const userRes = await db.query("SELECT id FROM users WHERE username = $1", [
		username,
	]);
	if (userRes.rowCount === 0)
		return NextResponse.json(
			{ message: "User not found" },
			{ status: 404 },
		);
	const ownerId = userRes.rows[0].id;
	if (ownerId !== sessionUserId)
		return NextResponse.json({ message: "Forbidden" }, { status: 403 });

	// support direct download redirect via query param
	const downloadId = req.nextUrl.searchParams.get("downloadId");
	if (downloadId) {
		const res = await db.query(
			`SELECT f.object_key, f.filename, f.content_type FROM files f JOIN users u ON f.user_id = u.id WHERE f.id = $1 AND u.username = $2`,
			[downloadId, username],
		);
		if (res.rowCount === 0)
			return NextResponse.json(
				{ message: "File not found" },
				{ status: 404 },
			);
		const key = res.rows[0].object_key;
		const filename = res.rows[0].filename;
		const contentType =
			res.rows[0].content_type ?? "application/octet-stream";

		// proxy the object stream through the API to avoid exposing presigned URL
		const s3res = await getObjectStream(key);
		const body = s3res.Body as unknown as BodyInit;
		if (!body)
			return NextResponse.json(
				{ message: "Empty object body" },
				{ status: 500 },
			);

		const headers = new Headers();
		headers.set("Content-Type", contentType);
		headers.set(
			"Content-Disposition",
			`attachment; filename="${encodeURIComponent(filename)}"`,
		);

		return new Response(body, { status: 200, headers });
	}

	// otherwise list files but DO NOT expose presigned URLs: return internal download path
	const files = await listFilesByUsername(username);
	const withUrls = files.map((f) => ({
		...f,
		url: `/api/files/${username}?downloadId=${f.id}`,
	}));

	return NextResponse.json({ files: withUrls });
}

export async function POST(
	req: NextRequest,
	context: { params: Promise<{ username: string }> },
) {
	const { params } = context;
	const { username } = await params;
	const body = await req.json();

	const db = getPool();
	await initDb(db);
	const userRes = await db.query("SELECT id FROM users WHERE username = $1", [
		username,
	]);
	if (userRes.rowCount === 0)
		return NextResponse.json(
			{ message: "User not found" },
			{ status: 404 },
		);
	const userId = userRes.rows[0].id;

	// auth: require session and ensure session user matches target user
	const token = req.cookies.get("auth_token")?.value;
	if (!token)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

	const sessRes = await db.query(
		"SELECT user_id FROM sessions WHERE token = $1",
		[token],
	);
	if (sessRes.rowCount === 0) {
		const res = NextResponse.json(
			{ message: "Unauthorized" },
			{ status: 401 },
		);
		res.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
		return res;
	}

	const sessionUserId = sessRes.rows[0].user_id;
	if (sessionUserId !== userId)
		return NextResponse.json({ message: "Forbidden" }, { status: 403 });

	const action = body?.action;
	if (action === "presign") {
		const { filename, contentType } = body;
		if (!filename)
			return NextResponse.json(
				{ message: "filename required" },
				{ status: 400 },
			);
		const path = body?.path ?? "/";
		const presign = await getPresignedUploadUrl(
			filename,
			contentType ?? "application/octet-stream",
		);
		return NextResponse.json({ ...presign, path });
	}

	if (action === "register") {
		const { key, filename, size, contentType, path, isFolder } = body;
		if (!key || !filename)
			return NextResponse.json(
				{ message: "key and filename required" },
				{ status: 400 },
			);
		const file = await registerFile(
			userId,
			key,
			filename,
			path ?? "/",
			Boolean(isFolder),
			size,
			contentType,
		);
		return NextResponse.json({ file });
	}

	if (action === "mkdir") {
		const { name, path } = body;
		if (!name)
			return NextResponse.json(
				{ message: "name required" },
				{ status: 400 },
			);
		// create folder entry: store folder as an entry in the parent path
		const parentPath = (path ?? "/").replace(/\/$/, "") + "/";
		const file = await registerFile(userId, null, name, parentPath, true);
		return NextResponse.json({ folder: file });
	}

	if (action === "delete") {
		const { id } = body;
		if (!id)
			return NextResponse.json(
				{ message: "id required" },
				{ status: 400 },
			);
		try {
			await (
				await import("@/lib/services/files/files")
			).deleteFile(userId, id);
			return NextResponse.json({ ok: true });
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			return NextResponse.json(
				{ message: msg ?? "delete error" },
				{ status: 500 },
			);
		}
	}

	return NextResponse.json({ message: "unknown action" }, { status: 400 });
}
