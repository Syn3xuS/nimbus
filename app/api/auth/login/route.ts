import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	// const { email, password } = await req.json();
	const { searchParams } = new URL(req.url);

	const email = searchParams.get("email");
	const password = searchParams.get("password");

	return NextResponse.json({ message: `ТЫ ЛОХ, ${email}` }, { status: 209 });
	// if (!email || !password) {
	// return NextResponse.json({ error: "Invalid data" }, { status: 400 });
	// }

	// const user = await login(email, password);

	// return NextResponse.json({ user });
}
