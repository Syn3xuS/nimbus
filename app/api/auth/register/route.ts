import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/services/auth/register";

export async function POST(req: NextRequest) {
	try {
		const { email, username, password } = await req.json();

		const user = await registerUser({ email, username, password });
		console.log("ЮЗЕР: ", user);
		const res = NextResponse.json({ ok: true });

		return res;
	} catch (e) {
		return NextResponse.json(
			{
				ok: false,
				message: e instanceof Error ? e.message : "Registration failed",
			},
			{ status: 401 },
		);
	}
}
