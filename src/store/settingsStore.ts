import { BrowserWindow, shell } from "electron";
import Store from "electron-store";
import path from "path";
import { settings } from "../constants/settings";
import { assetPath } from "../utils/paths";

let settingsWindow: BrowserWindow;

export const settingsStore = new Store({
	defaults: {
		adBlock: false,
		advanced: {
			qobuzUrl: "https://play.qobuz.com",
		},
		api: true,
		apiSettings: {
			port: 47836,
			hostname: "127.0.0.1",
		},
		disableBackgroundThrottle: true,
		disableHardwareMediaKeys: false,
		enableCustomHotkeys: false,
		enableDiscord: false,
		discord: {
			showSong: true,
			showIdle: true,
			idleText: "Browsing Qobuz",
			usingText: "Playing media on Qobuz",
			includeTimestamps: true,
			detailsPrefix: "Listening to ",
			buttonText: "Play on Qobuz",
		},
		ListenBrainz: {
			enabled: false,
			api: "https://api.listenbrainz.org",
			token: "",
			delay: 5000,
		},
		flags: {
			disableHardwareMediaKeys: false,
			enableWaylandSupport: true,
			gpuRasterization: true,
		},
		menuBar: true,
		minimizeOnClose: false,
		mpris: false,
		notifications: true,
		playBackControl: true,
		singleInstance: true,
		skipArtists: false,
		skippedArtists: [""],
		staticWindowTitle: false,
		trayIcon: true,
		updateFrequency: 500,
		windowBounds: { width: 800, height: 600 },
	},
});

const settingsModule = {
	// settings,
	settingsWindow,
};

export const createSettingsWindow = () => {
	settingsWindow = new BrowserWindow({
		width: 650,
		height: 700,
		resizable: true,
		show: false,
		transparent: true,
		frame: false,
		title: "Qobox settings",
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			plugins: true,
			nodeIntegration: true,
			devTools: true,
		},
	});

	settingsWindow.on("close", (event: Event) => {
		if (settingsWindow != null) {
			event.preventDefault();
			settingsWindow.hide();
		}
	});

	settingsWindow.loadFile(assetPath("pages", "settings", "settings.html"));

	settingsWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: "deny" };
	});
	settingsModule.settingsWindow = settingsWindow;
};

export const showSettingsWindow = (tab = "general") => {
	if (!settingsWindow) {
		console.log("Settings window is not initialized. Attempting to create it.");
		createSettingsWindow();
	}
	settingsWindow.webContents.send("goToTab", tab);

	// refresh data just before showing the window
	settingsWindow.webContents.send("refreshData");
	settingsWindow.show();
};
export const hideSettingsWindow = () => {
	settingsWindow.hide();
};

export const closeSettingsWindow = () => {
	settingsWindow = null;
};

/**
 * add artists to the list of skipped artists
 * @param artists list of artists to append
 */
export const addSkippedArtists = (artists: string[]) => {
	const { skippedArtists } = settings;
	const previousStoreValue = settingsStore.get<string, string[]>(
		skippedArtists,
	);
	settingsStore.set(
		skippedArtists,
		Array.from(new Set([...previousStoreValue, ...artists])),
	);
};

/**
 * Remove artists from the list of skipped artists
 * @param artists list of artists to remove
 */
export const removeSkippedArtists = (artists: string[]) => {
	const { skippedArtists } = settings;
	const previousStoreValue = settingsStore.get<string, string[]>(
		skippedArtists,
	);
	const filteredArtists = previousStoreValue.filter(
		(value: string) => ![...artists].includes(value),
	);

	settingsStore.set(skippedArtists, filteredArtists);
};
