import { cookies } from "next/headers";
import { getPool } from "@/server/db/db";
import { initDb } from "@/server/db/init";
import { getValidSessionUserId } from "@/server/auth/session";

export async function requireUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  const db = getPool();
  await initDb(db);

  const userId = await getValidSessionUserId(db, token);

  return userId ?? null;
}