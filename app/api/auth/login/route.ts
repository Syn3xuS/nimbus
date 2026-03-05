import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/server/auth/login";
import { readDB, writeDB } from "@/server/db/db";

export async function POST(req: NextRequest) {
	try {
		const { email, password } = await req.json();

		const user = await loginUser({ email, password });

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
	} catch (e) {
		return NextResponse.json(
			{
				message: e instanceof Error ? e.message : "Login failed",
			},
			{ status: 401 },
		);
	}
}
