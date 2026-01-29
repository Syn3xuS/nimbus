/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs").promises;
const path = require("path");

const OUT_FILE = path.join(process.cwd(), "ALL_CODE.md");
const EXCLUDE_DIRS = new Set([
	"node_modules",
	".git",
	".next",
	"dist",
	"out",
	".vercel",
	"public",
	"pnpm-store",
]);
const SKIP_FILES = new Set(["ALL_CODE.md"]);

const extMap = {
	".ts": "ts",
	".tsx": "tsx",
	".js": "js",
	".jsx": "jsx",
	".css": "css",
	".scss": "scss",
	".md": "markdown",
	".json": "json",
	".html": "html",
	".py": "python",
	".java": "java",
	".rs": "rust",
	".go": "go",
	".sh": "bash",
};

async function isText(filePath) {
	try {
		const buf = await fs.readFile(filePath);
		for (let i = 0; i < Math.min(buf.length, 8000); i++) {
			if (buf[i] === 0) return false;
		}
		return true;
	} catch (e) {
		return false;
	}
}

function fenceLangFor(filePath) {
	const ext = path.extname(filePath).toLowerCase();
	return extMap[ext] || "";
}

async function walk(dir, writeStream) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const ent of entries) {
		const name = ent.name;
		if (EXCLUDE_DIRS.has(name)) continue;
		const full = path.join(dir, name);
		if (ent.isDirectory()) {
			await walk(full, writeStream);
		} else if (ent.isFile()) {
			if (SKIP_FILES.has(name)) continue;
			try {
				const isTxt = await isText(full);
				if (!isTxt) continue;
				const rel = path
					.relative(process.cwd(), full)
					.split(path.sep)
					.join("/");
				const content = await fs.readFile(full, "utf8");
				const lang = fenceLangFor(full);
				await writeStream.write(`${rel}\n`);
				await writeStream.write("```" + (lang ? lang : "") + "\n");
				await writeStream.write(content + "\n");
				await writeStream.write("```\n\n");
			} catch (e) {
				// skip problematic files
			}
		}
	}
}

async function main() {
	try {
		const header = `# ALL_CODE.md\nGenerated: ${new Date().toISOString()}\n\n`;
		await fs.writeFile(OUT_FILE, header, "utf8");
		const handle = await fs.open(OUT_FILE, "a");
		const stream = handle.createWriteStream({ encoding: "utf8" });

		// only collect from these roots
		const roots = ["app", "lib"];
		for (const r of roots) {
			const rootPath = path.join(process.cwd(), r);
			try {
				const st = await fs.stat(rootPath);
				if (st.isDirectory()) {
					await stream.write(`## ${r}\n\n`);
					await walk(rootPath, stream);
				}
			} catch (e) {
				// ignore missing directories
			}
		}

		stream.end();
		await handle.close();
		console.log("Wrote", OUT_FILE);
	} catch (e) {
		console.error("Error:", e);
		process.exitCode = 1;
	}
}

main();
