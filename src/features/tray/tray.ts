import { type BrowserWindow, Tray } from "electron";
import { getMenu } from "../menu/menu";

let tray: Tray;

export const addTray = (mainWindow: BrowserWindow, options = { icon: "" }) => {
	tray = new Tray(options.icon);
	tray.setIgnoreDoubleClickEvents(true);
	tray.setToolTip("Qobox");

	const menu = getMenu(mainWindow);

	tray.setContextMenu(menu);

	tray.on("click", () => {
		if (mainWindow.isVisible()) {
			if (!mainWindow.isFocused()) {
				mainWindow.focus();
			} else {
				mainWindow.hide();
			}
		} else {
			mainWindow.show();
		}
	});
};

export const refreshTray = (mainWindow: BrowserWindow) => {
	if (!tray) {
		addTray(mainWindow);
	}
};
