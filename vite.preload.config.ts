import { defineConfig } from "vite";
import path from "node:path";

// https://vitejs.dev/config
export default defineConfig({
	build: {
		lib: {
			entry: {
				"main-preload": path.resolve("src/preload/main-preload.ts"),
				"settings-preload": path.resolve("src/preload/settings-preload.ts"),
				"mini-preload": path.resolve("src/preload/mini-preload.ts"),
			},
		},
	},
});
