import { render } from "@/server/render";
import { ConsoleApp } from "./app";
import { Spinner } from "./components/spinner";

export function LoginPage() {
	return render(
		<ConsoleApp path="/login">
			<section className="min-h-screen bg-zinc-950 flex items-center justify-center">
				<div
					id="login-container"
					className="w-full max-w-sm px-6 -translate-y-20"
				>
					<div className="flex flex-col gap-4 mb-4">
						<div className="flex items-center gap-2">
							<img
								src="/img/logo.svg"
								alt="Hyperion Logo"
								className="h-6 w-6"
							/>
							<span className="text-base text-zinc-500 tracking-tight font-semibold">
								Hyperion
							</span>
						</div>
						<h2 className="text-3xl font-medium text-zinc-100 tracking-tight">
							Sign in
						</h2>
					</div>

					<form
						action="/login"
						method="post"
						hx-post="/login"
						hx-target="#login-container"
						hx-swap="innerHTML"
						className="flex flex-col gap-6"
					>
						<div className="flex flex-col gap-2">
							<input
								type="email"
								id="email"
								name="email"
								required
								placeholder="E-mail"
								className="
                  bg-transparent
                  border-b border-zinc-800
                  px-0 py-2
                  text-zinc-100
                  placeholder-zinc-500
                  focus:border-zinc-300
                  focus:outline-none
                "
							/>
						</div>

						<button
							type="submit"
							hx-disabled-elt="this"
							className="relative ui-btn justify-center"
						>
							<span className="pointer-events-none">Continue</span>

							<span className="htmx-indicator absolute right-3 inset-y-0 flex items-center">
								<Spinner title="Sending..." />
							</span>
						</button>
					</form>
				</div>
			</section>
		</ConsoleApp>,
	);
}
