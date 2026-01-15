type CategoryID = number;
type SubcategoryID = number;
type Label = string;

type Entry = {
	category: number;
	subcategory: number;
	label: string;
};

export class LabeledBimap {
	private labels: Label[] = [];
	private keyToIndex = new Map<number, number>();
	private labelToIndex = new Map<Label, number>();

	private cachedEntries?: { entries: Entry[] };
	private dirty = true;

	private makeKey(cat: CategoryID, sub: SubcategoryID) {
		return ((cat & 0xffff) << 16) | (sub & 0xffff);
	}

	add(cat: CategoryID, sub: SubcategoryID, label: Label) {
		const key = this.makeKey(cat, sub);

		if (this.keyToIndex.has(key))
			throw new Error(`Duplicate category/subcategory: ${cat}:${sub}`);
		if (this.labelToIndex.has(label))
			throw new Error(`Duplicate label: ${label}`);

		const index = this.labels.length;
		this.labels.push(label);
		this.keyToIndex.set(key, index);
		this.labelToIndex.set(label, index);

		this.dirty = true;
	}

	getLabel(cat: CategoryID, sub: SubcategoryID): Label | undefined {
		const index = this.keyToIndex.get(this.makeKey(cat, sub));
		return index !== undefined ? this.labels[index] : undefined;
	}

	getIDs(label: Label): [CategoryID, SubcategoryID] | undefined {
		const index = this.labelToIndex.get(label);
		if (index === undefined) return undefined;

		for (const [key, i] of this.keyToIndex.entries()) {
			if (i === index) {
				return [(key >>> 16) & 0xffff, key & 0xffff];
			}
		}
		return undefined;
	}

	entries() {
		if (!this.dirty && this.cachedEntries) {
			return this.cachedEntries;
		}

		const entries: Entry[] = new Array(this.labels.length);

		let i = 0;
		for (const [key, index] of this.keyToIndex.entries()) {
			entries[i++] = {
				category: (key >>> 16) & 0xffff,
				subcategory: key & 0xffff,
				label: this.labels[index] ?? "<unknown>",
			};
		}

		this.cachedEntries = { entries };
		this.dirty = false;

		return this.cachedEntries;
	}
}
