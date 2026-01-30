import { render } from "@/server/render";
import { ConsoleApp } from "./app";

export function LoginPage() {
	return render(
		<ConsoleApp path="/login">
			<main className="min-h-screen bg-zinc-950 flex items-center justify-center">
				<div
					id="login-container"
					className="w-full max-w-sm px-6 -translate-y-20"
				>
					<h1 className="mb-8 text-center text-xl font-medium text-zinc-100 tracking-tight">
						Hyperion
					</h1>

					<form
						action="/login"
						method="post"
						hx-post="/login"
						hx-target="#login-container"
						hx-swap="innerHTML"
						className="flex flex-col gap-6"
					>
						<div className="flex flex-col gap-2">
							<label
								htmlFor="email"
								className="text-xs uppercase tracking-wide text-zinc-500"
							>
								Email
							</label>

							<input
								type="email"
								id="email"
								name="email"
								required
								placeholder="you@example.com"
								className="
                  bg-transparent
                  border-b border-zinc-800
                  px-0 py-2
                  text-zinc-100
                  placeholder-zinc-600
                  focus:border-zinc-300
                  focus:outline-none
                "
							/>
						</div>

						<button
							type="submit"
							className="
                mt-4
                border border-zinc-800
                py-2 text-sm
                text-zinc-300
                hover:border-zinc-600 hover:text-zinc-100
                transition
              "
						>
							Continue
						</button>
					</form>
				</div>
			</main>
		</ConsoleApp>,
	);
}
