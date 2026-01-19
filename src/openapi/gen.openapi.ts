import { VERSION } from "@/version";

export const openapi = {
	openapi: "3.1.0",
	info: {
		title: "Hyperion API",
		version: VERSION,
		description:
			"Hyperion public API for address categorization. Use 0 as wildcard for cat, subcat, or network where supported.",
	},
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
			},
		},
	},
	servers: [{ url: "http://localhost:8080" }],
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
		"/docs": {
			get: {
				summary: "API HTML documentation",
				tags: ["System"],
				responses: {
					200: {
						description: "Static HTML docs",
						content: { "text/html": { schema: { type: "string" } } },
					},
				},
			},
		},
		"/openapi.json": {
			get: {
				summary: "OpenAPI JSON schema",
				tags: ["System"],
				responses: {
					200: {
						description: "OpenAPI JSON",
						content: { "application/json": { schema: { type: "object" } } },
					},
				},
			},
		},
		"/meta/networks": {
			get: {
				summary: "Network metadata",
				tags: ["Metadata"],
				responses: {
					200: {
						description: "List of networks",
						content: { "application/json": { schema: { type: "array" } } },
					},
				},
			},
		},
		"/meta/categories": {
			get: {
				summary: "Category metadata",
				tags: ["Metadata"],
				responses: {
					200: {
						description: "List of categories",
						content: { "application/json": { schema: { type: "array" } } },
					},
				},
			},
		},
		"/public/category/{cat}/{subcat}/{address}/{network}": {
			get: {
				summary: "Get all categories for an address",
				tags: ["Public"],
				description:
					"Returns all categories/subcategories for a given address and network. Use 0 for cat, subcat, or network as wildcard. If `check=true` is provided, only checks for existence, and in this case `network` must be especified.",
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
					{
						name: "check",
						in: "query",
						required: false,
						schema: { type: "boolean" },
						description: "If true, existence-only check",
					},
				],
				responses: {
					200: {
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
													networkId: { type: "integer" },
													category: {
														type: "object",
														properties: {
															code: { type: "integer" },
															label: { type: "string" },
														},
													},
													subcategory: {
														type: "object",
														properties: {
															code: { type: "integer" },
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
					},
					204: { description: "Exists only (check=true)" },
					404: { description: "Not found / no entries" },
					400: { description: "Invalid parameters" },
				},
			},
		},
		"/public/tags/{address}/{network}": {
			get: {
				summary: "Get all tags for an address",
				tags: ["Public"],
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
						description: "Array of tags",
						content: { "application/json": { schema: { type: "array" } } },
					},
					404: { description: "No tags found" },
					400: { description: "Invalid parameters" },
				},
			},
		},
		"/public/tag/{tag}/{address}/{network}": {
			get: {
				summary: "Get a specific tag for an address",
				tags: ["Public"],
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
						name: "check",
						in: "query",
						required: false,
						schema: { type: "boolean" },
						description: "Existence-only check",
					},
				],
				responses: {
					200: {
						description: "Tag record",
						content: { "application/json": { schema: { type: "object" } } },
					},
					204: { description: "Exists only (check=true)" },
					404: { description: "Tag not found" },
					400: { description: "Invalid parameters" },
				},
			},
		},
		"/me": {
			get: {
				summary: "Get current user",
				tags: ["Private"],
				security: [{ bearerAuth: [] }],
				responses: {
					200: {
						description: "Authenticated user info",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										hash: { type: "string", description: "32-byte owner hash" },
									},
								},
							},
						},
					},
					401: { description: "Unauthorized: missing or invalid token" },
				},
			},
		},
		"/me/categories/{cat}/{subcat}/{address}/{network}": {
			get: {
				summary: "Get categories for the authenticated user",
				tags: ["Private"],
				security: [{ bearerAuth: [] }],
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
					{
						name: "check",
						in: "query",
						required: false,
						schema: { type: "boolean" },
					},
				],
				responses: {
					200: {
						description: "Category entries for user",
						content: { "application/json": { schema: { type: "object" } } },
					},
					204: { description: "Exists only (check=true)" },
					404: { description: "Not found" },
					400: { description: "Invalid parameters" },
				},
			},
			post: {
				summary: "Create or update categories for authenticated user",
				tags: ["Private"],
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: { "application/json": { schema: { type: "object" } } },
				},
				responses: {
					200: {
						description: "Operation result",
						content: { "application/json": { schema: { type: "object" } } },
					},
				},
			},
			delete: {
				summary: "Delete categories for authenticated user",
				tags: ["Private"],
				security: [{ bearerAuth: [] }],
				responses: {
					200: {
						description: "Operation result",
						content: { "application/json": { schema: { type: "object" } } },
					},
				},
			},
		},
	},
};
