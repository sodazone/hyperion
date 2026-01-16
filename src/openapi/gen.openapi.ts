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
		"/me": {
			get: {
				summary: "Get current user",
				description:
					"Returns information about the user associated with the Bearer token.",
				security: [
					{
						bearerAuth: [],
					},
				],
				responses: {
					"200": {
						description: "Authenticated user info",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										ownerHash: {
											type: "string",
											description: "32-byte owner hash derived from JWT sub",
											example:
												"3f8a1d9e5b7c4d2a1e6f8b0c9d7e2a1f3c4b5a6d7e8f9c0a1b2c3d4e5f6a7b8c",
										},
									},
								},
							},
						},
					},
					"401": { description: "Unauthorized: missing or invalid token" },
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
		"/category/{cat}/{subcat}/{address}/{network}": {
			get: {
				summary: "Query categories for an address",
				description:
					"Returns all categories/subcategories for a given address and network. " +
					"Use 0 for cat, subcat, or network as a wildcard. " +
					"If `check=true` is provided, only checks for existence and returns no body.",
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
						description:
							"If true, performs an existence check only. " +
							"Returns 204 if the address exists in the category, 404 otherwise.",
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
					"204": {
						description: "Exists (only returned when check=true)",
					},
					"404": {
						description: "Not found / no entries",
					},
					"400": {
						description: "Invalid parameters",
					},
				},
			},
		},
	},
};
