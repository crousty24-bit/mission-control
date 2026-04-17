import type { MouseEvent } from "react";
import type { Project, ProjectPriority, ProjectStatus } from "../types";
import { CrossIcon, IconButton, PencilIcon } from "./IconButton";

interface ProjectCardProps {
	project: Project;
	isSelected: boolean;
	onSelect: (projectId: string) => void;
	onOpenProject: (projectId: string) => void;
	onEditProject: (projectId: string) => void;
	onDeleteProject: (projectId: string) => void;
	onUpdateStatus: (projectId: string, status: ProjectStatus) => void;
	onUpdatePriority: (projectId: string, priority: ProjectPriority) => void;
}

const statusOptions: ProjectStatus[] = [
	"review",
	"in-progress",
	"blocked",
	"done",
];
const priorityOptions: ProjectPriority[] = ["urgent", "high", "medium", "low"];

function closeDropdown(event: MouseEvent<HTMLButtonElement>) {
	event.stopPropagation();
	event.currentTarget.closest("details")?.removeAttribute("open");
}

export function ProjectCard({
	project,
	isSelected,
	onSelect,
	onOpenProject,
	onEditProject,
	onDeleteProject,
	onUpdateStatus,
	onUpdatePriority,
}: ProjectCardProps) {
	const handleOpen = () => {
		onSelect(project.id);
		onOpenProject(project.id);
	};

	return (
		<article
			className={
				isSelected ? "project-card project-card--selected" : "project-card"
			}
		>
			<div className="project-card__header">
				<button
					type="button"
					className="project-card__main-action"
					onClick={() => onSelect(project.id)}
					onDoubleClick={handleOpen}
				>
					<p>{project.client}</p>
					<h4>{project.name}</h4>
				</button>
				<div className="project-card__header-side">
					<details className="dropdown-menu project-card__status-menu">
						<summary className={`status-badge status-badge--${project.status}`}>
							{project.status}
						</summary>
						<div className="dropdown-menu__content">
							{statusOptions.map((status) => (
								<button
									key={status}
									type="button"
									className={`dropdown-menu__item status-badge status-badge--${status}`}
									onClick={(event) => {
										closeDropdown(event);
										onUpdateStatus(project.id, status);
									}}
								>
									{status}
								</button>
							))}
						</div>
					</details>
					<div className="project-card__icon-actions">
						<IconButton
							label="Modifier le projet"
							icon={<PencilIcon />}
							onClick={() => onEditProject(project.id)}
						/>
						<IconButton
							label="Supprimer le projet"
							tone="danger"
							icon={<CrossIcon />}
							onClick={() => onDeleteProject(project.id)}
						/>
					</div>
				</div>
			</div>
			<button
				type="button"
				className="project-card__summary-action"
				onClick={() => onSelect(project.id)}
				onDoubleClick={handleOpen}
			>
				<p className="project-card__summary">{project.summary}</p>
			</button>
			<div className="project-card__meta">
				<details className="dropdown-menu">
					<summary
						className={`priority-pill priority-pill--${project.priority}`}
					>
						{project.priority}
					</summary>
					<div className="dropdown-menu__content">
						{priorityOptions.map((priority) => (
							<button
								key={priority}
								type="button"
								className={`dropdown-menu__item priority-pill priority-pill--${priority}`}
								onClick={(event) => {
									closeDropdown(event);
									onUpdatePriority(project.id, priority);
								}}
							>
								{priority}
							</button>
						))}
					</div>
				</details>
				<button
					type="button"
					className="project-card__progress-action"
					onClick={() => onSelect(project.id)}
					onDoubleClick={handleOpen}
				>
					<span>{project.progress}%</span>
				</button>
			</div>
			<div className="progress-meter" aria-hidden="true">
				<div style={{ width: `${project.progress}%` }} />
			</div>
		</article>
	);
}
