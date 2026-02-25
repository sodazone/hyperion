import { defineConfig } from "vite";

export default defineConfig({
	root: "src/client",
	build: {
		outDir: "../../public/js",
		emptyOutDir: true,
		rollupOptions: {
			input: "src/client/main.js",
			output: {
				entryFileNames: "main.js",
			},
		},
	},
});
