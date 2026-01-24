import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/services/auth/register";
import { readDB, writeDB } from "@/lib/db/db";

export async function POST(req: NextRequest) {
	const { email, username, password } = await req.json();

	const user = await registerUser({ email, username, password });

	const token = crypto.randomUUID();

	const db = await readDB();
	db.sessions.push({
		token,
		userId: user.id,
		createdAt: new Date().toISOString(),
	});
	await writeDB(db);

	const res = NextResponse.json({ ok: true });

	res.cookies.set("auth_token", token, {
		httpOnly: true,
		path: "/",
	});

	return res;
}
