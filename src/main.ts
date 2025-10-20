import path from "node:path";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import started from "electron-squirrel-startup";
import { globalEvents } from "./constants/globalEvents";
import { settings } from "./constants/settings";
import { initRPC, rpc, unRPC } from "./features/discord/discord";
import { addMenu } from "./features/menu/menu";
import { addTray, refreshTray } from "./features/tray/tray";
import type { MediaInfo } from "./models/mediaInfo";
import { MediaStatus } from "./models/mediaStatus";
import {
	closeSettingsWindow,
	createSettingsWindow,
	hideSettingsWindow,
	settingsStore,
	showSettingsWindow,
} from "./store/settingsStore";
import {
	acquireInhibitorIfInactive,
	releaseInhibitorIfActive,
} from "./utils/idleInhibitor";
import { Logger } from "./utils/logger";
import { updateMediaInfo } from "./utils/mediaInfo";
import { initMpris } from "./utils/mpris";
import { assetPath } from "./utils/paths";
import { SharingService } from "./utils/sharingService";

let mprisPlayer = null;
let mainInhibitorId = -1;

const QOBUZ_URL = "https://play.qobuz.com";
const ICON_PATH = assetPath("icons", "icon.png");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

let mainWindow: BrowserWindow;

function syncMenuBarWithStore() {
	const fixedMenuBar = !!settingsStore.get(settings.menuBar);

	mainWindow.autoHideMenuBar = !fixedMenuBar;
	mainWindow.setMenuBarVisibility(fixedMenuBar);
}

function setMacDockIcon() {
	if (process.platform !== "darwin") return;
	const iconPath = assetPath("icons", "icon.png");
	app.dock.setIcon(iconPath);
}

const createWindow = () => {
	// Create the browser window.clear
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		title: "Qobox",
		autoHideMenuBar: true,
		icon: ICON_PATH,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			partition: "persist:qobuz", // keeps login sessions
			spellcheck: false,
		},
	});

	mprisPlayer = initMpris(mainWindow);
	syncMenuBarWithStore();

	// and load the index.html of the app.
	mainWindow.loadURL(QOBUZ_URL);

	// Open the DevTools.
	// mainWindow.webContents.openDevTools();

	mainWindow.on("close", (event: CloseEvent) => {
		if (settingsStore.get(settings.minimizeOnClose)) {
			event.preventDefault();
			mainWindow.hide();
			// refreshTray(mainWindow);
		}
		return false;
	});

	// Emitted when the window is closed.
	mainWindow.on("closed", () => {
		releaseInhibitorIfActive(mainInhibitorId);
		closeSettingsWindow();
		app.quit();
	});

	mainWindow.on("resize", () => {
		const { width, height } = mainWindow.getBounds();
		settingsStore.set(settings.windowBounds.root, { width, height });
	});

	// open external links in default browser
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: "deny" };
	});
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
	setMacDockIcon();
	createWindow();
	addMenu(mainWindow);
	createSettingsWindow();

	if (settingsStore.get(settings.trayIcon)) {
		addTray(mainWindow, { icon: ICON_PATH });
		refreshTray(mainWindow);
	}
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

ipcMain.on(globalEvents.updateInfo, (_event, arg: MediaInfo) => {
	updateMediaInfo(arg);
	if (arg.status === MediaStatus.playing) {
		mainInhibitorId = acquireInhibitorIfInactive(mainInhibitorId);
	} else {
		releaseInhibitorIfActive(mainInhibitorId);
		mainInhibitorId = -1;
	}
});

ipcMain.on(globalEvents.hideSettings, () => {
	hideSettingsWindow();
});
ipcMain.on(globalEvents.showSettings, () => {
	showSettingsWindow();
});

ipcMain.on(globalEvents.refreshMenuBar, () => {
	syncMenuBarWithStore();
});

ipcMain.on(globalEvents.storeChanged, () => {
	syncMenuBarWithStore();

	if (settingsStore.get(settings.enableDiscord) && !rpc) {
		initRPC();
	} else if (!settingsStore.get(settings.enableDiscord) && rpc) {
		unRPC();
	}
});

ipcMain.on(globalEvents.error, (event) => {
	console.log(event);
});

ipcMain.handle(globalEvents.getUniversalLink, async (event, url) => {
	return SharingService.getUniversalLink(url);
});

Logger.watch(ipcMain);
