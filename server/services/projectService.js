import { randomUUID } from "node:crypto";
import {
	getNextProjectOrderIndex,
	getProjectById,
	getProjectsByIds,
	insertProject,
	listArchivedProjects,
	listProjects,
	archiveProjects as persistArchivedProjects,
	reorderProjects as persistProjectOrder,
	deleteProject as removeProject,
	updateProject,
} from "../repositories/projectsRepository.js";
import { listTasks } from "../repositories/tasksRepository.js";
import { rewardDailyStreakIfNeeded } from "./streakService.js";

function getProjectProgress(projectId, tasks) {
	const relatedTasks = tasks.filter((task) => task.projectId === projectId);
	if (relatedTasks.length === 0) {
		return 0;
	}

	const doneCount = relatedTasks.filter((task) => task.done).length;
	return Math.round((doneCount / relatedTasks.length) * 100);
}

export function getProjectsView() {
	const tasks = listTasks();
	return listProjects().map((project) => {
		const progress = getProjectProgress(project.id, tasks);
		return {
			...project,
			progress,
			status: project.status,
		};
	});
}

export function getArchivedProjectsView() {
	const tasks = listTasks();
	return listArchivedProjects().map((project) => {
		const progress = getProjectProgress(project.id, tasks);
		return {
			...project,
			progress,
			status: project.status,
		};
	});
}

export function getProjectView(projectId) {
	return getProjectsView().find((project) => project.id === projectId) ?? null;
}

export function createProject(input) {
	const timestamp = new Date().toISOString();
	const name = input.name.trim().slice(0, 20);
	const summary = input.summary?.trim().slice(0, 96);
	const project = {
		id: randomUUID(),
		name,
		client: input.client?.trim() || "Projet personnel",
		stack: input.stack ?? [],
		priority: input.priority,
		status: input.status,
		summary: summary || "Aucun résumé pour le moment.",
		milestone: input.milestone?.trim() || "Sans échéance définie",
		orderIndex: getNextProjectOrderIndex(),
		archivedAt: null,
		createdAt: timestamp,
		updatedAt: timestamp,
	};

	insertProject(project);
	return getProjectView(project.id);
}

export function patchProject(projectId, changes) {
	const current = getProjectById(projectId);
	if (!current) {
		return null;
	}

	const nextName =
		changes.name === undefined
			? current.name
			: changes.name.trim().slice(0, 20);
	const nextSummary =
		changes.summary === undefined
			? current.summary
			: changes.summary.trim().slice(0, 96) || "Aucun résumé pour le moment.";

	const nextStatus = changes.status ?? current.status;

	updateProject(projectId, {
		name: nextName,
		client:
			changes.client === undefined
				? current.client
				: changes.client.trim() || "Projet personnel",
		stack: changes.stack ?? current.stack,
		priority: changes.priority ?? current.priority,
		status: nextStatus,
		summary: nextSummary,
		milestone:
			changes.milestone === undefined
				? current.milestone
				: changes.milestone.trim() || "Sans échéance définie",
	});

	if (current.status !== "done" && nextStatus === "done") {
		rewardDailyStreakIfNeeded();
	}

	return getProjectView(projectId);
}

export function deleteProject(projectId) {
	if (!getProjectById(projectId)) {
		return false;
	}

	return removeProject(projectId);
}

export function archiveProjects(projectIds) {
	const uniqueProjectIds = [...new Set(projectIds)];
	if (uniqueProjectIds.length === 0) {
		throw new Error("No projects selected for archive");
	}

	const projects = getProjectsByIds(uniqueProjectIds);
	if (projects.length !== uniqueProjectIds.length) {
		throw new Error("Project not found");
	}

	const invalidProject = projects.find(
		(project) => project.archivedAt !== null || project.status !== "done",
	);
	if (invalidProject) {
		throw new Error("Only done projects can be archived");
	}

	const archivedAt = new Date().toISOString();
	persistArchivedProjects(uniqueProjectIds, archivedAt);
}

export function reorderProjects(projectIds) {
	const uniqueProjectIds = [...new Set(projectIds)];
	const activeProjects = listProjects();

	if (activeProjects.length === 0) {
		return;
	}

	if (uniqueProjectIds.length !== activeProjects.length) {
		throw new Error("Project reorder payload is incomplete");
	}

	const activeProjectIds = new Set(activeProjects.map((project) => project.id));
	if (uniqueProjectIds.some((projectId) => !activeProjectIds.has(projectId))) {
		throw new Error("Project reorder payload is invalid");
	}

	persistProjectOrder(uniqueProjectIds);
}
