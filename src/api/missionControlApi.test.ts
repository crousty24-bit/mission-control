import { afterEach, describe, expect, it, vi } from "vitest";
import { httpDataSource } from "./missionControlApi";

afterEach(() => {
	vi.unstubAllGlobals();
});

function mockJsonResponse(payload: unknown, status = 200) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

describe("httpDataSource", () => {
	it("uses expected project and task endpoints", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(mockJsonResponse([]))
			.mockResolvedValueOnce(mockJsonResponse({ id: "project-1" }, 201))
			.mockResolvedValueOnce(new Response(null, { status: 204 }))
			.mockResolvedValueOnce(mockJsonResponse([]))
			.mockResolvedValueOnce(mockJsonResponse({ id: "task-1" }, 201))
			.mockResolvedValueOnce(new Response(null, { status: 204 }));
		vi.stubGlobal("fetch", fetchMock);

		await httpDataSource.getProjects();
		await httpDataSource.createProject({
			name: "Projet",
			client: "Client",
			stack: ["React"],
			priority: "high",
			status: "planned",
			summary: "Résumé",
			milestone: "demain",
		});
		await httpDataSource.reorderProjects(["project-1"]);
		await httpDataSource.getTasks("project-1");
		await httpDataSource.createTask({
			title: "Tâche",
			projectId: "project-1",
			urgency: "today",
		});
		await httpDataSource.deleteTask("task-1");

		expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
			"/api/projects",
			"/api/projects",
			"/api/projects/reorder",
			"/api/tasks?projectId=project-1",
			"/api/tasks",
			"/api/tasks/task-1",
		]);
		expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "POST" });
		expect(JSON.parse(fetchMock.mock.calls[2][1].body as string)).toEqual({
			projectIds: ["project-1"],
		});
		expect(fetchMock.mock.calls[5][1]).toMatchObject({ method: "DELETE" });
	});

	it("uses expected dashboard feature endpoints", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(mockJsonResponse([]))
			.mockResolvedValueOnce(mockJsonResponse({ id: "event-1" }, 201))
			.mockResolvedValueOnce(mockJsonResponse({ id: "event-1" }))
			.mockResolvedValueOnce(new Response(null, { status: 204 }))
			.mockResolvedValueOnce(
				mockJsonResponse({ id: "dashboard-note", content: "" }),
			)
			.mockResolvedValueOnce(
				mockJsonResponse({ id: "dashboard-note", content: "# Note" }),
			)
			.mockResolvedValueOnce(mockJsonResponse({ developer: "Allen" }));
		vi.stubGlobal("fetch", fetchMock);

		await httpDataSource.getCalendarEvents();
		await httpDataSource.createCalendarEvent({
			title: "Démo",
			date: "2026-05-07",
			time: "18:00",
			kind: "event",
			notes: "Note",
		});
		await httpDataSource.updateCalendarEvent("event-1", { title: "Démo 2" });
		await httpDataSource.deleteCalendarEvent("event-1");
		await httpDataSource.getDashboardNote();
		await httpDataSource.updateDashboardNote({ content: "# Note" });
		await httpDataSource.getUserSnapshot();

		expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
			"/api/calendar-events",
			"/api/calendar-events",
			"/api/calendar-events/event-1",
			"/api/calendar-events/event-1",
			"/api/dashboard-note",
			"/api/dashboard-note",
			"/api/user-snapshot",
		]);
		expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: "PATCH" });
		expect(fetchMock.mock.calls[3][1]).toMatchObject({ method: "DELETE" });
		expect(fetchMock.mock.calls[5][1]).toMatchObject({ method: "PATCH" });
	});
});
