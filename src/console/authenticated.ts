import { hashOwner } from "@/auth";
import type { Member } from "@/auth/types";
import { Unauthorized } from "@/server/response";
import type { PageContext } from "./types";

type AuthenticatedHandler<T extends string = string, R = Response> = (
	ctx: PageContext & {
		req: Bun.BunRequest<T>;
		user: Member;
		ownerHash: Uint8Array;
	},
) => Promise<R>;

export function withAuth<T extends string = string>(
	handler: AuthenticatedHandler<T>,
) {
	return async (ctx: PageContext, req: Bun.BunRequest<T>) => {
		const user = await ctx.authApi.getAuthenticatedUser<T>(req);
		if (user == null) return Unauthorized;

		const ownerHash = hashOwner(user.email);

		return handler({
			db: ctx.db,
			authApi: ctx.authApi,
			monitor: ctx.monitor,
			req,
			user,
			ownerHash,
		});
	};
}
