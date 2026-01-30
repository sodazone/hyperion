export const images: Record<string, Bun.BunFile> = {
	"favicon.svg": Bun.file("./src/static/img/favicon.svg"),
	"favicon.png": Bun.file("./src/static/img/favicon.png"),
	"logo.svg": Bun.file("./src/static/img/hyp.svg"),
} as const;
