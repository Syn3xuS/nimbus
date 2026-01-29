# ALL_CODE.md
Generated: 2026-01-27T16:34:59.765Z

## app

app/api/auth/login/route.ts
```ts
import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/services/auth/login";
import { readDB, writeDB } from "@/lib/db/db";

export async function POST(req: NextRequest) {
	try {
		const { email, password } = await req.json();

		const user = await loginUser({ email, password });

		const token = crypto.randomUUID();

		const db = await readDB();
		db.sessions.push({
			token,
			userId: user.id,
			createdAt: new Date().toISOString(),
		});
		await writeDB(db);

		const res = NextResponse.json({ ok: true });

		res.cookies.set("auth_token", token, {
			httpOnly: true,
			path: "/",
		});

		return res;
	} catch (e) {
		return NextResponse.json(
			{
				message: e instanceof Error ? e.message : "Login failed",
			},
			{ status: 401 },
		);
	}
}

```

app/api/auth/me/route.ts
```ts
import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db/db";

export async function GET(req: NextRequest) {
	const token = req.cookies.get("auth_token")?.value;
	if (!token) {
		return NextResponse.json({ user: null }, { status: 401 });
	}

	const db = await readDB();

	const session = db.sessions.find((s) => s.token === token);
	if (!session) {
		const res = NextResponse.json({ user: null }, { status: 401 });
		res.cookies.set("auth_token", "", {
			path: "/",
			maxAge: 0,
		});
		return res;
	}

	const user = db.users.find((u) => u.id === session.userId);
	if (!user) {
		const res = NextResponse.json({ user: null }, { status: 401 });
		res.cookies.set("auth_token", "", {
			path: "/",
			maxAge: 0,
		});
		return res;
	}

	return NextResponse.json({
		user: {
			username: user.username,
			email: user.email,
		},
	});
}

```

app/api/auth/register/route.ts
```ts
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

```

app/api/files/[username]/route.ts
```ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/db";
import { initDb } from "@/lib/db/init";
import {
	getPresignedUploadUrl,
	registerFile,
	listFilesByUsername,
	getObjectStream,
} from "@/lib/services/files/files";

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ username: string }> },
) {
	const { params } = context;
	const { username } = await params;

	const db = getPool();
	await initDb(db);

		const token = req.cookies.get("auth_token")?.value;
	if (!token) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const sessRes = await db.query(
		"SELECT user_id FROM sessions WHERE token = $1",
		[token],
	);
	if (sessRes.rowCount === 0) {
		const res = NextResponse.json(
			{ message: "Unauthorized" },
			{ status: 401 },
		);
		res.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
		return res;
	}

	const sessionUserId = sessRes.rows[0].user_id;

		const userRes = await db.query("SELECT id FROM users WHERE username = $1", [
		username,
	]);
	if (userRes.rowCount === 0)
		return NextResponse.json(
			{ message: "User not found" },
			{ status: 404 },
		);
	const ownerId = userRes.rows[0].id;
	if (ownerId !== sessionUserId)
		return NextResponse.json({ message: "Forbidden" }, { status: 403 });

		const downloadId = req.nextUrl.searchParams.get("downloadId");
	if (downloadId) {
		const res = await db.query(
			`SELECT f.object_key, f.filename, f.content_type FROM files f JOIN users u ON f.user_id = u.id WHERE f.id = $1 AND u.username = $2`,
			[downloadId, username],
		);
		if (res.rowCount === 0)
			return NextResponse.json(
				{ message: "File not found" },
				{ status: 404 },
			);
		const key = res.rows[0].object_key;
		const filename = res.rows[0].filename;
		const contentType =
			res.rows[0].content_type ?? "application/octet-stream";

				const s3res = await getObjectStream(key);
		const body = s3res.Body as unknown as BodyInit;
		if (!body)
			return NextResponse.json(
				{ message: "Empty object body" },
				{ status: 500 },
			);

		const headers = new Headers();
		headers.set("Content-Type", contentType);
		headers.set(
			"Content-Disposition",
			`attachment; filename="${encodeURIComponent(filename)}"`,
		);

		return new Response(body, { status: 200, headers });
	}

		const files = await listFilesByUsername(username);
	const withUrls = files.map((f) => ({
		...f,
		url: `/api/files/${username}?downloadId=${f.id}`,
	}));

	return NextResponse.json({ files: withUrls });
}

export async function POST(
	req: NextRequest,
	context: { params: Promise<{ username: string }> },
) {
	const { params } = context;
	const { username } = await params;
	const body = await req.json();

	const db = getPool();
	await initDb(db);
	const userRes = await db.query("SELECT id FROM users WHERE username = $1", [
		username,
	]);
	if (userRes.rowCount === 0)
		return NextResponse.json(
			{ message: "User not found" },
			{ status: 404 },
		);
	const userId = userRes.rows[0].id;

		const token = req.cookies.get("auth_token")?.value;
	if (!token)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

	const sessRes = await db.query(
		"SELECT user_id FROM sessions WHERE token = $1",
		[token],
	);
	if (sessRes.rowCount === 0) {
		const res = NextResponse.json(
			{ message: "Unauthorized" },
			{ status: 401 },
		);
		res.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
		return res;
	}

	const sessionUserId = sessRes.rows[0].user_id;
	if (sessionUserId !== userId)
		return NextResponse.json({ message: "Forbidden" }, { status: 403 });

	const action = body?.action;
	if (action === "presign") {
		const { filename, contentType } = body;
		if (!filename)
			return NextResponse.json(
				{ message: "filename required" },
				{ status: 400 },
			);
		const path = body?.path ?? "/";
		const presign = await getPresignedUploadUrl(
			filename,
			contentType ?? "application/octet-stream",
		);
		return NextResponse.json({ ...presign, path });
	}

	if (action === "register") {
		const { key, filename, size, contentType, path, isFolder } = body;
		if (!key || !filename)
			return NextResponse.json(
				{ message: "key and filename required" },
				{ status: 400 },
			);
		const file = await registerFile(
			userId,
			key,
			filename,
			path ?? "/",
			Boolean(isFolder),
			size,
			contentType,
		);
		return NextResponse.json({ file });
	}

	if (action === "mkdir") {
		const { name, path } = body;
		if (!name)
			return NextResponse.json(
				{ message: "name required" },
				{ status: 400 },
			);
				const parentPath = (path ?? "/").replace(/\/$/, "") + "/";
		const file = await registerFile(userId, null, name, parentPath, true);
		return NextResponse.json({ folder: file });
	}

	if (action === "delete") {
		const { id } = body;
		if (!id)
			return NextResponse.json(
				{ message: "id required" },
				{ status: 400 },
			);
		try {
			await (
				await import("@/lib/services/files/files")
			).deleteFile(userId, id);
			return NextResponse.json({ ok: true });
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			return NextResponse.json(
				{ message: msg ?? "delete error" },
				{ status: 500 },
			);
		}
	}

	return NextResponse.json({ message: "unknown action" }, { status: 400 });
}

```

app/api/users/[username]/route.ts
```ts
import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db/db";

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ username: string }> },
) {
	const { params } = context;
	const { username } = await params; 
	const db = await readDB();

	const user = db.users.find((u) => u.username === username);

	if (!user) {
		return NextResponse.json(
			{ message: "User not found" },
			{ status: 404 },
		);
	}

	return NextResponse.json({
		user: {
			username: user.username,
			email: user.email, 			createdAt: user.createdAt,
		},
	});
}

```

app/auth/login/page.tsx
```tsx
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

```

app/auth/register/page.tsx
```tsx
"use client";

import { useState } from "react";
import Case from "@/lib/ui/case/Case";

export default function Page() {
	const [error, setError] = useState<string | null>(null);

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
			await new Promise((r) => setTimeout(r, 2000));
			window.location.href = "/";
		} else {
			const data = await res.json();
			setError(data.message ?? "Registration failed");
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

					{error && <p>{error}</p>}
				</form>
			</Case>
		</>
	);
}

```

app/disk/page.tsx
```tsx
import Case from "@/lib/ui/case/Case";

export default function page() {
	return (
		<>
			<Case>
				Страница - файловый менеджер, задумано что человек здесь смотрит
				всё то что ему доступно на его диске и дисках которые ему
				доступны
			</Case>
		</>
	);
}

```

app/disk/[username]/Case.module.css
```css
.case_center {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

```

app/disk/[username]/DiskClient.module.css
```css


.container {
	background: var(--bg);
	color: var(--text);
	padding: 16px;
	border-radius: 8px;
	width: 80%;
	min-height: 70vh;
}
.toolbar {
	display: flex;
	gap: 8px;
	align-items: center;
	margin-bottom: 12px;
}
.breadcrumb {
	color: var(--muted);
	font-size: 14px;
}
.list {
	list-style: none;
	padding: 0;
	margin: 0;
}
.item {
	display: flex;

	align-items: center;
	justify-content: space-between;
	padding: 8px 10px;
	background: linear-gradient(90deg, rgba(255, 255, 255, 0.02), transparent);
	border-radius: 6px;
	margin-bottom: 8px;
}

.item a {
	display: inline;
}
.itemName {
	color: var(--text);
}
.button {
	background: transparent;
	border: 1px solid rgba(255, 255, 255, 0.06);
	color: var(--accent);
	padding: 6px 8px;
	border-radius: 6px;
	cursor: pointer;
}
.input {
	background: transparent;
	border: 1px solid rgba(255, 255, 255, 0.06);
	color: var(--text);
	padding: 6px 8px;
	border-radius: 6px;
}
.folderIcon {
	color: var(--accent);
	margin-right: 8px;
}
.fileIcon {
	color: var(--muted);
	margin-right: 8px;
}

```

app/disk/[username]/DiskClient.tsx
```tsx
"use client";
import React, { useEffect, useState } from "react";
import styles from "./DiskClient.module.css";

type FileItem = {
	id: string;
	filename: string;
	size?: number;
	contentType?: string;
	key?: string;
	createdAt?: string;
	url?: string;
	path?: string;
	isFolder?: boolean;
};

const DiskClient = ({ username }: { username: string }) => {
	const [items, setItems] = useState<FileItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [currentPath, setCurrentPath] = useState("/");
	const [newFolder, setNewFolder] = useState("");

	async function load() {
		setLoading(true);
		try {
			const res = await fetch(`/api/files/${username}`);
			if (!res.ok) throw new Error("Failed to load files");
			const json = await res.json();
			setItems(json.files || []);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
			}, [username]);

	const folders = items.filter(
		(i) => i.isFolder && (i.path ?? "/") === currentPath,
	);
	const files = items.filter(
		(i) => !i.isFolder && (i.path ?? "/") === currentPath,
	);

	async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0];
		if (!f) return;
		try {
			const presignRes = await fetch(`/api/files/${username}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "presign",
					filename: f.name,
					contentType: f.type,
					path: currentPath,
				}),
			});
			const presign = await presignRes.json();
			if (!presign?.url) {
				alert("Не удалось получить presign url");
				return;
			}

			await fetch(presign.url, {
				method: "PUT",
				headers: {
					"Content-Type": f.type || "application/octet-stream",
				},
				body: f,
			});

			await fetch(`/api/files/${username}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "register",
					key: presign.key,
					filename: f.name,
					size: f.size,
					contentType: f.type,
					path: currentPath,
				}),
			});

			await load();
		} catch (err) {
			console.error(err);
			alert("Ошибка загрузки");
		}
	}

	async function createFolder() {
		if (!newFolder) return;
		try {
			await fetch(`/api/files/${username}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "mkdir",
					name: newFolder,
					path: currentPath,
				}),
			});
			setNewFolder("");
			await load();
		} catch (e) {
			console.error(e);
		}
	}

	async function handleDelete(id: string) {
		if (!confirm("Удалить?")) return;
		try {
			await fetch(`/api/files/${username}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "delete", id }),
			});
			await load();
		} catch (e) {
			console.error(e);
		}
	}

	return (
		<div className={styles.container}>
			<div className={styles.toolbar}>
				<div className={styles.breadcrumb}>Path: {currentPath}</div>
				<input
					className={styles.input}
					type="file"
					onChange={handleFile}
				/>
				<input
					className={styles.input}
					placeholder="New folder"
					value={newFolder}
					onChange={(e) => setNewFolder(e.target.value)}
				/>
				<button className={styles.button} onClick={createFolder}>
					Create
				</button>
			</div>

			{loading ? (
				<div>Загружаю...</div>
			) : (
				<ul className={styles.list}>
					{currentPath !== "/" && (
						<li className={styles.item}>
							<button
								className={styles.button}
								onClick={() =>
									setCurrentPath(
										currentPath.replace(/[^\/]+\/?$/, ""),
									)
								}
							>
								..
							</button>
						</li>
					)}

					{folders.map((f) => (
						<li key={f.id} className={styles.item}>
							<div>
								<span className={styles.folderIcon}>📁</span>
								<button
									className={styles.button}
									onClick={() =>
										setCurrentPath(
											(f.path ?? "/").replace(/\/$/, "") +
												"/" +
												f.filename +
												"/",
										)
									}
								>
									{f.filename}
								</button>
							</div>
							<div>
								<button
									className={styles.button}
									onClick={() => handleDelete(f.id)}
								>
									Удалить
								</button>
							</div>
						</li>
					))}

					{files.map((f) => (
						<li key={f.id} className={styles.item}>
							<div>
								<span className={styles.fileIcon}>📄</span>
								<a
									className={styles.itemName}
									href={`/api/files/${username}?downloadId=${f.id}`}
								>
									{f.filename}
								</a>
							</div>
							<div>
								<button
									className={styles.button}
									onClick={() => handleDelete(f.id)}
								>
									Удалить
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default DiskClient;

```

app/disk/[username]/page.tsx
```tsx
import Case from "@/lib/ui/case/Case";
import DiskClient from "./DiskClient";
import { cookies } from "next/headers";
import { getPool } from "@/lib/db/db";
import { initDb } from "@/lib/db/init";

import styles_case from "./Case.module.css"

export default async function page({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;

	const cookieStore = await cookies();
	const token = cookieStore.get("auth_token")?.value;

	if (!token) {
		return (
			<>
				<Case>
					<h1>Доступ к диску закрыт</h1>
					<p>Вы не имеете доступа к этому диску.</p>
				</Case>
			</>
		);
	}

	const db = getPool();
	await initDb(db);

	const sess = await db.query(
		"SELECT user_id FROM sessions WHERE token = $1",
		[token],
	);
	if (sess.rowCount === 0) {
		return (
			<>
				<Case>
					<h1>Доступ к диску закрыт</h1>
					<p>Вы не имеете доступа к этому диску.</p>
				</Case>
			</>
		);
	}

	const sessionUserId = sess.rows[0].user_id as string;
	const userRes = await db.query("SELECT id FROM users WHERE username = $1", [
		username,
	]);
	if (userRes.rowCount === 0) {
		return (
			<>
				<Case>
					<h1>Доступ к диску закрыт</h1>
					<p>Пользователь не найден.</p>
				</Case>
			</>
		);
	}

	const ownerId = userRes.rows[0].id as string;
	if (ownerId !== sessionUserId) {
		return (
			<>
				<Case>
					<h1>Доступ к диску закрыт</h1>
					<p>Вы не имеете доступа к этому диску.</p>
				</Case>
			</>
		);
	}

	return (
		<>
			<Case className={styles_case.case_center}>
				<h1>Диск пользователя: {username}</h1>
				<DiskClient username={username} />
			</Case>
		</>
	);
}

```

app/globals.css
```css
@import "tailwindcss";


:root {
	--background: #fbfbfb;
	--backgroundTo: #f4f4f4;
	--foreground: #171717;
	--accent: #3abbec;

	--bg: #0f172a;
	--card: #0b1220;
	--text: #e6eef8;
	--muted: #9aa7bb;
}

@theme inline {
	--color-background: var(--background);
	--color-foreground: var(--foreground);
	--color-accent: var(--accent);
	--font-sans: var(--font-geist-sans);
	--font-mono: var(--font-geist-mono);
}


@media (prefers-color-scheme: dark) {
	:root {
		--background: #0a0a0a;
		--foreground: #ededed;
		--backgroundTo: rgb(14, 14, 14);

		--accent: #1c69d8;
	}
}

body {
	background: var(--background);
	color: var(--foreground);
	font-family: Arial, Helvetica, sans-serif;
}

html,
body {
	width: 100%;
	height: 100%;
}

.link {
	color: var(--accent);
}

a {
	display: block;
	width: max-content;
	height: max-content;
}

.authButtons {
	display: flex;
	gap: 0.75rem;
}

```

app/layout.tsx
```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Header from "@/lib/ui/header/Header";
import Main from "@/lib/ui/main/Main";
import Footer from "@/lib/ui/footer/Footer";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Nimbus | Cloud",
	description: "Nimbus - быстрое облако на коленке",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ru">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Header />
				<Main>{children}</Main>
				<Footer />
			</body>
		</html>
	);
}

```

app/page.tsx
```tsx
import Case from "@/lib/ui/case/Case";
import Link from "next/link";

export default function page() {
	return (
		<>
			<Case>
				<p>Главная страница</p>
				<div>
					<p>
						<Link className="link" href={"/auth/login"}>
							Вход
						</Link>
					</p>
					<p>
						<Link className="link" href={"/auth/register"}>
							Регистрация
						</Link>
					</p>
				</div>
			</Case>
		</>
	);
}

```

app/profile/[username]/page.tsx
```tsx
import Case from "@/lib/ui/case/Case";

type Props = {
	params: Promise<{ username: string }>; };

async function getUser(username: string) {
	const res = await fetch(`http://localhost:3000/api/users/${username}`, {
		cache: "no-store",
	});

	if (!res.ok) return null;
	return res.json();
}

export default async function page({ params }: Props) {
	const { username } = await params; 
	const data = await getUser(username); 
	if (!data) {
		return <h1>User not found</h1>;
	}

	return (
		<>
		<Case>
			<div>
				<h1>{data.user.username}</h1>
				<p>Email: {data.user.email}</p>
				<p>Joined: {data.user.createdAt}</p>
			</div>
		</Case>
		</>
	);
}

```

## lib

lib/db/db.ts
```ts
import { Pool } from "pg";
import { initDb } from "./init";

type User = {
	id: string;
	email: string;
	username: string;
	passwordHash: string;
	createdAt: string;
};

type Session = {
	token: string;
	userId: string;
	createdAt: string;
};

type DB = {
	users: User[];
	sessions: Session[];
};

let pool: Pool | null = null;

function getPool() {
	if (!pool) {
		pool = new Pool({
			user: "dev",
			password: "dev",
			host: "localhost",
			port: 5432, 			database: "app",
		});
	}
	return pool;
}

export { getPool };

export async function readDB(): Promise<DB> {
	const db = getPool();
	await initDb(db);

	const [usersRes, sessionsRes] = await Promise.all([
		db.query("SELECT * FROM users ORDER BY created_at"),
		db.query("SELECT * FROM sessions ORDER BY created_at"),
	]);

	return {
		users: usersRes.rows.map((u) => ({
			id: u.id,
			email: u.email,
			username: u.username,
			passwordHash: u.password_hash,
			createdAt: u.created_at,
		})),
		sessions: sessionsRes.rows.map((s) => ({
			token: s.token,
			userId: s.user_id,
			createdAt: s.created_at,
		})),
	};
}

export async function writeDB(data: DB) {
	const db = getPool();
	await initDb(db);

	const client = await db.connect();
	try {
		await client.query("BEGIN");

				await client.query("TRUNCATE users, sessions RESTART IDENTITY CASCADE");

				for (const user of data.users) {
						const passwordHash = user.passwordHash ?? "temp_hash";
			const createdAt = user.createdAt ?? new Date().toISOString();

			await client.query(
				`
        INSERT INTO users (id, email, username, password_hash, created_at)
        VALUES ($1, $2, $3, $4, $5)
        `,
				[user.id, user.email, user.username, passwordHash, createdAt],
			);
		}

				for (const session of data.sessions) {
			const createdAt = session.createdAt ?? new Date().toISOString();

			await client.query(
				`
        INSERT INTO sessions (token, user_id, created_at)
        VALUES ($1, $2, $3)
        `,
				[session.token, session.userId, createdAt],
			);
		}

		await client.query("COMMIT");
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

```

lib/db/init.ts
```ts
import { Pool } from "pg";

let initialized = false;

export async function initDb(pool: Pool) {
	if (initialized) return;

		await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        object_key TEXT,
        filename TEXT NOT NULL,
        path TEXT NOT NULL DEFAULT '/',
        is_folder BOOLEAN NOT NULL DEFAULT FALSE,
        size BIGINT,
        content_type TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
  `);

		await pool.query(`
    ALTER TABLE files ADD COLUMN IF NOT EXISTS path TEXT NOT NULL DEFAULT '/';
    ALTER TABLE files ADD COLUMN IF NOT EXISTS is_folder BOOLEAN NOT NULL DEFAULT FALSE;
    -- allow object_key to be NULL for folder entries
    ALTER TABLE files ALTER COLUMN object_key DROP NOT NULL;
    `);

				try {
		await pool.query(`
      UPDATE files
      SET path = regexp_replace(path, '/' || filename || '/$', '/', '')
      WHERE is_folder = TRUE AND path ~ ('/' || filename || '/$');
    `);
	} catch (e) {
				console.warn("files: folder-normalize migration failed", e);
	}

	initialized = true;
	console.log("🐘 Postgres (Docker) initialized");
}

```

lib/services/auth/login.ts
```ts
import argon2 from "argon2";
import { readDB } from "@/lib/db/db";

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

```

lib/services/auth/register.ts
```ts
import argon2 from "argon2";
import { readDB, writeDB } from "@/lib/db/db";

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

```

lib/services/files/files.ts
```ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { getPool } from "@/lib/db/db";
import { initDb } from "@/lib/db/init";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
const MINIO_REGION = process.env.MINIO_REGION ?? "us-east-1";
const MINIO_ACCESS_KEY =
	process.env.MINIO_ROOT_USER ?? process.env.MINIO_ACCESS_KEY ?? "minio";
const MINIO_SECRET_KEY =
	process.env.MINIO_ROOT_PASSWORD ??
	process.env.MINIO_SECRET_KEY ??
	"minio123";
const MINIO_BUCKET = process.env.MINIO_BUCKET ?? "nimbus";

const s3 = new S3Client({
	endpoint: MINIO_ENDPOINT,
	region: MINIO_REGION,
	credentials: {
		accessKeyId: MINIO_ACCESS_KEY,
		secretAccessKey: MINIO_SECRET_KEY,
	},
	forcePathStyle: true,
});

async function ensureBucketExists() {
	try {
		await s3.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
	} catch (err: any) {
				const code = err?.Code ?? err?.code ?? err?.name;
		const msg = String(err?.message ?? "");
		const isAlreadyOwned =
			code === "BucketAlreadyOwnedByYou" ||
			code === "BucketAlreadyExists" ||
			/BucketAlreadyOwnedByYou|BucketAlreadyExists/.test(msg);
		if (!isAlreadyOwned) {
						throw err;
		}
	}
}

export async function getPresignedUploadUrl(
	filename: string,
	contentType: string,
) {
	await ensureBucketExists();
	const key = `${Date.now()}_${Math.random().toString(36).slice(2)}_${filename}`;
	const cmd = new PutObjectCommand({
		Bucket: MINIO_BUCKET,
		Key: key,
		ContentType: contentType,
	});
	const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 60 });
	return { url, key };
}

async function getPresignedDownloadUrl(key: string) {
	await ensureBucketExists();
	const cmd = new GetObjectCommand({ Bucket: MINIO_BUCKET, Key: key });
	const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 60 });
	return url;
}

export async function getObjectStream(key: string) {
	await ensureBucketExists();
	const cmd = new GetObjectCommand({ Bucket: MINIO_BUCKET, Key: key });
	const res = await s3.send(cmd);
	return res;
}

export async function registerFile(
	userId: string,
	key: string | null,
	filename: string,
	path: string = "/",
	isFolder: boolean = false,
	size?: number,
	contentType?: string,
) {
	const db = getPool();
	await initDb(db);
	const id = randomUUID();
	await db.query(
		`INSERT INTO files (id, user_id, object_key, filename, path, is_folder, size, content_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		[
			id,
			userId,
			key,
			filename,
			path,
			isFolder,
			size ?? null,
			contentType ?? null,
		],
	);
	return {
		id,
		userId,
		key,
		filename,
		path,
		isFolder,
		size,
		contentType,
	};
}

export async function listFilesByUsername(username: string) {
	const db = getPool();
	await initDb(db);
	const res = await db.query(
		`SELECT f.id, f.filename, f.size, f.content_type, f.object_key, f.created_at
		 , f.path, f.is_folder
		 FROM files f JOIN users u ON f.user_id = u.id
     WHERE u.username = $1
     ORDER BY f.created_at DESC`,
		[username],
	);
	return res.rows.map((r: any) => ({
		id: r.id,
		filename: r.filename,
		path: r.path,
		isFolder: r.is_folder,
		size: r.size,
		contentType: r.content_type,
		key: r.object_key,
		createdAt: r.created_at,
	}));
}

export async function deleteFile(userId: string, id: string) {
	const db = getPool();
	await initDb(db);
		const metaRes = await db.query(
		`SELECT id, filename, path, is_folder, object_key FROM files WHERE id = $1 AND user_id = $2`,
		[id, userId],
	);
	if (metaRes.rowCount === 0) {
		throw new Error("file not found");
	}
	const meta = metaRes.rows[0] as any;

	if (!meta.is_folder) {
				const key = meta.object_key as string | null;
		if (key) {
			await ensureBucketExists();
			await s3.send(
				new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: key }),
			);
		}
		await db.query(`DELETE FROM files WHERE id = $1`, [id]);
		return true;
	}

		const folderFullPath =
		(meta.path ?? "/").replace(/\/$/, "") + "/" + meta.filename + "/";

		const childrenRes = await db.query(
		`SELECT id, object_key FROM files WHERE path = $1 OR path LIKE $1 || '%'`,
		[folderFullPath],
	);

	const toDelete: { id: string; key: string | null }[] = childrenRes.rows.map(
		(r: any) => ({ id: r.id, key: r.object_key ?? null }),
	);
		toDelete.push({ id: meta.id, key: meta.object_key ?? null });

		const keys = toDelete.map((t) => t.key).filter(Boolean) as string[];
	if (keys.length > 0) {
		await ensureBucketExists();
		for (const k of keys) {
			try {
				await s3.send(
					new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: k }),
				);
			} catch (e) {
				console.warn("s3 delete object failed", k, e);
			}
		}
	}

		try {
		await db.query("BEGIN");
		for (const item of toDelete) {
			await db.query(`DELETE FROM files WHERE id = $1`, [item.id]);
		}
		await db.query("COMMIT");
	} catch (e) {
		await db.query("ROLLBACK");
		throw e;
	}

	return true;
}

```

lib/ui/Buttons/button/button.module.css
```css
.button {
	padding: 6px 14px;
	border-radius: 6px;
	font-weight: 500;
	text-decoration: none;
	transition: all 0.2s ease;
	color: var(--text);
	border: 1px solid var(--accent);
}

.button:hover {
	background: var(--accent);
	color: var(--background);
}

```

lib/ui/Buttons/button/button.tsx
```tsx
import styles from "./button.module.css";
const Button = ({
	children,
}: Readonly<{
	children?: React.ReactNode;
}>) => {
	return <button className={styles.button}>{children}</button>;
};

export default Button;

```

lib/ui/Buttons/Buttons.tsx
```tsx
export { default as Button } from "./button/button";
export { default as Button_fill } from "./button_fill/button_fill";


```

lib/ui/Buttons/button_fill/button_fill.module.css
```css
.button_fill {
	background: var(--accent);
	color: var(--background);
}

.button_fill:hover {
	opacity: 0.85;
}

```

lib/ui/Buttons/button_fill/button_fill.tsx
```tsx
import main_styles from "@/lib/ui/Buttons/button/button.module.css";
import styles from "./button_fill.module.css";

const Button_fill = ({
	children,
}: Readonly<{
	children?: React.ReactNode;
}>) => {
	return <button className={main_styles.button + " " + styles.button_fill}>{children}</button>;
};

export default Button_fill;

```

lib/ui/case/Case.module.css
```css
.case {
	width: 100%;
	min-height: calc(100vh - 50px);
}

```

lib/ui/case/Case.tsx
```tsx
import styles from "./Case.module.css";

type CaseProps = {
	children?: React.ReactNode;
	className?: string;
};

const Case = ({ children, className }: CaseProps) => {
	return (
		<div className={[styles.case, className || ""].join(" ")}>
			{children}
		</div>
	);
};

export default Case;

```

lib/ui/footer/Footer.module.css
```css
.footer {
	background: var(--backgroundTo);
	width: 100%;
	min-height: 50vh;
}

```

lib/ui/footer/Footer.tsx
```tsx
import styles from "./Footer.module.css";

const Footer = () => {
	return <footer className={styles.footer}></footer>;
};

export default Footer;

```

lib/ui/header/brand_banner/Brand_banner.module.css
```css
.brand_banner {
	height: 42px;
	display: flex;
	align-items: center;
}

.brand_banner_Link {
	height: 100%;
	display: flex;
	align-items: center;
	gap: 10px;
}
.brand_banner_Logo {
	height: 100%;
	width: auto;
}
.brand_banner_Text {
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--text);
}

```

lib/ui/header/brand_banner/Brand_banner.tsx
```tsx
import styles from "./Brand_banner.module.css";

import logo from "@/public/logo.svg";

import Image from "next/image";
import Link from "next/link";

const Brand_banner = () => {
	return (
		<>
			<div className={styles.brand_banner}>
				<Link className={styles.brand_banner_Link} href="/">
					<Image
						className={styles.brand_banner_Logo}
						src={logo}
						alt="Logo"
					/>
					<span className={styles.brand_banner_Text}>Nimbus</span>
				</Link>
			</div>
		</>
	);
};
export default Brand_banner;

```

lib/ui/header/Header.module.css
```css
.header {
	position: sticky;
	top: 0;
	z-index: 1000;

	display: flex;
	align-items: center;
	justify-content: space-between;

	width: 100%;
	height: 50px;

	background: var(--background);
	border-bottom: solid var(--accent) 2px;

	transition: transform 0.3s ease;
	padding: 0 1rem;
}

.show {
	transform: translateY(0);
}

.hide {
	transform: translateY(-100%);
}

```

lib/ui/header/Header.tsx
```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Header.module.css";

import { Button, Button_fill } from "@/lib/ui/Buttons/Buttons";
import User_card from "@/lib/ui/header/user_card/User_card";
import Brand_banner from "./brand_banner/Brand_banner";

const Header = () => {
	const [visible, setVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);

	useEffect(() => {
		const onScroll = () => {
			const currentScrollY = window.scrollY;

			if (currentScrollY < lastScrollY) {
				setVisible(true);
			} else if (currentScrollY > lastScrollY && currentScrollY > 25) {
				setVisible(false);
			}

			setLastScrollY(currentScrollY);
		};

		window.addEventListener("scroll", onScroll);
		return () => window.removeEventListener("scroll", onScroll);
	}, [lastScrollY]);

	const [username, setUsername] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const avatar_link = "";

	useEffect(() => {
		const loadMe = async () => {
			try {
				const res = await fetch("/api/auth/me");
				if (!res.ok) return;

				const data = await res.json();
				if (data?.user?.username) {
					setUsername(data.user.username);
				}
			} finally {
				setLoading(false);
			}
		};

		loadMe();
	}, []);

	return (
		<>
			<header
				className={`${styles.header} ${
					visible ? styles.show : styles.hide
				}`}
			>
				<Brand_banner></Brand_banner>

				<Link href={`/disk/${username ? username : ""}`}>Мой диск</Link>

				<div className="authButtons">
					{loading ? null : username ? (
						<>
							<User_card
								username={username}
								avatar_link={avatar_link}
							/>
						</>
					) : (
						<>
							<Link href="/auth/login" className={styles.signIn}>
								<Button>Sign In</Button>
							</Link>
							<Link
								href="/auth/register"
								className={styles.signUp}
							>
								<Button_fill>Sign Up</Button_fill>
							</Link>
						</>
					)}
				</div>
			</header>
		</>
	);
};

export default Header;

```

lib/ui/header/user_card/User_card.module.css
```css
.user_card {
	display: block;
	padding: 2px 18px;
	border-bottom: rgb(255, 255, 255) solid 2px;
	transition: transform 0.2s ease;
	-webkit-transition: transform 0.2s ease;
	-moz-transition: transform 0.2s ease;
	-ms-transition: transform 0.2s ease;
	-o-transition: transform 0.2s ease;
	&:hover {
		transform: scale(1.05);
		-webkit-transform: scale(1.05);
		-moz-transform: scale(1.05);
		-ms-transform: scale(1.05);
		-o-transform: scale(1.05);
}
}

.user_card div {
	display: flex;
	align-items: center;
	gap: 10px;
}
.user_card img {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	object-fit: cover;
}

```

lib/ui/header/user_card/User_card.tsx
```tsx
import styles from "./User_card.module.css";

import Image from "next/image";
import Link from "next/link";

import user_icon_default from "@/public/user.png";

const User_card = ({
	username,
	avatar_link,
}: {
	username: string;
	avatar_link: string;
}) => {
	return (
		<>
			<Link className={styles.user_card} href={`/profile/${username}`}>
				<div>
					<Image
						src={avatar_link || user_icon_default}
						alt="User Avatar"
						width={32}
						height={32}
					/>
					<div>{username}</div>
				</div>
			</Link>
		</>
	);
};

export default User_card;

```

lib/ui/main/Main.module.css
```css
.content {
	width: 100%;
	min-height: calc(100vh - 50px);
}
```

lib/ui/main/Main.tsx
```tsx
import styles from "./Main.module.css";

const Main = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return <main className={styles.content}>{children}</main>;
};

export default Main;

```

