import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/server/db/db";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> },
) {
  const { params } = context;
  const { username } = await params;
  const db = await readDB();

  const user = db.users.find((u) => u.username === username);

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
}
