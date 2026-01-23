import Link from "next/link";

export default function page() {
	return (
		<>
			<p>Главная страница</p>
			<div>
				<p>
					<Link className="link" href={"/auth/login"}>
						Вход
					</Link>
				</p>
				<p>
					<Link className="link" href={"/auth/register"}>
						Регистрация
					</Link>
				</p>
				<p>
					<Link className="link" href={"/auth"}>
						Аутентификация
					</Link>
				</p>
			</div>
		</>
	);
}
