type CategoryID = number;
type SubcategoryID = number;
type Label = string;

export class LabeledBimap {
	private labels: Label[] = [];
	private keyToIndex = new Map<number, number>();
	private labelToIndex = new Map<Label, number>();
	private subToCat = new Map<SubcategoryID, CategoryID>();

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

		if (sub !== 0x0000) {
			if (this.subToCat.has(sub)) {
				throw new Error(`Subcategory ID ${sub} already assigned to a category`);
			}
			this.subToCat.set(sub, cat);
		}
	}

	getLabel(cat: CategoryID, sub: SubcategoryID): Label | undefined {
		const index = this.keyToIndex.get(this.makeKey(cat, sub));
		return index !== undefined ? this.labels[index] : undefined;
	}

	getIDs(label: Label): [CategoryID, SubcategoryID] | undefined {
		const index = this.labelToIndex.get(label);
		if (index === undefined) return undefined;

		for (const [key, i] of this.keyToIndex.entries()) {
			if (i === index) return [(key >>> 16) & 0xffff, key & 0xffff];
		}
		return undefined;
	}

	getCategoryOfSub(sub: SubcategoryID): CategoryID | undefined {
		return this.subToCat.get(sub);
	}
}
