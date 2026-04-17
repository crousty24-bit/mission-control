import type { CSSProperties } from "react";
import type { Project, ProjectStatus } from "../types";

interface ProjectStatusSummaryProps {
	projects: Project[];
}

const trackedStatuses = [
	{
		key: "done",
		label: "done",
		color: "var(--status-done)",
	},
	{
		key: "review",
		label: "review",
		color: "var(--status-review)",
	},
	{
		key: "in-progress",
		label: "in progress",
		color: "var(--status-progress)",
	},
	{
		key: "blocked",
		label: "blocked",
		color: "var(--status-blocked)",
	},
] as const satisfies ReadonlyArray<{
	key: ProjectStatus;
	label: string;
	color: string;
}>;

function buildDonutGradient(
	items: ReadonlyArray<{
		color: string;
		count: number;
	}>,
	total: number,
) {
	if (total === 0) {
		return "conic-gradient(rgba(255, 255, 255, 0.08) 0deg 360deg)";
	}

	let currentAngle = 0;
	const segments: string[] = [];

	for (const item of items) {
		const nextAngle = currentAngle + (item.count / total) * 360;
		segments.push(`${item.color} ${currentAngle}deg ${nextAngle}deg`);
		currentAngle = nextAngle;
	}

	if (currentAngle < 360) {
		segments.push(`rgba(255, 255, 255, 0.06) ${currentAngle}deg 360deg`);
	}

	return `conic-gradient(${segments.join(", ")})`;
}

export function ProjectStatusSummary({ projects }: ProjectStatusSummaryProps) {
	const summaryItems = trackedStatuses.map((status) => {
		const count = projects.filter(
			(project) => project.status === status.key,
		).length;

		return {
			...status,
			count,
		};
	});

	const trackedProjectCount = summaryItems.reduce(
		(total, item) => total + item.count,
		0,
	);
	const plannedCount = projects.length - trackedProjectCount;
	const completionRate =
		projects.length === 0
			? 0
			: Math.round(
					((summaryItems.find((item) => item.key === "done")?.count ?? 0) /
						projects.length) *
						100,
				);

	const donutStyle = {
		"--project-status-donut": buildDonutGradient(
			summaryItems,
			trackedProjectCount,
		),
	} as CSSProperties;

	return (
		<section className="section-block project-status-summary">
			<div className="section-heading">
				<p className="eyebrow">Pipeline en cours</p>
				<h3>Répartition des statuts projets</h3>
				<p className="section-note">
					Vue globale de tous les projets suivis dans le board.
				</p>
			</div>

			<div className="project-status-summary__layout">
				<div
					className="project-status-summary__chart"
					style={donutStyle}
					role="img"
					aria-label={`Répartition globale: ${summaryItems
						.map((item) => `${item.label} ${item.count}`)
						.join(", ")}`}
				>
					<div className="project-status-summary__chart-ring" />
					<div className="project-status-summary__chart-center">
						<strong>{projects.length}</strong>
						<span>projets</span>
					</div>
				</div>

				<div className="project-status-summary__content">
					<div className="project-status-summary__metrics">
						<div className="project-status-summary__metric">
							<span>Suivis dans le pipeline</span>
							<strong>{trackedProjectCount}</strong>
						</div>
						<div className="project-status-summary__metric">
							<span>Clôturés</span>
							<strong>{completionRate}%</strong>
						</div>
					</div>

					<div className="project-status-summary__bar" aria-hidden="true">
						{summaryItems.map((item) => (
							<span
								key={item.key}
								className={`project-status-summary__bar-segment project-status-summary__bar-segment--${item.key}`}
								style={{
									flexGrow: item.count === 0 ? 0 : item.count,
								}}
							/>
						))}
					</div>

					<div className="project-status-summary__legend">
						{summaryItems.map((item) => (
							<div
								key={item.key}
								className={`project-status-summary__item project-status-summary__item--${item.key}`}
							>
								<span className="project-status-summary__item-dot" />
								<div className="project-status-summary__item-copy">
									<span>{item.label}</span>
									<strong>{item.count}</strong>
								</div>
							</div>
						))}
					</div>

					{plannedCount > 0 ? (
						<p className="section-note">
							{plannedCount} projet{plannedCount > 1 ? "s" : ""} en{" "}
							<code>planned</code> hors synthèse visuelle.
						</p>
					) : null}
				</div>
			</div>
		</section>
	);
}
