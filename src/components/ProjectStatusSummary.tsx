import type { CSSProperties } from "react";
import type { Project, ProjectStatus } from "../types";

interface ProjectStatusSummaryProps {
	projects: Project[];
}

const trackedStatuses = [
	{
		key: "done",
		label: "done",
		colorClassName: "project-status-summary__segment-arc--done",
	},
	{
		key: "review",
		label: "review",
		colorClassName: "project-status-summary__segment-arc--review",
	},
	{
		key: "in-progress",
		label: "in progress",
		colorClassName: "project-status-summary__segment-arc--in-progress",
	},
	{
		key: "blocked",
		label: "blocked",
		colorClassName: "project-status-summary__segment-arc--blocked",
	},
] as const satisfies ReadonlyArray<{
	key: ProjectStatus;
	label: string;
	colorClassName: string;
}>;

function polarToCartesian(
	centerX: number,
	centerY: number,
	radius: number,
	angleInDegrees: number,
) {
	const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

	return {
		x: centerX + radius * Math.cos(angleInRadians),
		y: centerY + radius * Math.sin(angleInRadians),
	};
}

function describeDonutSegment(
	centerX: number,
	centerY: number,
	outerRadius: number,
	innerRadius: number,
	startAngle: number,
	endAngle: number,
) {
	const outerStart = polarToCartesian(centerX, centerY, outerRadius, endAngle);
	const outerEnd = polarToCartesian(centerX, centerY, outerRadius, startAngle);
	const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
	const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);
	const sweepAngle = endAngle - startAngle;
	const largeArcFlag = sweepAngle > 180 ? "1" : "0";

	if (sweepAngle >= 359.999) {
		return [
			`M ${centerX} ${centerY - outerRadius}`,
			`A ${outerRadius} ${outerRadius} 0 1 1 ${centerX} ${centerY + outerRadius}`,
			`A ${outerRadius} ${outerRadius} 0 1 1 ${centerX} ${centerY - outerRadius}`,
			`L ${centerX} ${centerY - innerRadius}`,
			`A ${innerRadius} ${innerRadius} 0 1 0 ${centerX} ${centerY + innerRadius}`,
			`A ${innerRadius} ${innerRadius} 0 1 0 ${centerX} ${centerY - innerRadius}`,
			"Z",
		].join(" ");
	}

	return [
		`M ${outerStart.x} ${outerStart.y}`,
		`A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}`,
		`L ${innerEnd.x} ${innerEnd.y}`,
		`A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
		"Z",
	].join(" ");
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
	const summaryNote =
		plannedCount > 0
			? `${plannedCount} projet${plannedCount > 1 ? "s" : ""} en planned hors synthèse visuelle.`
			: completionRate > 0
				? `${completionRate}% des projets du board sont déjà en done.`
				: "Vue globale de tous les projets suivis dans le board.";

	const svgSize = 220;
	const center = svgSize / 2;
	const outerRadius = 96;
	const innerRadius = 54;
	const labelRadius = (outerRadius + innerRadius) / 2;
	let currentAngle = -90;

	const segments = summaryItems.map((item) => {
		const sweepAngle =
			trackedProjectCount === 0 ? 0 : (item.count / trackedProjectCount) * 360;
		const startAngle = currentAngle;
		const endAngle = startAngle + sweepAngle;
		const middleAngle = startAngle + sweepAngle / 2;
		currentAngle = endAngle;

		const labelPoint = polarToCartesian(
			center,
			center,
			labelRadius,
			middleAngle,
		);
		const offsetPoint = polarToCartesian(0, 0, 8, middleAngle);

		return {
			...item,
			percentage:
				trackedProjectCount === 0
					? 0
					: Math.round((item.count / trackedProjectCount) * 100),
			path:
				item.count === 0
					? ""
					: describeDonutSegment(
							center,
							center,
							outerRadius,
							innerRadius,
							startAngle,
							endAngle,
						),
			labelPoint,
			segmentStyle: {
				"--segment-offset-x": `${offsetPoint.x}px`,
				"--segment-offset-y": `${offsetPoint.y}px`,
			} as CSSProperties,
		};
	});

	return (
		<section className="section-block project-status-summary">
			<div className="section-heading">
				<p className="eyebrow">Pipeline en cours</p>
				<h3>Répartition des statuts projets</h3>
				<p className="section-note">{summaryNote}</p>
			</div>

			<div className="project-status-summary__layout">
				<div className="project-status-summary__chart">
					<svg
						viewBox={`0 0 ${svgSize} ${svgSize}`}
						className="project-status-summary__chart-svg"
						role="img"
						aria-label={`Répartition globale: ${segments
							.map(
								(item) =>
									`${item.label} ${item.count} projet${item.count > 1 ? "s" : ""}, ${item.percentage}%`,
							)
							.join(", ")}`}
					>
						<circle
							className="project-status-summary__chart-track"
							cx={center}
							cy={center}
							r={(outerRadius + innerRadius) / 2}
						/>
						{segments.map((item) => (
							<g
								key={item.key}
								className="project-status-summary__segment"
								style={item.segmentStyle}
							>
								{item.path ? (
									<>
										<path
											className={`project-status-summary__segment-arc ${item.colorClassName}`}
											d={item.path}
											tabIndex={0}
										/>
										<text
											className="project-status-summary__segment-label"
											x={item.labelPoint.x}
											y={item.labelPoint.y}
											textAnchor="middle"
											dominantBaseline="middle"
										>
											{item.percentage}%
										</text>
									</>
								) : null}
							</g>
						))}
					</svg>
					<div className="project-status-summary__chart-center">
						<strong>{projects.length}</strong>
						<span>projets</span>
					</div>
				</div>

				<div className="project-status-summary__content">
					<div className="project-status-summary__legend">
						{segments.map((item) => (
							<div
								key={item.key}
								className={`project-status-summary__item project-status-summary__item--${item.key}`}
							>
								<span className="project-status-summary__item-dot" />
								<div className="project-status-summary__item-copy">
									<span className="project-status-summary__item-label">
										{item.label} : {item.count}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
