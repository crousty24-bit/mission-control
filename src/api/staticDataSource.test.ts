// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { staticDataSource } from "./staticDataSource";

beforeEach(() => {
	localStorage.clear();
	window.location.hash = "";
});

describe("staticDataSource", () => {
	it("loads seeded data when localStorage is empty", async () => {
		await expect(staticDataSource.getProjects()).resolves.toHaveLength(3);
		await expect(staticDataSource.getTasks()).resolves.toHaveLength(8);
		await expect(staticDataSource.getAgents()).resolves.toHaveLength(3);

		const snapshot = await staticDataSource.getUserSnapshot();
		expect(snapshot).toMatchObject({
			activeProjects: 3,
			completedTasks: 4,
			remainingTasks: 4,
			completionRate: 50,
		});
	});

	it("persists project and task mutations in localStorage", async () => {
		const project = await staticDataSource.createProject({
			name: "  Projet local très long  ",
			client: "",
			stack: ["React"],
			priority: "high",
			status: "planned",
			summary: "",
			milestone: "",
		});
		const task = await staticDataSource.createTask({
			title: "Tâche locale",
			projectId: project.id,
		});

		expect(project.name).toBe("Projet local très lo");
		expect(project.client).toBe("Projet personnel");
		expect(task.projectId).toBe(project.id);
		expect(await staticDataSource.getProjects()).toContainEqual(
			expect.objectContaining({ id: project.id }),
		);

		await staticDataSource.deleteProject(project.id);
		expect(await staticDataSource.getProjects()).not.toContainEqual(
			expect.objectContaining({ id: project.id }),
		);
		expect(await staticDataSource.getTasks()).not.toContainEqual(
			expect.objectContaining({ id: task.id }),
		);
	});

	it("syncs project progress and status from completed then reopened tasks", async () => {
		const project = await staticDataSource.createProject({
			name: "Statut",
			client: "Client",
			stack: ["TypeScript"],
			priority: "medium",
			status: "in-progress",
			summary: "Résumé",
			milestone: "demain",
		});
		const firstTask = await staticDataSource.createTask({
			title: "Première tâche",
			projectId: project.id,
		});
		const secondTask = await staticDataSource.createTask({
			title: "Deuxième tâche",
			projectId: project.id,
		});

		await staticDataSource.updateTask(firstTask.id, { done: true });
		expect(
			(await staticDataSource.getProjects()).find(
				(item) => item.id === project.id,
			),
		).toMatchObject({ progress: 50, status: "in-progress" });

		await staticDataSource.updateTask(secondTask.id, { done: true });
		expect(
			(await staticDataSource.getProjects()).find(
				(item) => item.id === project.id,
			),
		).toMatchObject({ progress: 100, status: "done" });

		await staticDataSource.updateTask(firstTask.id, { done: false });
		expect(
			(await staticDataSource.getProjects()).find(
				(item) => item.id === project.id,
			),
		).toMatchObject({ progress: 50, status: "in-progress" });
	});

	it("archives only done projects", async () => {
		const plannedProject = await staticDataSource.createProject({
			name: "Actif",
			client: "Client",
			stack: ["React"],
			priority: "low",
			status: "planned",
			summary: "Résumé",
			milestone: "demain",
		});

		await expect(
			staticDataSource.archiveProjects([plannedProject.id]),
		).rejects.toThrow("Only done projects can be archived");

		const doneProject = await staticDataSource.createProject({
			name: "Terminé",
			client: "Client",
			stack: ["React"],
			priority: "low",
			status: "done",
			summary: "Résumé",
			milestone: "demain",
		});
		await staticDataSource.archiveProjects([doneProject.id]);

		expect(await staticDataSource.getArchivedProjects()).toContainEqual(
			expect.objectContaining({ id: doneProject.id }),
		);
		expect((await staticDataSource.getUserSnapshot()).medalsRewardCount).toBe(
			1,
		);
	});

	it("persists dashboard notes and calendar events", async () => {
		await staticDataSource.updateDashboardNote({ content: "# Note demo" });
		const event = await staticDataSource.createCalendarEvent({
			title: "Release",
			date: "2026-05-08",
			time: "09:30",
			kind: "reminder",
			notes: "Préparer",
		});

		expect(await staticDataSource.getDashboardNote()).toMatchObject({
			content: "# Note demo",
		});
		expect(await staticDataSource.getCalendarEvents()).toContainEqual(
			expect.objectContaining({ id: event.id, title: "Release" }),
		);
	});
});
