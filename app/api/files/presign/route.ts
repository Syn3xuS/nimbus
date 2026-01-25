import { NextResponse } from "next/server";
import storage from "../../../../lib/services/storage";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { key, contentType } = body;
		if (!key || !contentType) {
			return NextResponse.json(
				{ error: "key and contentType required" },
				{ status: 400 },
			);
		}
		const url = await storage.getPresignedPutUrl(key, contentType);
		return NextResponse.json({ url, key });
	} catch (err) {
		return NextResponse.json({ error: "internal" }, { status: 500 });
	}
}
