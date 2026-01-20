import { VERSION } from "@/version";

export const openapi = {
	openapi: "3.1.0",
	info: {
		title: "Hyperion API",
		version: VERSION,
		description:
			"Hyperion public API for blockchain address analysis, categorization, sanctions, and attribution. " +
			"Use network = 0 as a wildcard where supported.",
	},
	servers: [{ url: "http://localhost:8080" }],
	tags: [
		{ name: "System" },
		{ name: "Metadata" },
		{ name: "Analysis" },
		{ name: "Categories" },
		{ name: "Tags" },
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
			},
		},
		schemas: {
			CategoryEntry: {
				type: "object",
				properties: {
					networkId: { type: "number" },
					category: {
						type: "object",
						properties: { code: { type: "number" }, label: { type: "string" } },
					},
					subcategory: {
						type: "object",
						properties: { code: { type: "number" }, label: { type: "string" } },
					},
				},
			},
			TagEntry: { type: "object" },
			AddressAnalysis: {
				type: "object",
				properties: {
					address: { type: "string" },
					networks: {
						type: "array",
						items: {
							type: "object",
							properties: {
								networkId: { type: "number" },
								analysis: { type: "object" },
							},
						},
					},
				},
			},
		},
	},
	paths: {
		"/": {
			get: {
				summary: "API root",
				tags: ["System"],
				responses: {
					200: {
						description: "API version string",
						content: { "application/json": { schema: { type: "string" } } },
					},
				},
			},
		},
		"/uptime": {
			get: {
				summary: "Server uptime",
				tags: ["System"],
				responses: {
					200: {
						description: "Uptime info",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										ok: { type: "boolean" },
										uptime: { type: "number" },
									},
								},
							},
						},
					},
				},
			},
		},
		"/v1/meta/networks": {
			get: {
				summary: "Supported networks",
				tags: ["Metadata"],
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
				summary: "Supported categories",
				tags: ["Metadata"],
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
											category: { type: "number" },
											subcategory: { type: "number" },
											label: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
			},
		},

		// Address Analysis
		"/v1/public/address/{address}": {
			get: {
				summary: "Analyze address across all networks",
				tags: ["Analysis"],
				parameters: [
					{
						name: "address",
						in: "path",
						required: true,
						schema: { type: "string" },
						description: "Blockchain address",
					},
				],
				responses: {
					200: {
						description: "Per-network analysis",
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
				summary: "Analyze address on a specific network",
				tags: ["Analysis"],
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
						description: "Network URN or numeric ID",
					},
				],
				responses: {
					200: {
						description: "Analysis result",
						content: { "application/json": { schema: { type: "object" } } },
					},
					400: { description: "Invalid parameters" },
				},
			},
		},

		// Categories
		"/v1/public/category/{address}/{cat}/{subcat}/{network}": {
			get: {
				summary: "Get categories for an address",
				tags: ["Categories"],
				description:
					"Retrieve categories for an address. Use 0 as wildcard for cat, subcat, or network. Optional query param `exists=true` returns 204/404 only.",
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
						description: "If true, only check existence (204/404)",
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
				},
			},
		},

		// Tags
		"/v1/public/tags/{address}/{network}": {
			get: {
				summary: "Get all tags for an address",
				tags: ["Tags"],
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
		"/v1/public/tag/{tag}/{address}/{network}": {
			get: {
				summary: "Get a specific tag for an address",
				tags: ["Tags"],
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
						description: "If true, only check existence (204/404)",
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
					204: { description: "Exists only" },
					404: { description: "Tag not found" },
				},
			},
		},
	},
};
