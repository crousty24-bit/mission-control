import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import type { Project, ProjectPriority, ProjectStatus } from "../types";
import { CrossIcon, IconButton, PencilIcon } from "./IconButton";

interface ProjectCardProps {
	project: Project;
	isSelected: boolean;
	isArchiveSelectionMode?: boolean;
	isArchiveSelected?: boolean;
	isDragging?: boolean;
	dragHandle?: ReactNode;
	onToggleArchiveSelection?: (projectId: string) => void;
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
	isArchiveSelectionMode = false,
	isArchiveSelected = false,
	isDragging = false,
	dragHandle,
	onToggleArchiveSelection,
	onSelect,
	onOpenProject,
	onEditProject,
	onDeleteProject,
	onUpdateStatus,
	onUpdatePriority,
}: ProjectCardProps) {
	const isArchiveSelectable =
		isArchiveSelectionMode && project.status === "done";
	const isArchiveDisabled = isArchiveSelectionMode && !isArchiveSelectable;

	const handleOpen = () => {
		if (isArchiveSelectionMode) {
			if (isArchiveSelectable) {
				onToggleArchiveSelection?.(project.id);
			}
			return;
		}

		onSelect(project.id);
		onOpenProject(project.id);
	};

	const handleSelect = () => {
		if (isArchiveSelectionMode) {
			if (isArchiveSelectable) {
				onToggleArchiveSelection?.(project.id);
			}
			return;
		}

		onSelect(project.id);
	};

	const cardClassName = [
		"project-card",
		isSelected ? "project-card--selected" : null,
		isArchiveSelectable ? "project-card--archive-selectable" : null,
		isArchiveSelected ? "project-card--archive-selected" : null,
		isArchiveDisabled ? "project-card--archive-disabled" : null,
		isDragging ? "project-card--dragging" : null,
	]
		.filter(Boolean)
		.join(" ");

	const handleArchiveCardClick = () => {
		if (isArchiveSelectable) {
			onToggleArchiveSelection?.(project.id);
		}
	};

	const handleArchiveCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (!isArchiveSelectable) {
			return;
		}

		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onToggleArchiveSelection?.(project.id);
		}
	};

	return (
		<article
			className={cardClassName}
			data-project-card-id={project.id}
			onClick={isArchiveSelectionMode ? handleArchiveCardClick : undefined}
			onKeyDown={isArchiveSelectionMode ? handleArchiveCardKeyDown : undefined}
			role={isArchiveSelectable ? "button" : undefined}
			tabIndex={isArchiveSelectable ? 0 : undefined}
		>
			<div className="project-card__header">
				<button
					type="button"
					className="project-card__main-action"
					onClick={isArchiveSelectionMode ? undefined : handleSelect}
					onDoubleClick={handleOpen}
					disabled={isArchiveDisabled}
				>
					<p>{project.client}</p>
					<h4>{project.name}</h4>
				</button>
				<div className="project-card__header-side">
					{dragHandle}
					{isArchiveSelectionMode ? (
						<span className={`status-badge status-badge--${project.status}`}>
							{project.status}
						</span>
					) : (
						<details className="dropdown-menu project-card__status-menu">
							<summary
								className={`status-badge status-badge--${project.status}`}
							>
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
					)}

					{isArchiveSelectionMode ? (
						<button
							type="button"
							className="project-card__archive-note"
							onClick={(event) => {
								event.stopPropagation();
								handleArchiveCardClick();
							}}
							disabled={isArchiveDisabled}
						>
							{isArchiveSelectable
								? isArchiveSelected
									? "Sélectionné"
									: "Archivable"
								: "Non archivable"}
						</button>
					) : (
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
					)}
				</div>
			</div>

			<button
				type="button"
				className="project-card__summary-action"
				onClick={isArchiveSelectionMode ? undefined : handleSelect}
				onDoubleClick={handleOpen}
				disabled={isArchiveDisabled}
			>
				<p className="project-card__summary">{project.summary}</p>
			</button>

			<div className="project-card__meta">
				{isArchiveSelectionMode ? (
					<span className={`priority-pill priority-pill--${project.priority}`}>
						{project.priority}
					</span>
				) : (
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
				)}

				<button
					type="button"
					className="project-card__progress-action"
					onClick={isArchiveSelectionMode ? undefined : handleSelect}
					onDoubleClick={handleOpen}
					disabled={isArchiveDisabled}
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
