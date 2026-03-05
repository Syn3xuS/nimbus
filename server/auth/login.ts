import argon2 from "argon2";
import { readDB } from "@/server/db/db";

export async function loginUser(input: { email: string; password: string }) {
	const { email, password } = input;

	if (!email || !password) {
		throw new Error("Invalid data");
	}

	const db = await readDB();

	const user = db.users.find((u) => u.email === email);

	if (!user) {
		throw new Error("Invalid email or password");
	}

	const ok = await argon2.verify(user.passwordHash, password);
	if (!ok) {
		throw new Error("Invalid email or password");
	}

	return user;
}

