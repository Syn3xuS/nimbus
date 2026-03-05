import { cookies } from "next/headers";
import { getPool } from "@/server/db/db";
import { initDb } from "@/server/db/init";
import { getValidSessionUserId } from "@/server/auth/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  const db = getPool();
  await initDb(db);

  const userId = await getValidSessionUserId(db, token);

  if (!userId) {
    return null;
  }

  const res = await db.query(
    "SELECT username, email FROM users WHERE id = $1",
    [userId],
  );

  if (res.rowCount === 0) {
    return null;
  }

  return res.rows[0];
}
