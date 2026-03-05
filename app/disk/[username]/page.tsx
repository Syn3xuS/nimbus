import Case from "@/shared/ui/case/Case";
import DiskClient from "./DiskClient";
import { cookies } from "next/headers";
import { getPool } from "@/server/db/db";
import { initDb } from "@/server/db/init";
import caseStyles from "@/shared/ui/case/Case_center.module.css";
import { getValidSessionUserId } from "@/server/auth/session";

function AccessDenied({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Case>
				<h1>Доступ к диску закрыт</h1>
				<p>{children}</p>
			</Case>
		</>
	);
}

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
			<AccessDenied>Вы не имеете доступа к этому диску.</AccessDenied>
		);
	}

	const db = getPool();
	await initDb(db);

	const sessionUserId = await getValidSessionUserId(db, token);
	if (!sessionUserId) {
		return (
			<AccessDenied>Вы не имеете доступа к этому диску.</AccessDenied>
		);
	}
	const userRes = await db.query("SELECT id FROM users WHERE username = $1", [
		username,
	]);
	if (userRes.rowCount === 0) {
		return (
			<AccessDenied>Пользователь не найден.</AccessDenied>
		);
	}

	const ownerId = userRes.rows[0].id as string;
	if (ownerId !== sessionUserId) {
		return (
			<AccessDenied>Вы не имеете доступа к этому диску.</AccessDenied>
		);
	}

	return (
		<>
			<Case className={caseStyles.case_center}>
				<h1>Диск пользователя: {username}</h1>
				<DiskClient username={username} />
			</Case>
		</>
	);
}
