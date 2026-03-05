import { getPool } from "@/server/db/db";
import { requireUser } from "@/server/auth/requireUser";

export async function requireDiskOwner(username: string) {
  const userId = await requireUser();

  if (!userId) {
    return { ok: false, reason: "unauthorized" };
  }

  const db = getPool();

  const userRes = await db.query(
    "SELECT id FROM users WHERE username = $1",
    [username],
  );

  if (userRes.rowCount === 0) {
    return { ok: false, reason: "not_found" };
  }

  const ownerId = userRes.rows[0].id;

  if (ownerId !== userId) {
    return { ok: false, reason: "forbidden" };
  }

  return { ok: true, userId };
}