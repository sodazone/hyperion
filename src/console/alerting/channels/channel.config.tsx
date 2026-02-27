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

export function DiscordChannelConfig({ config }: { config?: any }) {
	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-2">
				<label htmlFor="config.webhookUrl" className="text-sm text-zinc-300">
					Webhook URL
				</label>
				<input
					id="config.webhookUrl"
					name="config.webhookUrl"
					required
					defaultValue={config?.webhookUrl}
					className="ui-input w-full px-2 py-1"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label htmlFor="config.username" className="text-sm text-zinc-300">
					Username
				</label>
				<input
					id="config.username"
					name="config.username"
					defaultValue={config?.username}
					className="ui-input w-full px-2 py-1"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label htmlFor="config.avatarUrl" className="text-sm text-zinc-300">
					Avatar URL
				</label>
				<input
					id="config.avatarUrl"
					name="config.avatarUrl"
					defaultValue={config?.avatarUrl}
					className="ui-input w-full px-2 py-1"
				/>
			</div>
		</div>
	);
}
