import type {
	CreateAgentInput,
	CreateProjectInput,
	CreateTaskInput,
	UpdateAgentInput,
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
	deleteProject: (projectId: string) =>
		invokeTauri("delete_project", { projectId }).then(() => undefined),
	archiveProjects: (projectIds: string[]) =>
		invokeTauri("archive_projects", { projectIds }).then(() => undefined),
	getTasks: (projectId?: string) =>
		invokeTauri("get_tasks", projectId ? { projectId } : undefined),
	createTask: (input: CreateTaskInput) => invokeTauri("create_task", { input }),
	updateTask: (taskId: string, input: UpdateTaskInput) =>
		invokeTauri("update_task", { taskId, changes: input }),
	deleteTask: (taskId: string) =>
		invokeTauri("delete_task", { taskId }).then(() => undefined),
	getAgents: () => invokeTauri("get_agents"),
	createAgent: (input: CreateAgentInput) =>
		invokeTauri("create_agent", { input }),
	updateAgent: (agentId: string, input: UpdateAgentInput) =>
		invokeTauri("update_agent", { agentId, changes: input }),
	getUserSnapshot: () => invokeTauri("get_user_snapshot"),
	updateUserSnapshot: (input: UpdateUserSnapshotInput) =>
		invokeTauri("update_user_snapshot", { changes: input }),
};
