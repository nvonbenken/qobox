import { defineConfig } from "vite";

export default defineConfig({
	build: {
		target: "node22",
		rollupOptions: {
			external: [
				"electron",
				"fs",
				"path",
				"url",
				"os",
				"events",
				"mpris-service",
				"x11",
				// Critical: optional native deps used by ws
				"bufferutil",
				"utf-8-validate",
				// Optional: externalize ws too if needed
				// 'ws',
			],
		},
	},
});
