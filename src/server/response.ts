export const InternalServerError = new Response("Internal Server Error", {
	status: 500,
});
export const NotFound = new Response(null, { status: 404 });
export const InvalidParameters = new Response("Invalid parameters", {
	status: 400,
});
export const Unauthorized = new Response("Unauthorized", { status: 401 });
export const Forbidden = new Response("Forbidden", { status: 403 });
export const Ok = new Response(null, { status: 200 });
