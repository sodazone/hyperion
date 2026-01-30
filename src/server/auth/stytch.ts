import stytch from "stytch";
import type { Member } from "@/auth/types";
import { MagicLinkSent } from "@/console/email-sent.page";
import { InvalidParameters } from "../response";

export function createAuthApi() {
	const project_id = process.env.STYTCH_PROJECT_ID;
	const secret = process.env.STYTCH_SECRET;

	if (project_id === undefined || secret === undefined) {
		throw new Error("STYTCH_PROJECT_ID and STYTCH_SECRET must be set in .env");
	}

	const stytchClient = new stytch.B2BClient({
		project_id,
		secret,
	});

	const StytchSessionToken = "stytch_session_token";

	async function getAuthenticatedUser(
		req: Bun.BunRequest,
	): Promise<Member | null> {
		const sessionToken = req.cookies.get(StytchSessionToken);
		if (!sessionToken) {
			return null;
		}

		const resp = await stytchClient.sessions.authenticate({
			session_token: sessionToken,
		});
		if (resp.status_code !== 200) {
			console.log("Session invalid or expired");
			req.cookies.delete(StytchSessionToken);
			return null;
		}

		req.cookies.set(StytchSessionToken, resp.session_token);
		const member = resp.member;
		return {
			email: member.email_address,
			id: member.member_id,
			organization: member.organization_id,
			name: member.name,
		};
	}

	return {
		login: async (req: Bun.BunRequest) => {
			try {
				const form = await req.formData();
				const email = form.get("email");
				if (email === null) {
					return InvalidParameters;
				}

				const res = await stytchClient.magicLinks.email.discovery.send({
					email_address: email.toString(),
				});

				return MagicLinkSent({ succeeded: res.status_code < 400 });
			} catch (error) {
				console.error(error);
				return MagicLinkSent({ succeeded: false });
			}
		},
		getAuthenticatedUser,
		logout: async (req: Bun.BunRequest) => {
			const sessionToken = req.cookies.get(StytchSessionToken);
			if (sessionToken !== null) {
				await stytchClient.sessions.revoke({
					session_token: sessionToken,
				});
				req.cookies.delete(StytchSessionToken);
			}

			return new Response(null, {
				status: 204,
				headers: {
					"HX-Redirect": "/",
				},
			});
		},
		authenticate: async (req: Bun.BunRequest) => {
			const params = new URL(req.url).searchParams;
			const tokenType = params.get("stytch_token_type");

			if (tokenType !== "discovery") {
				console.error(`Unrecognized token type: '${tokenType}'`);
				throw new Error("Invalid token type");
			}

			const token = params.get("token");
			if (!token) {
				console.error("Missing Authorization header");
				throw new Error("Missing Authorization header");
			}

			const authResp = await stytchClient.magicLinks.discovery.authenticate({
				discovery_magic_links_token: token,
			});
			if (authResp.status_code !== 200) {
				throw new Error("Invalid magic link");
			}

			console.log(authResp);

			const ist = authResp.intermediate_session_token;
			if (authResp.discovered_organizations.length > 0) {
				const firstOrg = authResp.discovered_organizations[0];
				if (firstOrg === undefined) {
					throw new Error("Unexpected undefined organization");
				}

				const exchangeResp =
					await stytchClient.discovery.intermediateSessions.exchange({
						intermediate_session_token: ist,
						organization_id: firstOrg.organization?.organization_id ?? "",
					});
				if (exchangeResp.status_code !== 200) {
					console.error(
						`Error exchanging IST into Organization: ${JSON.stringify(exchangeResp, null, 2)}`,
					);
					throw new Error("Failed to exchange IST");
				}

				req.cookies.set(StytchSessionToken, exchangeResp.session_token);
				return Response.redirect("/");
			}
			throw new Error("No organizations found");
		},
	};
}

export type AuthApi = ReturnType<typeof createAuthApi>;
