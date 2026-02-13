const NAME_TAGS = ["exchange_name", "name", "alias"] as const;

type LocalEntityData = {
	tags?: string[];
};

export const getName = (entity?: LocalEntityData): string | undefined => {
	if (!entity?.tags) return undefined;

	for (const tag of NAME_TAGS) {
		const match = entity.tags.find((t) => t.startsWith(`${tag}:`));
		if (match) return match.slice(tag.length + 1);
	}

	return undefined;
};

export const makeLabels = (entity?: LocalEntityData): string[] => {
	if (!entity?.tags) return [];

	return entity.tags
		.map((t) => {
			const colonIndex = t.indexOf(":");
			return colonIndex > -1 ? t.slice(colonIndex + 1) : t;
		})
		.filter(Boolean);
};
