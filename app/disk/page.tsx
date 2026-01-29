import Case from "@/lib/ui/case/Case";

import Case_center from "@/lib/ui/case/Case_center.module.css";
import Link from "next/link";
export default function page() {
	return (
		<>
			<Case className={Case_center.case_center}>
				<div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
					<h1 className="text-2xl font-semibold">
						Ваш диск ждёт вас ☁️
					</h1>

					<p className="max-w-md text-muted-foreground">
						Войдите в аккаунт, чтобы получить доступ к вашим файлам
						и дискам, которыми с вами поделились другие
						пользователи.
					</p>

					<div className="flex gap-3 ">
						<Link
							href="/auth/login"
							className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
						>
							Войти
						</Link>
						<Link
							href="/auth/register"
							className="px-5 py-2 rounded-lg border hover:bg-muted"
						>
							Создать аккаунт
						</Link>
					</div>

					<p className="mt-6 text-sm text-muted-foreground">
						После входа здесь появится ваш файловый менеджер
					</p>
				</div>
			</Case>
		</>
	);
}
