import {
	listArchivedProjects,
	listProjects,
} from "../repositories/projectsRepository.js";
import { listTasks } from "../repositories/tasksRepository.js";
import {
	getUserSnapshotRecord,
	updateUserSnapshot,
} from "../repositories/userSnapshotRepository.js";
import { resetExpiredStreakIfNeeded } from "./streakService.js";
import { getCompletionRate } from "./taskService.js";

function getActiveTaskStats() {
	const activeProjectIds = new Set(listProjects().map((project) => project.id));
	const tasks = listTasks().filter((task) =>
		activeProjectIds.has(task.projectId),
	);

	return {
		completedTasks: tasks.filter((task) => task.done).length,
		remainingTasks: tasks.filter((task) => !task.done).length,
	};
}

export function getUserSnapshotView() {
	resetExpiredStreakIfNeeded();
	const snapshot = getUserSnapshotRecord();
	if (!snapshot) {
		return null;
	}

	const { completedTasks, remainingTasks } = getActiveTaskStats();

	return {
		developer: snapshot.developer,
		activeProjects: listProjects().length,
		completedTasks,
		remainingTasks,
		nextDeadline: snapshot.nextDeadline,
		completionRate: getCompletionRate(),
		streakCount: snapshot.streakCount,
		streakLastRewardedAt: snapshot.streakLastRewardedAt,
		medalsRewardCount: listArchivedProjects().length,
	};
}

export function patchUserSnapshot(changes) {
	const current = getUserSnapshotRecord();
	if (!current) {
		return null;
	}

	updateUserSnapshot({
		developer: changes.developer ?? current.developer,
		nextDeadline: changes.nextDeadline ?? current.nextDeadline,
	});

	return getUserSnapshotView();
}
