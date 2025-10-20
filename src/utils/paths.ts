// src/main/assetPath.ts
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

export function assetPath(...segments: string[]) {
	const rel = path.join(...segments);

	// Candidates to try, in order:
	const candidates = [
		// Dev: project public/
		path.join(process.cwd(), "public", rel),
		// Dev (Forge/Vite sometimes changes cwd): app root public/
		path.join(app.getAppPath(), "public", rel),
		// Packaged: copy under resources root (see step 2)
		path.join(process.resourcesPath, rel),
		// Packaged: inside app.asar if you bundled public there
		path.join(app.getAppPath(), rel),
	];

	for (const p of candidates) {
		if (fs.existsSync(p)) return p;
	}

	// Log all tried paths to help debugging once
	console.warn("[assetPath] Not found. Tried:\n" + candidates.join("\n"));
	// Return the first dev candidate to keep loadFile from crashing
	return candidates[0];
}
