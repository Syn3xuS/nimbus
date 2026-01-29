"use client";

import { useState } from "react";
import Case from "@/lib/ui/case/Case";

import styles from "@/lib/ui/case/Case_center.module.css";

import "../styles.css";

export default function Page() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		const res = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});

		if (!res.ok) {
			const data = await res.json();
			setError(data.message ?? "Login failed");
			return;
		}

		window.location.href = "/";
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
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
					/>

					<button className="button2">Login</button>

					<div className="prs">
						У вас ещё нет аккаунт?{" "}
						<a href="/auth/register">Зарегистрируйтесь</a>
					</div>

					{error && <div className="error">{error}</div>}
				</form>
			</Case>
		</>
	);
}
