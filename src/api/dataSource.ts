import type {
	CreateAgentInput,
	CreateProjectInput,
	CreateTaskInput,
	LocalAgent,
	ProjectWithProgress,
	TaskItem,
	UpdateAgentInput,
	UpdateProjectInput,
	UpdateTaskInput,
	UpdateUserSnapshotInput,
	UserSnapshot,
} from "../types";

export interface MissionControlDataSource {
	mode: "http" | "tauri";
	label: string;
	getProjects: () => Promise<ProjectWithProgress[]>;
	getArchivedProjects: () => Promise<ProjectWithProgress[]>;
	createProject: (input: CreateProjectInput) => Promise<ProjectWithProgress>;
	updateProject: (
		projectId: string,
		input: UpdateProjectInput,
	) => Promise<ProjectWithProgress>;
	deleteProject: (projectId: string) => Promise<void>;
	archiveProjects: (projectIds: string[]) => Promise<void>;
	getTasks: (projectId?: string) => Promise<TaskItem[]>;
	createTask: (input: CreateTaskInput) => Promise<TaskItem>;
	updateTask: (taskId: string, input: UpdateTaskInput) => Promise<TaskItem>;
	deleteTask: (taskId: string) => Promise<void>;
	getAgents: () => Promise<LocalAgent[]>;
	createAgent: (input: CreateAgentInput) => Promise<LocalAgent>;
	updateAgent: (
		agentId: string,
		input: UpdateAgentInput,
	) => Promise<LocalAgent>;
	getUserSnapshot: () => Promise<UserSnapshot>;
	updateUserSnapshot: (input: UpdateUserSnapshotInput) => Promise<UserSnapshot>;
}
