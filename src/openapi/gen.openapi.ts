import { VERSION } from "@/version";

export const openapi = {
	openapi: "3.1.0",
	info: {
		title: "Hyperion API",
		version: VERSION,
		description:
			"Hyperion public API for address categorization. Use 0 as wildcard for cat, subcat, or network where supported.",
	},
	servers: [{ url: "http://localhost:8080" }],
	paths: {
		"/": {
			get: {
				summary: "Root endpoint",
				description: "Returns a welcome message with API version",
				responses: {
					"200": {
						description: "Welcome message",
						content: {
							"application/json": {
								schema: {
									type: "string",
									example: `Hyperion API v${VERSION}\n`,
								},
							},
						},
					},
				},
			},
		},
		"/uptime": {
			get: {
				summary: "Server uptime",
				responses: {
					"200": {
						description: "Uptime info",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										ok: { type: "boolean", example: true },
										uptime: { type: "number", example: 123.45 },
									},
								},
							},
						},
					},
				},
			},
		},
		"/meta/networks": {
			get: {
				summary: "Network metadata",
				responses: {
					"200": {
						description: "List of networks",
						content: { "application/json": { schema: { type: "array" } } },
					},
				},
			},
		},
		"/meta/categories": {
			get: {
				summary: "Category metadata",
				responses: {
					"200": {
						description: "List of categories",
						content: { "application/json": { schema: { type: "array" } } },
					},
				},
			},
		},
		"/pub/cat/{cat}/{subcat}/{address}/{network}/data": {
			get: {
				summary: "Get all entries for an address",
				description:
					"Returns all categories/subcategories for a given address and network. Use 0 for cat, subcat, or network to act as wildcard.",
				parameters: [
					{
						name: "cat",
						in: "path",
						required: true,
						schema: { type: "integer", minimum: 0 },
						description: "Category ID, 0 = any",
					},
					{
						name: "subcat",
						in: "path",
						required: true,
						schema: { type: "integer", minimum: 0 },
						description: "Subcategory ID, 0 = any",
					},
					{
						name: "address",
						in: "path",
						required: true,
						schema: { type: "string" },
						description: "Target address",
					},
					{
						name: "network",
						in: "path",
						required: true,
						schema: { type: "string" },
						description: "Network URN or numeric ID, 0 = any",
					},
				],
				responses: {
					"200": {
						description: "Category entries for address",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										entries: {
											type: "array",
											items: {
												type: "object",
												properties: {
													category: { type: "integer" },
													subcategory: { type: "integer" },
													label: { type: "string" },
												},
											},
										},
									},
								},
							},
						},
					},
					"404": { description: "No entries found" },
					"400": { description: "Invalid parameters" },
				},
			},
		},
		"/pub/cat/{cat}/{subcat}/{address}/{network}": {
			get: {
				summary: "Check if an address exists in a category/subcategory",
				description:
					"Returns 204 if the address exists, 404 if not. Use 0 as wildcard for cat, subcat, or network.",
				parameters: [
					{
						name: "cat",
						in: "path",
						required: true,
						schema: { type: "integer", minimum: 0 },
					},
					{
						name: "subcat",
						in: "path",
						required: true,
						schema: { type: "integer", minimum: 0 },
					},
					{
						name: "address",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
					{
						name: "network",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
				],
				responses: {
					"204": { description: "Exists" },
					"404": { description: "Not found" },
					"400": { description: "Invalid parameters" },
				},
			},
		},
	},
};
