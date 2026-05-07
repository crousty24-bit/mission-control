import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupTestDatabase } from "../test-utils/database.js";

let cleanupDatabase;
let projectService;
let taskService;

beforeEach(async () => {
	const database = await setupTestDatabase();
	cleanupDatabase = database.cleanup;
	projectService = await import("./projectService.js");
	taskService = await import("./taskService.js");
});

afterEach(async () => {
	await cleanupDatabase?.();
	cleanupDatabase = undefined;
});

function createProject(status = "planned") {
	return projectService.createProject({
		name: "Projet tâches",
		client: "Client",
		stack: ["Node"],
		priority: "medium",
		status,
		summary: "Résumé",
		milestone: "demain matin",
	});
}

describe("taskService", () => {
	it("refuses task creation for a missing project", () => {
		expect(
			taskService.createTaskRecord({
				title: "Tâche orpheline",
				projectId: "missing-project",
			}),
		).toBeNull();
	});

	it("syncs project status when all tasks are completed or reopened", () => {
		const project = createProject("in-progress");
		const firstTask = taskService.createTaskRecord({
			title: "Première tâche",
			projectId: project.id,
		});
		const secondTask = taskService.createTaskRecord({
			title: "Deuxième tâche",
			projectId: project.id,
		});

		taskService.patchTask(firstTask.id, { done: true });
		expect(projectService.getProjectView(project.id).status).toBe(
			"in-progress",
		);

		taskService.patchTask(secondTask.id, { done: true });
		expect(projectService.getProjectView(project.id).status).toBe("done");

		taskService.patchTask(firstTask.id, { done: false });
		expect(projectService.getProjectView(project.id).status).toBe(
			"in-progress",
		);
	});

	it("calculates completion rate from active project tasks only", () => {
		const project = createProject("in-progress");
		const firstTask = taskService.createTaskRecord({
			title: "Done",
			projectId: project.id,
		});
		taskService.createTaskRecord({ title: "Open", projectId: project.id });
		taskService.patchTask(firstTask.id, { done: true });

		expect(taskService.getCompletionRate()).toBeGreaterThan(0);
		expect(taskService.getCompletionRate()).toBeLessThan(100);
	});

	it("persists valid task reorder and rejects incomplete or invalid payloads", () => {
		const project = createProject("in-progress");
		const firstTask = taskService.createTaskRecord({
			title: "Première tâche",
			projectId: project.id,
		});
		const secondTask = taskService.createTaskRecord({
			title: "Deuxième tâche",
			projectId: project.id,
		});
		const reversedTaskIds = [secondTask.id, firstTask.id];

		taskService.reorderTasks(project.id, reversedTaskIds);
		expect(taskService.getTasks(project.id).map((task) => task.id)).toEqual(
			reversedTaskIds,
		);

		expect(() => taskService.reorderTasks(project.id, [firstTask.id])).toThrow(
			"Task reorder payload is incomplete",
		);
		expect(() =>
			taskService.reorderTasks(project.id, [firstTask.id, "missing-task"]),
		).toThrow("Task reorder payload is invalid");
	});
});
