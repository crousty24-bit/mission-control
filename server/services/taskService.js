import { randomUUID } from "node:crypto";
import {
	getProjectById,
	listProjects,
	updateProject,
} from "../repositories/projectsRepository.js";
import {
	getTaskById,
	insertTask,
	listTasks,
	reorderTasks as persistTaskOrder,
	deleteTask as removeTask,
	updateTask,
} from "../repositories/tasksRepository.js";
import { rewardDailyStreakIfNeeded } from "./streakService.js";

function syncProjectStatus(projectId) {
	const project = getProjectById(projectId);
	if (!project) {
		return;
	}

	const tasks = listTasks(projectId);
	if (tasks.length === 0) {
		return;
	}

	const allDone = tasks.every((task) => task.done);
	let nextStatus = project.status;

	if (allDone && nextStatus !== "done") {
		nextStatus = "done";
	} else if (!allDone && nextStatus === "done") {
		nextStatus = "in-progress";
	}

	if (nextStatus !== project.status) {
		updateProject(projectId, { status: nextStatus });
		if (nextStatus === "done") {
			rewardDailyStreakIfNeeded();
		}
	}
}

export function getTasks(projectId) {
	return listTasks(projectId);
}

export function createTaskRecord(input) {
	if (!getProjectById(input.projectId)) {
		return null;
	}

	const timestamp = new Date().toISOString();
	const task = {
		id: randomUUID(),
		title: input.title,
		done: false,
		projectId: input.projectId,
		urgency: input.urgency ?? "today",
		orderIndex: 0,
		createdAt: timestamp,
		updatedAt: timestamp,
	};

	insertTask(task);
	syncProjectStatus(task.projectId);
	return getTaskById(task.id);
}

export function patchTask(taskId, changes) {
	const current = getTaskById(taskId);
	if (!current) {
		return null;
	}

	if (changes.projectId && !getProjectById(changes.projectId)) {
		return null;
	}

	const nextTask = updateTask(taskId, {
		title: changes.title ?? current.title,
		done: changes.done ?? current.done,
		projectId: changes.projectId ?? current.projectId,
		urgency: changes.urgency ?? current.urgency,
	});
	if (nextTask.projectId !== current.projectId) {
		syncProjectStatus(current.projectId);
	}
	syncProjectStatus(nextTask.projectId);
	if (!current.done && nextTask.done) {
		rewardDailyStreakIfNeeded();
	}
	return nextTask;
}

export function deleteTask(taskId) {
	const current = getTaskById(taskId);
	if (!current) {
		return false;
	}

	const deleted = removeTask(taskId);
	if (deleted) {
		syncProjectStatus(current.projectId);
	}

	return deleted;
}

export function getCompletionRate() {
	const activeProjectIds = new Set(listProjects().map((project) => project.id));
	const tasks = listTasks().filter((task) =>
		activeProjectIds.has(task.projectId),
	);
	if (tasks.length === 0) {
		return 0;
	}

	const doneCount = tasks.filter((task) => task.done).length;
	return Math.round((doneCount / tasks.length) * 100);
}

export function reorderTasks(projectId, taskIds) {
	if (!getProjectById(projectId)) {
		throw new Error("Project not found");
	}

	const uniqueTaskIds = [...new Set(taskIds)];
	const currentTasks = listTasks(projectId);

	if (uniqueTaskIds.length !== currentTasks.length) {
		throw new Error("Task reorder payload is incomplete");
	}

	const currentTaskIds = new Set(currentTasks.map((task) => task.id));
	if (uniqueTaskIds.some((taskId) => !currentTaskIds.has(taskId))) {
		throw new Error("Task reorder payload is invalid");
	}

	persistTaskOrder(projectId, uniqueTaskIds);
}
