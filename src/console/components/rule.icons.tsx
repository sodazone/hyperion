export const RuleIcons: Record<string, React.ReactNode> = {
	transfer: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M16 16H2v2h14v4l6-5-6-5zM8 1 2 6l6 5V7h14V5H8z"></path>
		</svg>
	),
	flagged: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="m5 16.67 15.38-6.25c.38-.15.62-.52.62-.93s-.25-.77-.62-.93l-16-6.49c-.31-.12-.66-.09-.94.1S3 2.67 3 3v19h2zm0-2.16V4.49L17.34 9.5z"></path>
		</svg>
	),
} as const;
