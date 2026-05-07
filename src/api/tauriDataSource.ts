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
import { invokeTauri } from "./tauriRuntime";

export const tauriDataSource: MissionControlDataSource = {
	mode: "tauri",
	label: "Mission Control Desktop",
	getProjects: () => invokeTauri("get_projects"),
	getArchivedProjects: () => invokeTauri("get_archived_projects"),
	createProject: (input: CreateProjectInput) =>
		invokeTauri("create_project", { input }),
	updateProject: (projectId: string, input: UpdateProjectInput) =>
		invokeTauri("update_project", { projectId, changes: input }),
	reorderProjects: (projectIds: string[]) =>
		invokeTauri("reorder_projects", { projectIds }).then(() => undefined),
	deleteProject: (projectId: string) =>
		invokeTauri("delete_project", { projectId }).then(() => undefined),
	archiveProjects: (projectIds: string[]) =>
		invokeTauri("archive_projects", { projectIds }).then(() => undefined),
	getTasks: (projectId?: string) =>
		invokeTauri("get_tasks", projectId ? { projectId } : undefined),
	createTask: (input: CreateTaskInput) => invokeTauri("create_task", { input }),
	updateTask: (taskId: string, input: UpdateTaskInput) =>
		invokeTauri("update_task", { taskId, changes: input }),
	reorderTasks: (projectId: string, taskIds: string[]) =>
		invokeTauri("reorder_tasks", { projectId, taskIds }).then(() => undefined),
	deleteTask: (taskId: string) =>
		invokeTauri("delete_task", { taskId }).then(() => undefined),
	getCalendarEvents: () => invokeTauri("get_calendar_events"),
	createCalendarEvent: (input: CreateCalendarEventInput) =>
		invokeTauri("create_calendar_event", { input }),
	updateCalendarEvent: (eventId: string, input: UpdateCalendarEventInput) =>
		invokeTauri("update_calendar_event", { eventId, changes: input }),
	deleteCalendarEvent: (eventId: string) =>
		invokeTauri("delete_calendar_event", { eventId }).then(() => undefined),
	getDashboardNote: () => invokeTauri("get_dashboard_note"),
	updateDashboardNote: (input: UpdateDashboardNoteInput) =>
		invokeTauri("update_dashboard_note", { changes: input }),
	getAgents: () => invokeTauri("get_agents"),
	createAgent: (input: CreateAgentInput) =>
		invokeTauri("create_agent", { input }),
	updateAgent: (agentId: string, input: UpdateAgentInput) =>
		invokeTauri("update_agent", { agentId, changes: input }),
	getUserSnapshot: () => invokeTauri("get_user_snapshot"),
	updateUserSnapshot: (input: UpdateUserSnapshotInput) =>
		invokeTauri("update_user_snapshot", { changes: input }),
};
