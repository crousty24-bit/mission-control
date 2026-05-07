import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupTestDatabase } from "../test-utils/database.js";

let cleanupDatabase;
let projectService;

beforeEach(async () => {
	const database = await setupTestDatabase();
	cleanupDatabase = database.cleanup;
	projectService = await import("./projectService.js");
});

afterEach(async () => {
	await cleanupDatabase?.();
	cleanupDatabase = undefined;
});

function createProject(overrides = {}) {
	return projectService.createProject({
		name: "  Projet test avec un nom beaucoup trop long  ",
		client: "  Client test  ",
		stack: ["React"],
		priority: "high",
		status: "planned",
		summary: "  Résumé projet  ",
		milestone: "  UI freeze jeudi 18:00  ",
		...overrides,
	});
}

describe("projectService", () => {
	it("normalise project creation fields and caps public text lengths", () => {
		const project = createProject({
			client: "   ",
			summary: "",
			milestone: "",
		});

		expect(project.name).toBe("Projet test avec un ");
		expect(project.client).toBe("Projet personnel");
		expect(project.summary).toBe("Aucun résumé pour le moment.");
		expect(project.milestone).toBe("Sans échéance définie");
		expect(project.archivedAt).toBeNull();
	});

	it("calculates project progress from related tasks", async () => {
		const { createTaskRecord, patchTask } = await import("./taskService.js");
		const project = createProject({ name: "Progression" });
		const firstTask = createTaskRecord({
			title: "Première tâche",
			projectId: project.id,
		});
		createTaskRecord({ title: "Deuxième tâche", projectId: project.id });

		patchTask(firstTask.id, { done: true });

		expect(projectService.getProjectView(project.id).progress).toBe(50);
	});

	it("archives only done projects", () => {
		const activeProject = createProject({ name: "Actif", status: "planned" });
		expect(() => projectService.archiveProjects([activeProject.id])).toThrow(
			"Only done projects can be archived",
		);

		const doneProject = createProject({ name: "Terminé", status: "done" });
		projectService.archiveProjects([doneProject.id]);

		expect(projectService.getProjectsView()).not.toContainEqual(
			expect.objectContaining({ id: doneProject.id }),
		);
		expect(projectService.getArchivedProjectsView()).toContainEqual(
			expect.objectContaining({ id: doneProject.id }),
		);
	});

	it("persists valid project reorder and rejects incomplete or invalid payloads", () => {
		const projects = projectService.getProjectsView();
		const reversedProjectIds = projects.map((project) => project.id).reverse();

		projectService.reorderProjects(reversedProjectIds);
		expect(
			projectService.getProjectsView().map((project) => project.id),
		).toEqual(reversedProjectIds);

		expect(() =>
			projectService.reorderProjects(reversedProjectIds.slice(1)),
		).toThrow("Project reorder payload is incomplete");
		expect(() =>
			projectService.reorderProjects([
				...reversedProjectIds.slice(0, -1),
				"missing-project",
			]),
		).toThrow("Project reorder payload is invalid");
	});
});
