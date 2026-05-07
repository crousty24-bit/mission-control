import { useMemo, useState } from "react";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { ProjectBoard } from "../components/ProjectBoard";
import { ProjectStatusSummary } from "../components/ProjectStatusSummary";
import { StatusPanel } from "../components/StatusPanel";
import { TodoPanel } from "../components/TodoPanel";
import {
	useDashboardCalendar,
	useDashboardFeatureActions,
	useDashboardNote,
} from "../features/dashboard/hooks";
import { useProjectActions, useProjects } from "../features/projects/hooks";
import { useTaskActions, useTasks } from "../features/tasks/hooks";
import { useUserSnapshot } from "../features/user/hooks";
import type { Project } from "../types";

interface DashboardPageProps {
	projectSearchQuery: string;
}

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
	const { calendarEvents } = useDashboardCalendar();
	const { dashboardNote } = useDashboardNote();
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
	const {
		createCalendarEvent,
		deleteCalendarEvent,
		updateDashboardNote,
		isMutating: isDashboardFeatureMutating,
	} = useDashboardFeatureActions();
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
			<DashboardSidebar
				calendarEvents={calendarEvents}
				dashboardNote={dashboardNote}
				isMenuOpen={isDashboardMenuOpen}
				isMutating={isDashboardFeatureMutating}
				projects={projects}
				onCreateCalendarEvent={createCalendarEvent}
				onDeleteCalendarEvent={deleteCalendarEvent}
				onToggleMenu={() => setIsDashboardMenuOpen((isOpen) => !isOpen)}
				onUpdateDashboardNote={updateDashboardNote}
			/>

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
