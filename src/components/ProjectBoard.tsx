import {
	type PointerEvent as ReactPointerEvent,
	useEffect,
	useEffectEvent,
	useMemo,
	useRef,
	useState,
} from "react";
import type {
	CreateProjectInput,
	Project,
	ProjectPriority,
	ProjectStatus,
	UpdateProjectInput,
} from "../types";
import { GripIcon } from "./IconButton";
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
	onReorderProjects: (projectIds: string[]) => Promise<void> | void;
}

function moveProject(
	projects: Project[],
	draggedProjectId: string,
	targetProjectId: string,
) {
	const draggedIndex = projects.findIndex(
		(project) => project.id === draggedProjectId,
	);
	const targetIndex = projects.findIndex(
		(project) => project.id === targetProjectId,
	);

	if (
		draggedIndex === -1 ||
		targetIndex === -1 ||
		draggedIndex === targetIndex
	) {
		return projects;
	}

	const nextProjects = [...projects];
	const [draggedProject] = nextProjects.splice(draggedIndex, 1);
	nextProjects.splice(targetIndex, 0, draggedProject);
	return nextProjects;
}

function orderProjects(
	projects: Project[],
	projectOrderOverride: string[] | null,
) {
	if (!projectOrderOverride) {
		return projects;
	}

	const projectsById = new Map(
		projects.map((project) => [project.id, project]),
	);
	const orderedProjects = projectOrderOverride
		.map((projectId) => projectsById.get(projectId))
		.filter((project): project is Project => Boolean(project));
	const knownProjectIds = new Set(orderedProjects.map((project) => project.id));
	const remainingProjects = projects.filter(
		(project) => !knownProjectIds.has(project.id),
	);

	return [...orderedProjects, ...remainingProjects];
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
	onReorderProjects,
}: ProjectBoardProps) {
	const [isShowingAllProjects, setIsShowingAllProjects] = useState(false);
	const [modalState, setModalState] = useState<{
		mode: "create" | "edit" | "view";
		project?: Project;
	} | null>(null);
	const [isArchiveSelectionMode, setIsArchiveSelectionMode] = useState(false);
	const [selectedArchiveIds, setSelectedArchiveIds] = useState<string[]>([]);
	const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
	const [projectOrderOverride, setProjectOrderOverride] = useState<
		string[] | null
	>(null);
	const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
	const draggedProjectIdRef = useRef<string | null>(null);
	const dragStartOrderRef = useRef<string[]>([]);
	const didReorderRef = useRef(false);
	const orderedProjects = useMemo(() => {
		return orderProjects(projects, projectOrderOverride);
	}, [projectOrderOverride, projects]);
	const visibleProjects = useMemo(
		() =>
			isShowingAllProjects ? orderedProjects : orderedProjects.slice(0, 6),
		[isShowingAllProjects, orderedProjects],
	);
	const orderedProjectsRef = useRef(orderedProjects);
	const projectsRef = useRef(projects);
	const onReorderProjectsRef = useRef(onReorderProjects);

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

	useEffect(() => {
		orderedProjectsRef.current = orderedProjects;
	}, [orderedProjects]);

	useEffect(() => {
		projectsRef.current = projects;
		onReorderProjectsRef.current = onReorderProjects;
	}, [onReorderProjects, projects]);

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

	const restoreProjectOrder = useEffectEvent((projectOrder: string[]) => {
		const currentProjectOrder = projectsRef.current.map(
			(project) => project.id,
		);
		setProjectOrderOverride(
			projectOrder.join(",") === currentProjectOrder.join(",")
				? null
				: projectOrder,
		);
	});

	const handleProjectPointerDown =
		(projectId: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
			if (isArchiveSelectionActive) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			dragStartOrderRef.current = orderedProjects.map((project) => project.id);
			didReorderRef.current = false;
			draggedProjectIdRef.current = projectId;
			setDraggedProjectId(projectId);
		};

	const finishProjectReorder = useEffectEvent(() => {
		if (!draggedProjectIdRef.current) {
			dragStartOrderRef.current = [];
			return;
		}

		const previousOrder = dragStartOrderRef.current;
		const nextOrder = orderedProjectsRef.current.map((project) => project.id);
		draggedProjectIdRef.current = null;
		setDraggedProjectId(null);
		dragStartOrderRef.current = [];
		didReorderRef.current = false;

		if (previousOrder.join(",") === nextOrder.join(",")) {
			return;
		}

		void Promise.resolve()
			.then(() => onReorderProjectsRef.current(nextOrder))
			.catch(() => {
				restoreProjectOrder(previousOrder);
			});
	});

	useEffect(() => {
		if (!draggedProjectId) {
			return;
		}

		const handlePointerMove = (event: PointerEvent) => {
			if (!draggedProjectIdRef.current) {
				return;
			}

			const target = document.elementFromPoint(
				event.clientX,
				event.clientY,
			) as HTMLElement | null;
			const targetCard = target?.closest("[data-project-card-id]");
			const targetProjectId = targetCard?.getAttribute("data-project-card-id");

			if (!targetProjectId || draggedProjectIdRef.current === targetProjectId) {
				return;
			}

			didReorderRef.current = true;
			const nextProjects = moveProject(
				orderedProjectsRef.current,
				draggedProjectIdRef.current,
				targetProjectId,
			);
			setProjectOrderOverride(nextProjects.map((project) => project.id));
		};

		const cancelProjectDrag = () => {
			if (dragStartOrderRef.current.length > 0) {
				restoreProjectOrder(dragStartOrderRef.current);
			}

			didReorderRef.current = false;
			dragStartOrderRef.current = [];
			draggedProjectIdRef.current = null;
			setDraggedProjectId(null);
		};

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", finishProjectReorder);
		window.addEventListener("pointercancel", cancelProjectDrag);
		window.addEventListener("blur", cancelProjectDrag);

		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", finishProjectReorder);
			window.removeEventListener("pointercancel", cancelProjectDrag);
			window.removeEventListener("blur", cancelProjectDrag);
		};
	}, [draggedProjectId]);

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
				{visibleProjects.map((project) => (
					<ProjectCard
						key={project.id}
						project={project}
						isSelected={project.id === selectedProjectId}
						isArchiveSelectionMode={isArchiveSelectionActive}
						isArchiveSelected={effectiveSelectedArchiveIds.includes(project.id)}
						isDragging={draggedProjectId === project.id}
						dragHandle={
							!isArchiveSelectionActive ? (
								<button
									type="button"
									className="drag-handle"
									aria-label={`Réordonner ${project.name}`}
									title={`Réordonner ${project.name}`}
									onClick={(event) => {
										event.preventDefault();
										event.stopPropagation();
									}}
									onPointerDown={handleProjectPointerDown(project.id)}
								>
									<GripIcon />
								</button>
							) : null
						}
						onToggleArchiveSelection={toggleArchiveSelection}
						onSelect={onSelectProject}
						onOpenProject={(projectId) =>
							setModalState({
								mode: "view",
								project: orderedProjects.find((item) => item.id === projectId),
							})
						}
						onEditProject={(projectId) =>
							setModalState({
								mode: "edit",
								project: orderedProjects.find((item) => item.id === projectId),
							})
						}
						onDeleteProject={onDeleteProject}
						onUpdateStatus={onUpdateStatus}
						onUpdatePriority={onUpdatePriority}
					/>
				))}
			</div>

			{orderedProjects.length > 6 ? (
				<div className="section-footer-action">
					<button
						type="button"
						className="section-link-action"
						aria-expanded={isShowingAllProjects}
						onClick={() => setIsShowingAllProjects((current) => !current)}
					>
						{isShowingAllProjects ? "show less" : "view all"}
					</button>
				</div>
			) : null}

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
