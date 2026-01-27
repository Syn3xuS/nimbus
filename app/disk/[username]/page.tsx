import Case from "@/lib/ui/case/Case";
import DiskClient from "./DiskClient";
import { cookies } from "next/headers";
import { getPool } from "@/lib/db/db";
import { initDb } from "@/lib/db/init";

import styles_case from "./Case.module.css"

export default async function page({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;

	const cookieStore = await cookies();
	const token = cookieStore.get("auth_token")?.value;

	if (!token) {
		return (
			<>
				<Case>
					<h1>Доступ к диску закрыт</h1>
					<p>Вы не имеете доступа к этому диску.</p>
				</Case>
			</>
		);
	}

	const db = getPool();
	await initDb(db);

	const sess = await db.query(
		"SELECT user_id FROM sessions WHERE token = $1",
		[token],
	);
	if (sess.rowCount === 0) {
		return (
			<>
				<Case>
					<h1>Доступ к диску закрыт</h1>
					<p>Вы не имеете доступа к этому диску.</p>
				</Case>
			</>
		);
	}

	const sessionUserId = sess.rows[0].user_id as string;
	const userRes = await db.query("SELECT id FROM users WHERE username = $1", [
		username,
	]);
	if (userRes.rowCount === 0) {
		return (
			<>
				<Case>
					<h1>Доступ к диску закрыт</h1>
					<p>Пользователь не найден.</p>
				</Case>
			</>
		);
	}

	const ownerId = userRes.rows[0].id as string;
	if (ownerId !== sessionUserId) {
		return (
			<>
				<Case>
					<h1>Доступ к диску закрыт</h1>
					<p>Вы не имеете доступа к этому диску.</p>
				</Case>
			</>
		);
	}

	return (
		<>
			<Case className={styles_case.case_center}>
				<h1>Диск пользователя: {username}</h1>
				<DiskClient username={username} />
			</Case>
		</>
	);
}
