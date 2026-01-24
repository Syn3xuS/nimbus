/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs/promises";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db.json");

type DB = {
	users: any[];
	sessions: any[];
};

export async function readDB(): Promise<DB> {
	const data = await fs.readFile(DB_PATH, "utf-8");
	return JSON.parse(data);
}

export async function writeDB(data: DB) {
	await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}
