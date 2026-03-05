import argon2 from "argon2";
import { readDB, writeDB } from "@/server/db/db";

export async function registerUser(input: {
	email: string;
	username: string;
	password: string;
}) {
	const { email, username, password } = input;

	if (!email || !username || !password) {
		throw new Error("Invalid data");
	}

	const db = await readDB();

	const exists = db.users.find(
		(u) => u.email === email || u.username === username,
	);

	if (exists) {
		throw new Error("User already exists");
	}

	const passwordHash = await argon2.hash(password);

	const user = {
		id: crypto.randomUUID(),
		email,
		username,
		passwordHash,
		createdAt: new Date().toISOString(),
	};

	db.users.push(user);
	await writeDB(db);

	return user;
}

