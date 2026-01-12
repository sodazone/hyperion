import { createReadStream } from "node:fs";
import sax from "sax";

export type OfacEntity = {
	id?: string;
	name: string;
	aliases: string[];
};

export type OfacResult = {
	entity: OfacEntity;
	symbol: string;
	address: string;
};

export async function* ofacParse(path: string): AsyncGenerator<OfacResult> {
	const featureRefs: Record<string, string> = {};

	let text = "";
	let currentFeatureTypeId: string | undefined;
	let entity: OfacEntity | null = null;
	let feature: { typeId?: string; detail: string } | null = null;

	let inIdentity = false;
	let inAlias = false;
	let inDocumentedName = false;
	let inNamePartValue = false;
	let inVersionDetail = false;

	const resultQueue: OfacResult[] = [];
	let resolveNext: (() => void) | null = null;

	const parser = sax.createStream(true, { trim: true });

	parser.on("opentag", (node) => {
		text = "";
		switch (node.name) {
			case "FeatureType":
				currentFeatureTypeId = node.attributes.ID?.toString();
				break;

			case "DistinctParty":
				entity = {
					id: node.attributes.ID?.toString(),
					name: "",
					aliases: [],
				};
				break;

			case "Profile":
				if (entity) entity.id = node.attributes.ID?.toString() ?? entity.id;
				break;

			case "Identity":
				inIdentity = true;
				break;

			case "Alias":
				if (inIdentity) inAlias = true;
				break;

			case "DocumentedName":
				if (inAlias) inDocumentedName = true;
				break;

			case "NamePartValue":
				if (inDocumentedName) inNamePartValue = true;
				break;

			case "Feature":
				feature = {
					typeId: node.attributes.FeatureTypeID?.toString(),
					detail: "",
				};
				break;

			case "VersionDetail":
				if (feature) inVersionDetail = true;
				break;
		}
	});

	parser.on("text", (t) => {
		text += t;
	});

	parser.on("closetag", (name) => {
		switch (name) {
			case "FeatureType":
				if (currentFeatureTypeId)
					featureRefs[currentFeatureTypeId] = text.trim();
				currentFeatureTypeId = undefined;
				break;

			case "NamePartValue":
				if (entity && inNamePartValue) {
					const v = text.trim();
					if (v) {
						if (!entity.name) entity.name = v;
						else entity.aliases.push(v);
					}
				}
				inNamePartValue = false;
				break;

			case "DocumentedName":
				inDocumentedName = false;
				break;

			case "Alias":
				inAlias = false;
				break;

			case "Identity":
				inIdentity = false;
				break;

			case "VersionDetail":
				if (feature && inVersionDetail) feature.detail = text.trim();
				inVersionDetail = false;
				break;

			case "Feature":
				if (feature && entity) {
					const label = featureRefs[feature.typeId ?? ""];
					if (label?.startsWith("Digital Currency Address - ")) {
						const symbol = label
							.replace("Digital Currency Address - ", "")
							.trim();
						resultQueue.push({ symbol, address: feature.detail, entity });
						if (resolveNext) resolveNext();
					}
				}
				feature = null;
				break;

			case "DistinctParty":
				entity = null;
				break;
		}

		text = "";
	});

	let done = false;
	let error: unknown = null;

	const endPromise = new Promise<void>((resolve, reject) => {
		parser.on("end", () => {
			done = true;
			resolve();
			if (resolveNext) resolveNext();
		});
		parser.on("error", (err) => {
			done = true;
			error = err;
			reject(err);
			if (resolveNext) resolveNext();
		});
	});

	createReadStream(path).pipe(parser);

	while (!done || resultQueue.length > 0) {
		if (error) throw error;

		if (resultQueue.length === 0) {
			await new Promise<void>((res) => {
				resolveNext = res;
			});
			resolveNext = null;
			continue;
		}

		const result = resultQueue.shift();
		if (result) {
			yield result;
		}
	}

	await endPromise;
}
