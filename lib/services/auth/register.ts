import argon2 from "argon2";

export async function registerUser(input: {
	email: string;
	password: string;
}) {
	const { email, password } = input;

	if (!email || !password) {
		throw new Error("Email and password are required");
	}

	const passwordHash = await argon2.hash(password);

	return {
		email,
		passwordHash,
	};
}
