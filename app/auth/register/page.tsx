/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function page() {
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.message);
			}

			// после регистрации
			router.push("/auth/login");
		} catch (err) {
			if (err instanceof Error) setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={onSubmit}>
			<h1>Регистрация</h1>

			<input
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="Email"
				required
			/>

			<input
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				placeholder="Пароль"
				required
			/>

			<button disabled={loading}>
				{loading ? "Регистрация..." : "Зарегистрироваться"}
			</button>

			{error && <p style={{ color: "red" }}>{error}</p>}
		</form>
	);
}
