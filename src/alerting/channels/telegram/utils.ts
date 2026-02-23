const MDV2_SPECIAL = /[_*[\]()~`>#+\-=|{}.!]/g;

export function escapeMarkdownV2(text: string): string {
	return text.replace(MDV2_SPECIAL, (m) => `\\${m}`);
}
