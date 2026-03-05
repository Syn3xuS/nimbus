import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/server/db/db";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const db = await readDB();
  const now = Date.now();

  const session = db.sessions.find(
    (s) =>
      s.token === token &&
      new Date(s.createdAt).getTime() > now - SESSION_TTL_MS,
  );
  if (!session) {
    const res = NextResponse.json({ user: null }, { status: 401 });
    res.cookies.set("auth_token", "", {
      path: "/",
      maxAge: 0,
    });
    return res;
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    const res = NextResponse.json({ user: null }, { status: 401 });
    res.cookies.set("auth_token", "", {
      path: "/",
      maxAge: 0,
    });
    return res;
  }

  return NextResponse.json({
    user: {
      username: user.username,
      email: user.email,
    },
  });
}
