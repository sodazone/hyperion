export const images: Record<string, Bun.BunFile> = {
	"favicon.svg": Bun.file("./public/img/favicon.svg"),
	"favicon.png": Bun.file("./public/img/favicon.png"),
	"logo.svg": Bun.file("./public/img/hyp.svg"),
} as const;
