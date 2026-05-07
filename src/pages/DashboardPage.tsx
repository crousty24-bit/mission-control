import { useMemo, useState } from "react";
import { ProjectBoard } from "../components/ProjectBoard";
import { ProjectStatusSummary } from "../components/ProjectStatusSummary";
import { StatusPanel } from "../components/StatusPanel";
import { TodoPanel } from "../components/TodoPanel";
import { useProjectActions, useProjects } from "../features/projects/hooks";
import { useTaskActions, useTasks } from "../features/tasks/hooks";
import { useUserSnapshot } from "../features/user/hooks";
import type { Project } from "../types";

interface DashboardPageProps {
	projectSearchQuery: string;
}

const dashboardMenuItems = [
	{ label: "Activités", detail: "Flux local" },
	{ label: "Planning", detail: "À venir" },
	{ label: "Notes", detail: "Capture" },
	{ label: "Suivi", detail: "Repères" },
];

function normalizeSearchValue(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

function getProjectSearchText(project: Project) {
	return normalizeSearchValue(
		[
			project.name,
			project.client,
			project.stack.join(" "),
			project.summary,
			project.milestone,
		].join(" "),
	);
}

export function DashboardPage({ projectSearchQuery }: DashboardPageProps) {
	const { projects, isLoading, error } = useProjects();
	const { snapshot } = useUserSnapshot();
	const {
		archiveProjects,
		createProject,
		deleteProject,
		editProject,
		reorderProjects,
		updateProjectPriority,
		updateProjectStatus,
		isMutating,
	} = useProjectActions();
	const { createTask, deleteTask, editTask, reorderTasks, toggleTask } =
		useTaskActions();
	const [selectedProjectId, setSelectedProjectId] = useState("");
	const [isDashboardMenuOpen, setIsDashboardMenuOpen] = useState(false);
	const resolvedProjectId =
		selectedProjectId &&
		projects.some((project) => project.id === selectedProjectId)
			? selectedProjectId
			: (projects[0]?.id ?? "");
	const selectedProject = projects.find(
		(project) => project.id === resolvedProjectId,
	);
	const { tasks } = useTasks(resolvedProjectId || undefined);
	const filteredProjects = useMemo(() => {
		const searchTerms = normalizeSearchValue(projectSearchQuery)
			.trim()
			.split(/\s+/)
			.filter(Boolean);

		if (searchTerms.length === 0) {
			return projects;
		}

		return projects.filter((project) => {
			const searchText = getProjectSearchText(project);
			return searchTerms.every((term) => searchText.includes(term));
		});
	}, [projectSearchQuery, projects]);

	if (isLoading) {
		return (
			<section className="section-block feedback-panel">
				Connexion au workspace local...
			</section>
		);
	}

	if (error) {
		return (
			<section className="section-block feedback-panel">
				Erreur API: {error}
			</section>
		);
	}

	if (!selectedProject) {
		return (
			<section className="section-block feedback-panel">
				Aucun projet disponible. Utilise “Ajouter un projet” pour initialiser
				Mission Control.
			</section>
		);
	}

	return (
		<div
			className={
				isDashboardMenuOpen
					? "dashboard-layout dashboard-layout--open"
					: "dashboard-layout"
			}
		>
			<aside
				id="dashboard-activity-menu"
				className="dashboard-sidebar"
				aria-label="Activités du dashboard"
			>
				<button
					type="button"
					className="dashboard-sidebar__toggle"
					aria-controls="dashboard-activity-menu"
					aria-expanded={isDashboardMenuOpen}
					aria-label={
						isDashboardMenuOpen
							? "Réduire le menu dashboard"
							: "Ouvrir le menu dashboard"
					}
					title={
						isDashboardMenuOpen
							? "Réduire le menu dashboard"
							: "Ouvrir le menu dashboard"
					}
					onClick={() => setIsDashboardMenuOpen((isOpen) => !isOpen)}
				>
					<span className="dashboard-sidebar__toggle-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
							<path
								d="M4 7h16M4 12h16M4 17h16"
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeWidth="1.8"
							/>
						</svg>
					</span>
					<span className="sr-only">
						{isDashboardMenuOpen
							? "Réduire le menu dashboard"
							: "Ouvrir le menu dashboard"}
					</span>
				</button>

				<div
					className="dashboard-sidebar__panel"
					aria-hidden={!isDashboardMenuOpen}
				>
					<div className="dashboard-sidebar__header">
						<p className="eyebrow">Dashboard</p>
						<h2>Activités</h2>
					</div>

					<nav className="dashboard-sidebar__nav" aria-label="Menu dashboard">
						{dashboardMenuItems.map((item) => (
							<button
								key={item.label}
								type="button"
								className="dashboard-sidebar__item"
								disabled
								aria-disabled="true"
							>
								<span>{item.label}</span>
								<small>{item.detail}</small>
							</button>
						))}
					</nav>
				</div>
			</aside>

			<div className="page-stack dashboard-layout__content">
				<StatusPanel snapshot={snapshot} />
				<ProjectBoard
					projects={projects}
					filteredProjects={filteredProjects}
					projectSearchQuery={projectSearchQuery}
					selectedProjectId={resolvedProjectId}
					onSelectProject={setSelectedProjectId}
					onCreateProject={async (project) => {
						const createdProject = await createProject(project);
						setSelectedProjectId(createdProject.id);
						return createdProject;
					}}
					onEditProject={editProject}
					onUpdateStatus={(projectId, status) => {
						void updateProjectStatus(projectId, status);
					}}
					onUpdatePriority={(projectId, priority) => {
						void updateProjectPriority(projectId, priority);
					}}
					onDeleteProject={(projectId) => {
						void deleteProject(projectId);
					}}
					onArchiveProjects={(projectIds) => archiveProjects(projectIds)}
					onReorderProjects={(projectIds) => reorderProjects(projectIds)}
				/>

				<section className="dashboard-grid">
					<TodoPanel
						key={resolvedProjectId}
						tasks={tasks}
						selectedProject={selectedProject}
						onToggleTask={(taskId) => {
							void toggleTask(taskId);
						}}
						onAddTask={(title, projectId) => {
							void createTask({ title, projectId, urgency: "today" });
						}}
						onDeleteTask={(taskId) => {
							void deleteTask(taskId);
						}}
						onEditTask={(taskId, title) => {
							void editTask(taskId, title);
						}}
						onReorderTasks={(projectId, taskIds) =>
							reorderTasks(projectId, taskIds)
						}
					/>
					<ProjectStatusSummary projects={projects} />
				</section>

				{isMutating ? (
					<p className="mutating-indicator">
						Synchronisation locale en cours...
					</p>
				) : null}
			</div>
		</div>
	);
}
