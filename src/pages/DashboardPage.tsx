import { useState } from "react";
import { ProjectBoard } from "../components/ProjectBoard";
import { ProjectStatusSummary } from "../components/ProjectStatusSummary";
import { RewardNotification } from "../components/RewardNotification";
import { StatusPanel } from "../components/StatusPanel";
import { TodoPanel } from "../components/TodoPanel";
import { useProjectActions, useProjects } from "../features/projects/hooks";
import { useTaskActions, useTasks } from "../features/tasks/hooks";
import { useUserSnapshot } from "../features/user/hooks";

export function DashboardPage() {
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
	const resolvedProjectId =
		selectedProjectId &&
		projects.some((project) => project.id === selectedProjectId)
			? selectedProjectId
			: (projects[0]?.id ?? "");
	const selectedProject = projects.find(
		(project) => project.id === resolvedProjectId,
	);
	const { tasks } = useTasks(resolvedProjectId || undefined);

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
		<div className="page-stack">
			<RewardNotification />
			<StatusPanel snapshot={snapshot} />
			<ProjectBoard
				projects={projects}
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
				<p className="mutating-indicator">Synchronisation locale en cours...</p>
			) : null}
		</div>
	);
}
