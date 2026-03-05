import { VERSION } from "@/version";

export const openapi = {
	openapi: "3.1.0",
	info: {
		title: "Hyperion API",
		version: VERSION,
		description: `
Hyperion is a public API for blockchain address analysis, including risk scoring, categorization, sanctions checks, and attribution.

- Use \`network = "*"\` as a wildcard where supported.
- Public endpoints provide read-only access to category and tag data.
- Private endpoints require authentication (JWT bearer token) and allow updates/deletes for owned addresses.
		`.trim(),
	},
	servers: [
		Bun.env.NODE_ENV === "production"
			? { url: "https://hyperion.soda.zone", description: "Hyperion server" }
			: {
					url: "http://localhost:8080",
					description: "Local development server",
				},
	],
	tags: [
		{ name: "System", description: "Server status and health endpoints" },
		{ name: "Metadata", description: "Network and category metadata" },
		{ name: "Analysis", description: "Blockchain address analysis" },
		{ name: "Categories", description: "Address categories" },
		{ name: "Tags", description: "Address tags" },
		{ name: "Private", description: "Authenticated operations" },
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
				description: "JWT token for private endpoints",
			},
		},
		schemas: {
			CategoryEntry: {
				type: "object",
				properties: {
					networkId: {
						type: "number",
						description: "Network ID for this category entry",
					},
					category: {
						type: "object",
						properties: {
							code: { type: "number", description: "Category code" },
							label: {
								type: "string",
								description: "Human-readable category label",
							},
						},
					},
					subcategory: {
						type: "object",
						properties: {
							code: { type: "number", description: "Subcategory code" },
							label: {
								type: "string",
								description: "Human-readable subcategory label",
							},
						},
					},
				},
				required: ["networkId", "category", "subcategory"],
			},
			TagEntry: {
				type: "object",
				description: "A tag attached to an address",
				properties: {
					tag: { type: "string", description: "Tag identifier" },
					value: { type: "string", description: "Tag value or metadata" },
					networkId: {
						type: "number",
						description: "Network where this tag applies",
					},
				},
			},
			AddressAnalysis: {
				type: "object",
				properties: {
					address: {
						type: "string",
						description: "Blockchain address being analyzed",
					},
					networks: {
						type: "array",
						items: {
							type: "object",
							properties: {
								networkId: { type: "number", description: "Network ID" },
								analysis: {
									type: "object",
									description: "Per-network analysis data",
								},
							},
						},
					},
				},
			},
			Owner: {
				type: "object",
				properties: {
					hash: { type: "string", description: "32-byte owner hash" },
				},
			},
		},
	},
	paths: {
		"/uptime": {
			get: {
				summary: "Get server uptime",
				tags: ["System"],
				description: "Returns server uptime in seconds.",
				responses: {
					200: {
						description: "Uptime info",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										ok: {
											type: "boolean",
											description: "Always true if server is running",
										},
										uptime: {
											type: "number",
											description: "Server uptime in seconds",
										},
									},
								},
							},
						},
					},
				},
			},
		},

		/** Metadata endpoints */
		"/v1/meta/networks": {
			get: {
				summary: "List supported networks",
				tags: ["Metadata"],
				description: "Returns a map of network names to network IDs.",
				responses: {
					200: {
						description: "Network map",
						content: {
							"application/json": {
								schema: {
									type: "object",
									additionalProperties: { type: "number" },
								},
							},
						},
					},
				},
			},
		},
		"/v1/meta/categories": {
			get: {
				summary: "List supported categories",
				tags: ["Metadata"],
				description:
					"Returns all category and subcategory codes along with human-readable labels.",
				responses: {
					200: {
						description: "Category definitions",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: {
										type: "object",
										properties: {
											category: {
												type: "number",
												description: "Category code",
											},
											subcategory: {
												type: "number",
												description: "Subcategory code",
											},
											label: {
												type: "string",
												description: "Label for category/subcategory",
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},

		/** Address Analysis */
		"/v1/public/address/{address}": {
			get: {
				summary: "Analyze an address across all networks",
				tags: ["Analysis"],
				parameters: [
					{
						name: "address",
						in: "path",
						required: true,
						schema: { type: "string" },
						description: "Blockchain address to analyze",
					},
				],
				responses: {
					200: {
						description: "Per-network analysis results",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/AddressAnalysis" },
							},
						},
					},
				},
			},
		},
		"/v1/public/address/{address}/{network}": {
			get: {
				summary: "Analyze an address on a specific network",
				tags: ["Analysis"],
				parameters: [
					{
						name: "address",
						in: "path",
						required: true,
						schema: { type: "string" },
						description: "Blockchain address to analyze",
					},
					{
						name: "network",
						in: "path",
						required: true,
						schema: { type: "string" },
						description:
							"Network name or ID (use '*' for all networks where supported)",
					},
				],
				responses: {
					200: {
						description: "Analysis result for the address on the given network",
						content: { "application/json": { schema: { type: "object" } } },
					},
					400: { description: "Invalid address or network parameter" },
				},
			},
		},

		/** Public Categories */
		"/v1/public/category/{address}/{cat}/{subcat}/{network}": {
			get: {
				summary: "Retrieve categories for a blockchain address",
				tags: ["Categories"],
				description: `
Get categories assigned to an address.

- Use \`cat=0\` as a wildcard to retrieve all categories.
- Use optional query parameter \`exists=true\` to check for existence (returns 204 if exists, 404 if not).
- Network can be a specific network or '*' for all networks.
				`,
				parameters: [
					{
						name: "address",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
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
						name: "network",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
					{
						name: "exists",
						in: "query",
						required: false,
						schema: { type: "boolean" },
					},
				],
				responses: {
					200: {
						description: "Category entries",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/CategoryEntry" },
								},
							},
						},
					},
					204: { description: "Category exists (no content returned)" },
					404: { description: "No categories found" },
					400: { description: "Invalid parameters" },
				},
			},
		},

		/** Public Tags */
		"/v1/public/tags/{address}/{network}": {
			get: {
				summary: "Get all tags for an address",
				tags: ["Tags"],
				description: `
Retrieve all tags associated with an address.

- Specify \`network\` to filter tags for a specific network.
- Use '*' for all networks where supported.
				`,
				parameters: [
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
					200: {
						description: "List of tags",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/TagEntry" },
								},
							},
						},
					},
					404: { description: "No tags found" },
				},
			},
		},
		"/v1/public/tag/{address}/{tag}/{network}": {
			get: {
				summary: "Get a specific tag for an address",
				tags: ["Tags"],
				description: `
Retrieve a single tag for an address.

- Optional \`exists=true\` query parameter can be used to only check presence (204/404).
- \`network\` can be '*' to search all networks.
				`,
				parameters: [
					{
						name: "tag",
						in: "path",
						required: true,
						schema: { type: "string" },
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
					{
						name: "exists",
						in: "query",
						required: false,
						schema: { type: "boolean" },
					},
				],
				responses: {
					200: {
						description: "Tag record",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/TagEntry" },
							},
						},
					},
					204: { description: "Tag exists (no content returned)" },
					404: { description: "Tag not found" },
				},
			},
		},

		/** Private endpoints */
		"/v1/private/me": {
			get: {
				summary: "Get current authenticated user",
				tags: ["Private"],
				security: [{ bearerAuth: [] }],
				responses: {
					200: {
						description: "Authenticated user info",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Owner" },
							},
						},
					},
					401: { description: "Unauthorized" },
				},
			},
		},
		"/v1/private/category/{address}/{cat}/{subcat}/{network}": {
			get: {
				summary: "Get categories for authenticated user",
				tags: ["Private"],
				security: [{ bearerAuth: [] }],
				description:
					"Retrieve categories you have permission to read or check existence.",
				parameters: [
					{
						name: "address",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
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
						name: "network",
						in: "path",
						required: true,
						schema: { type: "string" },
					},
					{
						name: "exists",
						in: "query",
						required: false,
						schema: { type: "boolean" },
					},
				],
				responses: {
					200: {
						description: "Category entries",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/CategoryEntry" },
								},
							},
						},
					},
					204: { description: "Exists only" },
					404: { description: "No categories found" },
					400: { description: "Invalid parameters" },
					401: { description: "Unauthorized" },
				},
			},
			post: {
				summary: "Create or update categories for authenticated user",
				tags: ["Private"],
				security: [{ bearerAuth: [] }],
				description: "Add or update categories for addresses you own.",
				requestBody: {
					required: true,
					content: { "application/json": { schema: { type: "object" } } },
				},
				responses: {
					200: {
						description: "Operation result",
						content: { "application/json": { schema: { type: "object" } } },
					},
					401: { description: "Unauthorized" },
				},
			},
			delete: {
				summary: "Delete categories for authenticated user",
				tags: ["Private"],
				security: [{ bearerAuth: [] }],
				description: "Remove categories for addresses you own.",
				responses: {
					200: {
						description: "Operation result",
						content: { "application/json": { schema: { type: "object" } } },
					},
					401: { description: "Unauthorized" },
				},
			},
		},
	},
};
