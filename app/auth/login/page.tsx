"use client";

import { useState } from "react";
import Case from "@/lib/ui/case/Case";

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
			<Case>
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

					<button>Login</button>

					{error && <p>{error}</p>}
				</form>
			</Case>
		</>
	);
}
