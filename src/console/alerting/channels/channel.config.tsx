export function TelegramChannelConfig({ config }: { config?: any }) {
	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-2">
				<label htmlFor="config.token" className="text-sm text-zinc-300">
					Bot Token
				</label>
				<input
					id="config.token"
					name="config.token"
					required
					defaultValue={config?.token}
					className="ui-input w-full px-2 py-1"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label htmlFor="config.chatId" className="text-sm text-zinc-300">
					Chat ID
				</label>
				<input
					id="config.chatId"
					name="config.chatId"
					required
					defaultValue={config?.chatId}
					className="ui-input w-full px-2 py-1"
				/>
			</div>

			<div className="text-xs text-zinc-500">
				You can find the chat ID using @userinfobot.
			</div>
		</div>
	);
}
