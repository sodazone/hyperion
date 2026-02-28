import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	root: path.resolve(__dirname, "src/client"),
	build: {
		outDir: path.resolve(__dirname, "public/js"),
		emptyOutDir: true,
		sourcemap: true,
		minify: "esbuild",
		target: "es2017",
		rollupOptions: {
			input: path.resolve(__dirname, "src/client/main.js"),
			output: {
				entryFileNames: "main.js",
				chunkFileNames: "chunk-[hash].js",
				assetFileNames: "assets/[name]-[hash][extname]",
				manualChunks(id) {
					if (id.includes("node_modules")) {
						return "vendor";
					}
				},
			},
		},
	},
	optimizeDeps: {
		include: ["alpinejs", "htmx.org"],
	},
});
