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
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
