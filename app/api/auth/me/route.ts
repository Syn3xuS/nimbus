import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db/db";

export async function GET(req: NextRequest) {
	const token = req.cookies.get("auth_token")?.value;
	if (!token) {
		return NextResponse.json({ user: null }, { status: 401 });
	}

	const db = await readDB();

	const session = db.sessions.find((s) => s.token === token);
	if (!session) {
		return NextResponse.json({ user: null }, { status: 401 });
	}

	const user = db.users.find((u) => u.id === session.userId);
	if (!user) {
		return NextResponse.json({ user: null }, { status: 401 });
	}

	return NextResponse.json({
		user: {
			username: user.username,
			email: user.email,
		},
	});
}
