import { NextResponse } from "next/server";
import { registerUser } from "@/lib/services/auth/register";

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const result = await registerUser(body);

		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		if (error instanceof Error) {
			return NextResponse.json(
				{ message: error.message },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ message: "Unknown error" },
			{ status: 500 }
		);
	}
}
