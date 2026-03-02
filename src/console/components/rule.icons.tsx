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
	"xc-invariant": (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="image"
			aria-hidden="true"
		>
			<path d="M3 21h18c.35 0 .68-.18.86-.48s.19-.67.03-.98L12.88 2.53c-.35-.66-1.42-.66-1.77 0l-8.99 17c-.16.31-.15.68.03.98s.51.48.86.48Zm7.99-13.95L17.31 19H4.66l6.32-11.95Z"></path>
		</svg>
	),
	watched: (
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
