import {
	createAgentRecord,
	getAgents,
	patchAgent,
} from "../services/agentService.js";
import {
	createCalendarEventRecord,
	deleteCalendarEvent,
	getCalendarEvents,
	patchCalendarEvent,
} from "../services/calendarService.js";
import {
	getDashboardNoteView,
	patchDashboardNote,
} from "../services/dashboardNoteService.js";
import {
	archiveProjects,
	createProject,
	deleteProject,
	getArchivedProjectsView,
	getProjectsView,
	patchProject,
	reorderProjects,
} from "../services/projectService.js";
import {
	createTaskRecord,
	deleteTask,
	getTasks,
	patchTask,
	reorderTasks,
} from "../services/taskService.js";
import {
	getUserSnapshotView,
	patchUserSnapshot,
} from "../services/userSnapshotService.js";
import { readJsonBody, sendJson, sendText } from "../utils/http.js";

function matchProjectPath(pathname) {
	return pathname.match(/^\/api\/projects\/([^/]+)$/);
}

function matchTaskPath(pathname) {
	return pathname.match(/^\/api\/tasks\/([^/]+)$/);
}

function matchAgentPath(pathname) {
	return pathname.match(/^\/api\/agents\/([^/]+)$/);
}

function matchCalendarEventPath(pathname) {
	return pathname.match(/^\/api\/calendar-events\/([^/]+)$/);
}

export async function handleApiRequest(request, response, url) {
	if (request.method === "OPTIONS") {
		sendText(response, 204, "");
		return true;
	}

	if (request.method === "GET" && url.pathname === "/api/projects") {
		sendJson(response, 200, getProjectsView());
		return true;
	}

	if (request.method === "GET" && url.pathname === "/api/projects/archived") {
		sendJson(response, 200, getArchivedProjectsView());
		return true;
	}

	if (request.method === "POST" && url.pathname === "/api/projects") {
		const payload = await readJsonBody(request);
		const project = createProject(payload);
		sendJson(response, 201, project);
		return true;
	}

	if (request.method === "POST" && url.pathname === "/api/projects/archive") {
		const payload = await readJsonBody(request);

		try {
			archiveProjects(payload.projectIds ?? []);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Archive impossible";
			sendText(response, 400, message);
			return true;
		}

		sendText(response, 204, "");
		return true;
	}

	if (request.method === "POST" && url.pathname === "/api/projects/reorder") {
		const payload = await readJsonBody(request);

		try {
			reorderProjects(payload.projectIds ?? []);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Réorganisation impossible";
			sendText(response, 400, message);
			return true;
		}

		sendText(response, 204, "");
		return true;
	}

	const projectMatch = matchProjectPath(url.pathname);
	if (projectMatch && request.method === "PATCH") {
		const project = patchProject(projectMatch[1], await readJsonBody(request));
		if (!project) {
			sendText(response, 404, "Project not found");
			return true;
		}

		sendJson(response, 200, project);
		return true;
	}

	if (projectMatch && request.method === "DELETE") {
		const deleted = deleteProject(projectMatch[1]);
		if (!deleted) {
			sendText(response, 404, "Project not found");
			return true;
		}

		sendText(response, 204, "");
		return true;
	}

	if (request.method === "GET" && url.pathname === "/api/tasks") {
		const projectId = url.searchParams.get("projectId") ?? undefined;
		sendJson(response, 200, getTasks(projectId));
		return true;
	}

	if (request.method === "POST" && url.pathname === "/api/tasks") {
		const task = createTaskRecord(await readJsonBody(request));
		if (!task) {
			sendText(response, 404, "Project not found");
			return true;
		}

		sendJson(response, 201, task);
		return true;
	}

	if (request.method === "POST" && url.pathname === "/api/tasks/reorder") {
		const payload = await readJsonBody(request);

		try {
			reorderTasks(payload.projectId, payload.taskIds ?? []);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Réorganisation impossible";
			sendText(response, 400, message);
			return true;
		}

		sendText(response, 204, "");
		return true;
	}

	const taskMatch = matchTaskPath(url.pathname);
	if (taskMatch && request.method === "PATCH") {
		const task = patchTask(taskMatch[1], await readJsonBody(request));
		if (!task) {
			sendText(response, 404, "Task not found");
			return true;
		}

		sendJson(response, 200, task);
		return true;
	}

	if (taskMatch && request.method === "DELETE") {
		const deleted = deleteTask(taskMatch[1]);
		if (!deleted) {
			sendText(response, 404, "Task not found");
			return true;
		}

		sendText(response, 204, "");
		return true;
	}

	if (request.method === "GET" && url.pathname === "/api/calendar-events") {
		sendJson(response, 200, getCalendarEvents());
		return true;
	}

	if (request.method === "POST" && url.pathname === "/api/calendar-events") {
		try {
			const event = createCalendarEventRecord(await readJsonBody(request));
			sendJson(response, 201, event);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Événement invalide";
			sendText(response, 400, message);
		}
		return true;
	}

	const calendarEventMatch = matchCalendarEventPath(url.pathname);
	if (calendarEventMatch && request.method === "PATCH") {
		try {
			const event = patchCalendarEvent(
				calendarEventMatch[1],
				await readJsonBody(request),
			);
			if (!event) {
				sendText(response, 404, "Calendar event not found");
				return true;
			}

			sendJson(response, 200, event);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Événement invalide";
			sendText(response, 400, message);
		}
		return true;
	}

	if (calendarEventMatch && request.method === "DELETE") {
		const deleted = deleteCalendarEvent(calendarEventMatch[1]);
		if (!deleted) {
			sendText(response, 404, "Calendar event not found");
			return true;
		}

		sendText(response, 204, "");
		return true;
	}

	if (request.method === "GET" && url.pathname === "/api/dashboard-note") {
		sendJson(response, 200, getDashboardNoteView());
		return true;
	}

	if (request.method === "PATCH" && url.pathname === "/api/dashboard-note") {
		sendJson(response, 200, patchDashboardNote(await readJsonBody(request)));
		return true;
	}

	if (request.method === "GET" && url.pathname === "/api/agents") {
		sendJson(response, 200, getAgents());
		return true;
	}

	if (request.method === "POST" && url.pathname === "/api/agents") {
		const agent = createAgentRecord(await readJsonBody(request));
		if (!agent) {
			sendText(response, 404, "Project not found");
			return true;
		}

		sendJson(response, 201, agent);
		return true;
	}

	const agentMatch = matchAgentPath(url.pathname);
	if (agentMatch && request.method === "PATCH") {
		const agent = patchAgent(agentMatch[1], await readJsonBody(request));
		if (!agent) {
			sendText(response, 404, "Agent or project not found");
			return true;
		}

		sendJson(response, 200, agent);
		return true;
	}

	if (request.method === "GET" && url.pathname === "/api/user-snapshot") {
		sendJson(response, 200, getUserSnapshotView());
		return true;
	}

	if (request.method === "PATCH" && url.pathname === "/api/user-snapshot") {
		const snapshot = patchUserSnapshot(await readJsonBody(request));
		if (!snapshot) {
			sendText(response, 404, "Snapshot not found");
			return true;
		}

		sendJson(response, 200, snapshot);
		return true;
	}

	return false;
}
