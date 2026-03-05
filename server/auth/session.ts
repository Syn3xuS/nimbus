import type { Pool } from "pg";

const SESSION_TTL_DAYS = 30;

export async function getValidSessionUserId(
  db: Pool,
  token: string,
): Promise<string | null> {
  const res = await db.query(
    `
      SELECT user_id
      FROM sessions
      WHERE token = $1
        AND created_at > NOW() - INTERVAL '${SESSION_TTL_DAYS} days'
    `,
    [token],
  );

  if (res.rowCount === 0) {
    return null;
  }

  return res.rows[0].user_id as string;
}
