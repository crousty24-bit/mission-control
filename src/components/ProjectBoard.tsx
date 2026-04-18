import { useEffect, useMemo, useState } from "react";
import type {
	CreateProjectInput,
	Project,
	ProjectPriority,
	ProjectStatus,
	UpdateProjectInput,
} from "../types";
import { ProjectCard } from "./ProjectCard";
import { ProjectModal } from "./ProjectModal";

interface ProjectBoardProps {
	projects: Project[];
	selectedProjectId: string;
	onSelectProject: (projectId: string) => void;
	onCreateProject: (
		project: CreateProjectInput,
	) => Promise<Project> | Promise<void>;
	onEditProject: (
		projectId: string,
		project: UpdateProjectInput,
	) => Promise<Project> | Promise<void>;
	onUpdateStatus: (projectId: string, status: ProjectStatus) => void;
	onUpdatePriority: (projectId: string, priority: ProjectPriority) => void;
	onDeleteProject: (projectId: string) => void;
	onArchiveProjects: (projectIds: string[]) => Promise<void>;
}

export function ProjectBoard({
	projects,
	selectedProjectId,
	onSelectProject,
	onCreateProject,
	onEditProject,
	onUpdateStatus,
	onUpdatePriority,
	onDeleteProject,
	onArchiveProjects,
}: ProjectBoardProps) {
	const [modalState, setModalState] = useState<{
		mode: "create" | "edit" | "view";
		project?: Project;
	} | null>(null);
	const [isArchiveSelectionMode, setIsArchiveSelectionMode] = useState(false);
	const [selectedArchiveIds, setSelectedArchiveIds] = useState<string[]>([]);
	const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

	const archivableProjects = useMemo(
		() => projects.filter((project) => project.status === "done"),
		[projects],
	);
	const archivableProjectIds = useMemo(
		() => new Set(archivableProjects.map((project) => project.id)),
		[archivableProjects],
	);
	const effectiveSelectedArchiveIds = useMemo(
		() =>
			selectedArchiveIds.filter((projectId) =>
				archivableProjectIds.has(projectId),
			),
		[selectedArchiveIds, archivableProjectIds],
	);
	const isArchiveSelectionActive =
		isArchiveSelectionMode && archivableProjects.length > 0;

	const selectedArchiveProjects = useMemo(
		() =>
			projects.filter((project) =>
				effectiveSelectedArchiveIds.includes(project.id),
			),
		[projects, effectiveSelectedArchiveIds],
	);

	useEffect(() => {
		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}

			if (target.closest(".project-board .dropdown-menu")) {
				return;
			}

			document
				.querySelectorAll(".project-board .dropdown-menu[open]")
				.forEach((dropdown) => {
					dropdown.removeAttribute("open");
				});
		};

		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, []);

	const resetArchiveSelection = () => {
		setIsArchiveSelectionMode(false);
		setSelectedArchiveIds([]);
		setIsArchiveConfirmOpen(false);
	};

	const toggleArchiveSelection = (projectId: string) => {
		setSelectedArchiveIds((current) =>
			current.includes(projectId)
				? current.filter((value) => value !== projectId)
				: [...current, projectId],
		);
	};

	const handleArchiveAction = async () => {
		if (!isArchiveSelectionActive) {
			setModalState(null);
			setIsArchiveSelectionMode(true);
			setSelectedArchiveIds([]);
			setIsArchiveConfirmOpen(false);
			return;
		}

		if (effectiveSelectedArchiveIds.length === 0) {
			return;
		}

		setIsArchiveConfirmOpen(true);
	};

	return (
		<section className="section-block">
			<div className="section-heading">
				<div className="section-heading__row">
					<div>
						<p className="eyebrow">Projets</p>
						<h3>Pipeline en cours</h3>
						<p className="section-note">
							{isArchiveSelectionActive
								? "Sélectionne un ou plusieurs projets done, puis confirme leur archivage."
								: "Les projets archivés quittent cette pipeline et restent consultables dans Archives."}
						</p>
					</div>
					<div className="project-board__actions">
						{isArchiveSelectionActive ? (
							<>
								<button
									type="button"
									className="button button--ghost button--compact"
									onClick={resetArchiveSelection}
								>
									Annuler
								</button>
								<button
									type="button"
									className="button button--primary button--compact"
									onClick={() => {
										void handleArchiveAction();
									}}
									disabled={effectiveSelectedArchiveIds.length === 0}
								>
									Confirmer la sélection
								</button>
							</>
						) : (
							<>
								<button
									type="button"
									className="button button--primary button--compact"
									onClick={() => {
										void handleArchiveAction();
									}}
									disabled={archivableProjects.length === 0}
								>
									Archiver
								</button>
								<button
									type="button"
									className="button button--ghost button--compact"
									onClick={() => setModalState({ mode: "create" })}
								>
									Ajouter un projet
								</button>
							</>
						)}
					</div>
				</div>
			</div>

			<div className="project-board">
				{projects.map((project) => (
					<ProjectCard
						key={project.id}
						project={project}
						isSelected={project.id === selectedProjectId}
						isArchiveSelectionMode={isArchiveSelectionActive}
						isArchiveSelected={effectiveSelectedArchiveIds.includes(project.id)}
						onToggleArchiveSelection={toggleArchiveSelection}
						onSelect={onSelectProject}
						onOpenProject={(projectId) =>
							setModalState({
								mode: "view",
								project: projects.find((item) => item.id === projectId),
							})
						}
						onEditProject={(projectId) =>
							setModalState({
								mode: "edit",
								project: projects.find((item) => item.id === projectId),
							})
						}
						onDeleteProject={onDeleteProject}
						onUpdateStatus={onUpdateStatus}
						onUpdatePriority={onUpdatePriority}
					/>
				))}
			</div>

			{modalState ? (
				<ProjectModal
					key={`${modalState.mode}-${modalState.project?.id ?? "new"}`}
					isOpen
					mode={modalState.mode}
					initialProject={modalState.project}
					onClose={() => setModalState(null)}
					onRequestEdit={() => {
						if (!modalState.project) {
							return;
						}

						setModalState({
							mode: "edit",
							project: modalState.project,
						});
					}}
					onSubmitProject={async (project) => {
						if (modalState.mode === "create") {
							await onCreateProject(project as CreateProjectInput);
							return;
						}

						if (modalState.mode === "edit" && modalState.project) {
							await onEditProject(
								modalState.project.id,
								project as UpdateProjectInput,
							);
						}
					}}
				/>
			) : null}

			{isArchiveConfirmOpen &&
			isArchiveSelectionActive &&
			effectiveSelectedArchiveIds.length > 0 ? (
				<div className="modal-backdrop">
					<section
						className="modal-panel modal-panel--narrow"
						role="dialog"
						aria-modal="true"
						aria-labelledby="archive-projects-title"
					>
						<div className="modal-header">
							<div>
								<p className="eyebrow">Archivage</p>
								<h3 id="archive-projects-title">
									Confirmer l’archivage des projets sélectionnés
								</h3>
							</div>
						</div>

						<div className="archive-confirmation">
							<p className="section-note">
								Les projets archivés quittent immédiatement la pipeline active
								et seront déplacés dans la page Archives.
							</p>
							<ul className="archive-confirmation__list">
								{selectedArchiveProjects.map((project) => (
									<li key={project.id}>{project.name}</li>
								))}
							</ul>
						</div>

						<div className="modal-actions">
							<button
								type="button"
								className="button button--ghost"
								onClick={() => setIsArchiveConfirmOpen(false)}
							>
								Annuler
							</button>
							<button
								type="button"
								className="button button--primary"
								onClick={() => {
									void (async () => {
										try {
											await onArchiveProjects(selectedArchiveIds);
											resetArchiveSelection();
										} catch {
											// The provider already exposes the transport error state.
										}
									})();
								}}
							>
								Confirmer l’archivage
							</button>
						</div>
					</section>
				</div>
			) : null}
		</section>
	);
}
