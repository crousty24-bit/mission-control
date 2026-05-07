import type {
	CreateAgentInput,
	CreateCalendarEventInput,
	CreateProjectInput,
	CreateTaskInput,
	UpdateAgentInput,
	UpdateCalendarEventInput,
	UpdateDashboardNoteInput,
	UpdateProjectInput,
	UpdateTaskInput,
	UpdateUserSnapshotInput,
} from "../types";
import type { MissionControlDataSource } from "./dataSource";
import { request } from "./http";

function getTasksUrl(projectId?: string) {
	return projectId ? `/api/tasks?projectId=${projectId}` : "/api/tasks";
}

export const httpDataSource: MissionControlDataSource = {
	mode: "http",
	label: "Mission Control API locale",
	getProjects: () => request("/api/projects"),
	getArchivedProjects: () => request("/api/projects/archived"),
	createProject: (input: CreateProjectInput) =>
		request("/api/projects", {
			method: "POST",
			body: JSON.stringify(input),
		}),
	updateProject: (projectId: string, input: UpdateProjectInput) =>
		request(`/api/projects/${projectId}`, {
			method: "PATCH",
			body: JSON.stringify(input),
		}),
	reorderProjects: (projectIds: string[]) =>
		request("/api/projects/reorder", {
			method: "POST",
			body: JSON.stringify({ projectIds }),
		}).then(() => undefined),
	deleteProject: (projectId: string) =>
		request(`/api/projects/${projectId}`, {
			method: "DELETE",
		}).then(() => undefined),
	archiveProjects: (projectIds: string[]) =>
		request("/api/projects/archive", {
			method: "POST",
			body: JSON.stringify({ projectIds }),
		}).then(() => undefined),
	getTasks: (projectId?: string) => request(getTasksUrl(projectId)),
	createTask: (input: CreateTaskInput) =>
		request("/api/tasks", {
			method: "POST",
			body: JSON.stringify(input),
		}),
	updateTask: (taskId: string, input: UpdateTaskInput) =>
		request(`/api/tasks/${taskId}`, {
			method: "PATCH",
			body: JSON.stringify(input),
		}),
	reorderTasks: (projectId: string, taskIds: string[]) =>
		request("/api/tasks/reorder", {
			method: "POST",
			body: JSON.stringify({ projectId, taskIds }),
		}).then(() => undefined),
	deleteTask: (taskId: string) =>
		request(`/api/tasks/${taskId}`, {
			method: "DELETE",
		}).then(() => undefined),
	getCalendarEvents: () => request("/api/calendar-events"),
	createCalendarEvent: (input: CreateCalendarEventInput) =>
		request("/api/calendar-events", {
			method: "POST",
			body: JSON.stringify(input),
		}),
	updateCalendarEvent: (eventId: string, input: UpdateCalendarEventInput) =>
		request(`/api/calendar-events/${eventId}`, {
			method: "PATCH",
			body: JSON.stringify(input),
		}),
	deleteCalendarEvent: (eventId: string) =>
		request(`/api/calendar-events/${eventId}`, {
			method: "DELETE",
		}).then(() => undefined),
	getDashboardNote: () => request("/api/dashboard-note"),
	updateDashboardNote: (input: UpdateDashboardNoteInput) =>
		request("/api/dashboard-note", {
			method: "PATCH",
			body: JSON.stringify(input),
		}),
	getAgents: () => request("/api/agents"),
	createAgent: (input: CreateAgentInput) =>
		request("/api/agents", {
			method: "POST",
			body: JSON.stringify(input),
		}),
	updateAgent: (agentId: string, input: UpdateAgentInput) =>
		request(`/api/agents/${agentId}`, {
			method: "PATCH",
			body: JSON.stringify(input),
		}),
	getUserSnapshot: () => request("/api/user-snapshot"),
	updateUserSnapshot: (input: UpdateUserSnapshotInput) =>
		request("/api/user-snapshot", {
			method: "PATCH",
			body: JSON.stringify(input),
		}),
};
