import type { BrowserWindow } from "electron";

export const initMpris = async (mainWindow: BrowserWindow) => {
	if (process.platform !== "linux") return;

	let Mpris;
	try {
		const mod = await import("mpris-service");
		Mpris = mod.default || mod; // handle CJS/ESM
	} catch (e) {
		console.warn("MPRIS not available:", e);
		return;
	}

	const player = Mpris({
		name: "qobox",
		identity: "Qobox",
		supportedUriSchemes: ["https"],
		supportedMimeTypes: ["audio/flac", "audio/aac", "audio/mpeg"],
		supportedInterfaces: ["player"],
	});

	// Transport controls -> click the Qobuz UI
	const click = (js) =>
		mainWindow?.webContents.executeJavaScript(js).catch(() => {});

	player.on("playpause", () =>
		click(`document.querySelector('[data-testid="player-toggle"]')?.click()`),
	);
	player.on("play", () =>
		click(
			`(document.querySelector('[data-testid="player-toggle"]')?.ariaPressed==="false") && document.querySelector('[data-testid="player-toggle"]')?.click()`,
		),
	);
	player.on("pause", () =>
		click(
			`(document.querySelector('[data-testid="player-toggle"]')?.ariaPressed==="true") && document.querySelector('[data-testid="player-toggle"]')?.click()`,
		),
	);
	player.on("next", () =>
		click(`document.querySelector('[data-testid="player-next"]')?.click()`),
	);
	player.on("previous", () =>
		click(`document.querySelector('[data-testid="player-prev"]')?.click()`),
	);
	player.on("stop", () =>
		click(`document.querySelector('[data-testid="player-stop"]')?.click()`),
	);

	// Expose a small IPC to update MPRIS metadata from the renderer
	const { ipcMain } = await import("electron");
	ipcMain.on("now-playing:update", (_ev, payload) => {
		const {
			title,
			artist,
			album,
			artUrl,
			durationMs,
			positionMs,
			canNext,
			canPrev,
			playing,
		} = payload;

		player.metadata = {
			"mpris:trackid": player.objectPath(`track/${Date.now()}`),
			"mpris:length": Math.max(0, (durationMs || 0) * 1000), // microseconds
			"mpris:artUrl": artUrl || undefined,
			"xesam:title": title || "",
			"xesam:artist": artist ? [artist] : [],
			"xesam:album": album || "",
			"xesam:url": undefined,
		};

		player.playbackStatus = playing ? "Playing" : "Paused";
		player.canGoNext = !!canNext;
		player.canGoPrevious = !!canPrev;

		// position reporting (best-effort)
		if (typeof positionMs === "number") {
			try {
				player.seeked(BigInt(positionMs * 1000));
			} catch {}
		}
	});

	return player;
};
