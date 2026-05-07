import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupTestDatabase } from "../test-utils/database.js";

let cleanupDatabase;
let handleApiRequest;

function createMockRequest(path, init = {}) {
	const body = init.body ? [Buffer.from(init.body)] : [];
	const request = Readable.from(body);
	request.method = init.method ?? "GET";
	request.url = path;
	return request;
}

function createMockResponse() {
	const chunks = [];
	return {
		headers: {},
		statusCode: 200,
		writeHead(statusCode, headers = {}) {
			this.statusCode = statusCode;
			this.headers = headers;
		},
		end(chunk = "") {
			if (chunk) {
				chunks.push(Buffer.from(chunk));
			}
		},
		getText() {
			return Buffer.concat(chunks).toString("utf8");
		},
	};
}

async function request(path, init) {
	const mockRequest = createMockRequest(path, init);
	const response = createMockResponse();
	const url = new URL(path, "http://127.0.0.1");
	const handled = await handleApiRequest(mockRequest, response, url);
	if (!handled) {
		response.writeHead(404);
		response.end("Not found");
	}
	const text = response.getText();
	let body;
	try {
		body = text ? JSON.parse(text) : undefined;
	} catch {
		body = undefined;
	}
	return { body, response, text };
}

beforeEach(async () => {
	const database = await setupTestDatabase();
	cleanupDatabase = database.cleanup;
	const apiModule = await import("./api.js");
	handleApiRequest = apiModule.handleApiRequest;
});

afterEach(async () => {
	await cleanupDatabase?.();
	cleanupDatabase = undefined;
	handleApiRequest = undefined;
});

describe("api routes", () => {
	it("handles project and task lifecycle with derived snapshot metrics", async () => {
		const { body: project, response: projectResponse } = await request(
			"/api/projects",
			{
				method: "POST",
				body: JSON.stringify({
					name: "Projet API",
					client: "Client",
					stack: ["React"],
					priority: "high",
					status: "in-progress",
					summary: "Résumé",
					milestone: "jeudi 18:00",
				}),
			},
		);
		expect(projectResponse.statusCode).toBe(201);

		const { body: task, response: taskResponse } = await request("/api/tasks", {
			method: "POST",
			body: JSON.stringify({
				title: "Tâche API",
				projectId: project.id,
				urgency: "today",
			}),
		});
		expect(taskResponse.statusCode).toBe(201);

		const { response: patchTaskResponse } = await request(
			`/api/tasks/${task.id}`,
			{
				method: "PATCH",
				body: JSON.stringify({ done: true }),
			},
		);
		expect(patchTaskResponse.statusCode).toBe(200);

		const { body: snapshot } = await request("/api/user-snapshot");
		expect(snapshot.completedTasks).toBeGreaterThan(0);
		expect(snapshot.completionRate).toBeGreaterThan(0);

		const { response: incompleteReorderResponse, text } = await request(
			"/api/tasks/reorder",
			{
				method: "POST",
				body: JSON.stringify({ projectId: project.id, taskIds: [] }),
			},
		);
		expect(incompleteReorderResponse.statusCode).toBe(400);
		expect(text).toBe("Task reorder payload is incomplete");

		const { response: archiveResponse } = await request(
			"/api/projects/archive",
			{
				method: "POST",
				body: JSON.stringify({ projectIds: [project.id] }),
			},
		);
		expect(archiveResponse.statusCode).toBe(204);

		const { body: archivedProjects } = await request("/api/projects/archived");
		expect(archivedProjects).toContainEqual(
			expect.objectContaining({ id: project.id }),
		);
	});

	it("handles calendar events and dashboard note routes", async () => {
		const { body: event, response: createEventResponse } = await request(
			"/api/calendar-events",
			{
				method: "POST",
				body: JSON.stringify({
					title: "Démo",
					date: "2026-05-07",
					time: "18:00",
					kind: "event",
					notes: "Note",
				}),
			},
		);
		expect(createEventResponse.statusCode).toBe(201);

		const { body: updatedEvent } = await request(
			`/api/calendar-events/${event.id}`,
			{
				method: "PATCH",
				body: JSON.stringify({ title: "Démo modifiée" }),
			},
		);
		expect(updatedEvent.title).toBe("Démo modifiée");

		const { response: invalidEventResponse, text } = await request(
			"/api/calendar-events",
			{
				method: "POST",
				body: JSON.stringify({
					title: "",
					date: "2026-05-07",
					kind: "event",
				}),
			},
		);
		expect(invalidEventResponse.statusCode).toBe(400);
		expect(text).toBe("Event title is required");

		const { response: deleteEventResponse } = await request(
			`/api/calendar-events/${event.id}`,
			{ method: "DELETE" },
		);
		expect(deleteEventResponse.statusCode).toBe(204);

		const markdown = "# Note\n\n- libre";
		const { body: note } = await request("/api/dashboard-note", {
			method: "PATCH",
			body: JSON.stringify({ content: markdown }),
		});
		expect(note.content).toBe(markdown);

		const { body: persistedNote } = await request("/api/dashboard-note");
		expect(persistedNote.content).toBe(markdown);
	});
});
