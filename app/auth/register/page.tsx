"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Case from "@/shared/ui/case/Case";

import styles from "@/shared/ui/case/Case_center.module.css";

import "../styles.css";

export default function Page() {
	const [error, setError] = useState<string | null>(null);

	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const router = useRouter();

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					username,
					password,
				}),
			});

			if (res.ok) {
				await new Promise((r) => setTimeout(r, 2000));
				router.push("/");
			} else {
				const data = await res.json();
				setError(data.message ?? "Registration failed");
			}
		} catch {
			setError("Произошла ошибка сервера. Попробуйте ещё раз позже.");
		}
	};

	return (
		<>
			<Case className={styles.case_center}>
				<form onSubmit={onSubmit}>
					<input
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Email"
					/>

					<input
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="Username"
					/>

					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
					/>

					<button className="button2">Register</button>
					<div className="prs">
						У вас уже есть аккаунт?{" "}
						<Link href="/auth/login">Войдите</Link>
					</div>

					{error && <div className="error">{error}</div>}
				</form>
			</Case>
		</>
	);
}
