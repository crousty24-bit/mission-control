import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps
	extends Omit<
		ButtonHTMLAttributes<HTMLButtonElement>,
		"children" | "aria-label"
	> {
	label: string;
	tone?: "default" | "danger";
	icon: ReactNode;
}

export function IconButton({
	icon,
	label,
	tone = "default",
	type = "button",
	className,
	...props
}: IconButtonProps) {
	const resolvedClassName = [
		"icon-button",
		tone === "danger" ? "icon-button icon-button--danger" : "icon-button",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<button
			type={type}
			className={resolvedClassName}
			aria-label={label}
			title={label}
			{...props}
		>
			{icon}
			<span className="sr-only">{label}</span>
		</button>
	);
}

export function PencilIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M4 20l3.5-.8L18 8.7 15.3 6 4.8 16.5 4 20Z"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.8"
			/>
			<path
				d="M13.9 7.4 16.6 10.1"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.8"
			/>
		</svg>
	);
}

export function CrossIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M6 6 18 18"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
			<path
				d="M18 6 6 18"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
		</svg>
	);
}
