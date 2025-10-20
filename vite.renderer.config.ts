import { defineConfig } from "vite";

export default defineConfig({
	build: {
		outDir: ".vite/renderer",
		rollupOptions: {
			input: {
				main: "index.html",
				settings: "src/pages/settings/settings.html",
			},
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@import "src/styles/variables";`,
			},
		},
	},
});
