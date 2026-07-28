export function DashboardIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M20 11h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1m-1 8h-4v-6h4zm-9-4H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1m-1 4H5v-2h4zM20 3h-6c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1m-1 4h-4V5h4zm-9-4H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1m-1 8H5V5h4z"></path>
		</svg>
	);
}

export function ShieldAlertIcon({
	className = "h-4 w-4",
}: {
	className?: string;
}) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth="2"
			role="img"
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
			/>
		</svg>
	);
}

export function SlidersIcon({ className = "h-4 w-4" }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth="2"
			role="img"
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
			/>
		</svg>
	);
}

export function RadioIcon({ className = "h-4 w-4" }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			role="img"
			aria-hidden="true"
		>
			<path d="M16.247 7.761a6 6 0 0 1 0 8.478" />
			<path d="M19.075 4.933a10 10 0 0 1 0 14.134" />
			<path d="M4.925 19.067a10 10 0 0 1 0-14.134" />
			<path d="M7.753 16.239a6 6 0 0 1 0-8.478" />
			<circle cx="12" cy="12" r="2" />
		</svg>
	);
}

export function BookmarkIcon({
	className = "h-4 w-4",
}: {
	className?: string;
}) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth="2"
			role="img"
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
			/>
		</svg>
	);
}

export function LoginIcon({ className = "h-4 w-4" }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			role="img"
			aria-hidden="true"
		>
			<path d="m10 17 5-5-5-5" />
			<path d="M15 12H3" />
			<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
		</svg>
	);
}

export function ArrowInLeftCircleHalf({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			role="img"
			aria-hidden="true"
			fill="currentColor"
			viewBox="0 0 24 24"
		>
			<path d="m9 17 6-5-6-5v4H2v2h7z"></path>
			<path d="M13 3v2c3.86 0 7 3.14 7 7s-3.14 7-7 7v2c4.96 0 9-4.04 9-9s-4.04-9-9-9"></path>
		</svg>
	);
}

export function GlobeIcon({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M12 22c1.38 0 3.27-3.4 3.48-9H8.52c.2 5.6 2.1 9 3.48 9m0-20c-1.38 0-3.27 3.4-3.48 9h6.96c-.2-5.6-2.1-9-3.48-9m3.53.65c1.17 2.12 1.83 5.22 1.95 8.35h4.47c-.38-3.83-2.94-7.03-6.42-8.35m0 18.7c3.48-1.32 6.04-4.51 6.42-8.35h-4.47c-.12 3.12-.78 6.23-1.95 8.35M2.05 13c.38 3.83 2.94 7.03 6.42 8.35C7.3 19.23 6.64 16.13 6.52 13zm0-2h4.47c.12-3.12.78-6.23 1.95-8.35C4.99 3.97 2.43 7.16 2.05 11"></path>
		</svg>
	);
}

export function SearchIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M18 10c0-4.41-3.59-8-8-8s-8 3.59-8 8 3.59 8 8 8c1.85 0 3.54-.63 4.9-1.69l5.1 5.1L21.41 20l-5.1-5.1A8 8 0 0 0 18 10M4 10c0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6-6-2.69-6-6"></path>
		</svg>
	);
}

export function ExclamationIcon({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M11 7h2v6h-2zm0 8h2v2h-2z"></path>
			<path d="M12 22c5.51 0 10-4.49 10-10S17.51 2 12 2 2 6.49 2 12s4.49 10 10 10m0-18c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8"></path>
		</svg>
	);
}

export function SidebarIcon({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-9 16V5h9v14z"></path>
		</svg>
	);
}

export function MenuCloserIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M3 7h18v2H3zm0 4h18v2H3zm0 4h18v2H3z"></path>
		</svg>
	);
}

export function MenuFilterIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M3 5h18v2H3zm2.5 6h13v2h-13zM8 17h8v2H8z"></path>
		</svg>
	);
}

export function ArrowRightStroke({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M6 13h8.09l-3.3 3.29 1.42 1.42 5.7-5.71-5.7-5.71-1.42 1.42 3.3 3.29H6z"></path>
		</svg>
	);
}

export function ArrowLeftStroke({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M11.79 6.29 6.09 12l5.7 5.71 1.42-1.42L9.91 13H18v-2H9.91l3.3-3.29z"></path>
		</svg>
	);
}

export function PlusIcon({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M3 13h8v8h2v-8h8v-2h-8V3h-2v8H3z"></path>
		</svg>
	);
}

export function BellIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M19 12.59V10c0-3.22-2.18-5.93-5.14-6.74C13.57 2.52 12.85 2 12 2s-1.56.52-1.86 1.26C7.18 4.08 5 6.79 5 10v2.59L3.29 14.3a1 1 0 0 0-.29.71v2c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-2c0-.27-.11-.52-.29-.71zM19 16H5v-.59l1.71-1.71a1 1 0 0 0 .29-.71v-3c0-2.76 2.24-5 5-5s5 2.24 5 5v3c0 .27.11.52.29.71L19 15.41zm-4.18 4H9.18c.41 1.17 1.51 2 2.82 2s2.41-.83 2.82-2"></path>
		</svg>
	);
}

export function SirenIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			viewBox="0 0 24 24"
		>
			<title>Search</title>
			<path d="M7 19H4v2h16v-2h-3v-6c0-2.76-2.24-5-5-5s-5 2.24-5 5zm2-6c0-1.65 1.35-3 3-3s3 1.35 3 3v6H9zm4-7V3h-2v3zm6 5v2h3v-2zM5 13v-2H2v2zm12.66-5.24 1.06-1.06 1.06-1.06-.71-.71-.71-.71-1.06 1.06-1.06 1.06.71.71zm-11.32 0 .71-.71.71-.71L6.7 5.28 5.64 4.22l-.71.71-.71.71L5.28 6.7z"></path>
		</svg>
	);
}

export function TagIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M17.87 4.5c-.18-.31-.51-.5-.87-.5H3c-.36 0-.69.19-.86.5-.18.31-.18.69 0 1L5.86 12l-3.72 6.5A1 1 0 0 0 3 20h14c.36 0 .69-.19.87-.5l4-7c.18-.31.18-.68 0-.99l-4-7ZM16.42 18H4.72l3.15-5.5c.18-.31.18-.68 0-.99l-3.15-5.5h11.7l3.43 6-3.43 6Z"></path>
		</svg>
	);
}

export function ChevronLeftIcon({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M14.29 6.29 8.59 12l5.7 5.71 1.42-1.42-4.3-4.29 4.3-4.29z"></path>
		</svg>
	);
}

export function PencilIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M19.67 2.61c-.81-.81-2.14-.81-2.95 0L3.38 15.95c-.13.13-.22.29-.26.46l-1.09 4.34c-.08.34.01.7.26.95.19.19.45.29.71.29.08 0 .16 0 .24-.03l4.34-1.09c.18-.04.34-.13.46-.26L21.38 7.27c.81-.81.81-2.14 0-2.95L19.66 2.6ZM6.83 19.01l-2.46.61.61-2.46 9.96-9.94 1.84 1.84zM19.98 5.86 18.2 7.64 16.36 5.8l1.78-1.78s.09-.03.12 0l1.72 1.72s.03.09 0 .12"></path>
		</svg>
	);
}

export function ArrowUpRight({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M17 16V7H8v2h5.59l-6.3 6.29 1.42 1.42 6.29-6.3V16z"></path>
		</svg>
	);
}

export function ChevronRightIcon({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="m9.71 17.71 5.7-5.71-5.7-5.71-1.42 1.42 4.3 4.29-4.3 4.29z"></path>
		</svg>
	);
}

export function SadIcon({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M8.5 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3m7 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5S16.33 9 15.5 9M12 14c-3 0-4 3-4 3h8s-1-3-4-3"></path>
			<path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8"></path>
		</svg>
	);
}

export function CheckIcon({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M9 15.59 4.71 11.3 3.3 12.71l5 5c.2.2.45.29.71.29s.51-.1.71-.29l11-11-1.41-1.41L9.02 15.59Z"></path>
		</svg>
	);
}

export function ChevronUpDownIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="m12 17.59-4.29-4.3-1.42 1.42 5.71 5.7 5.71-5.7-1.42-1.42zm-5.71-8.3 1.42 1.42L12 6.41l4.29 4.3 1.42-1.42L12 3.59z"></path>
		</svg>
	);
}

export function ChevronDownIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="m12 15.41 5.71-5.7-1.42-1.42-4.29 4.3-4.29-4.3-1.42 1.42z"></path>
		</svg>
	);
}

export function CopyIcon({ size = 16 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-hidden="true"
		>
			<path d="M20 2H10c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m0 12H10V4h10z"></path>
			<path d="M14 20H4V10h2V8H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-2h-2z"></path>
		</svg>
	);
}
