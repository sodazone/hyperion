import { hashOwner } from "@/auth";
import { Unauthorized } from "@/server/response";
import type { PageContext } from "./types";

type AuthenticatedHandler<T extends string = string, R = Response> = (ctx: {
	db: PageContext["db"];
	authApi: PageContext["authApi"];
	req: Bun.BunRequest<T>;
	user: Awaited<ReturnType<PageContext["authApi"]["getAuthenticatedUser"]>>;
	ownerHash: Uint8Array;
}) => Promise<R>;

export function withAuth<T extends string = string>(
	handler: AuthenticatedHandler<T>,
) {
	return async (ctx: PageContext, req: Bun.BunRequest<T>) => {
		const user = await ctx.authApi.getAuthenticatedUser<T>(req);
		if (!user) return Unauthorized;

		const ownerHash = hashOwner(user.email);

		return handler({ ...ctx, req, user, ownerHash });
	};
}
