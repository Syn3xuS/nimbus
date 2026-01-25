"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Case from "@/lib/ui/case/Case";

export default function Page() {
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

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
			router.push("/");
		}
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

					<button>Register</button>
				</form>
			</Case>
		</>
	);
}
