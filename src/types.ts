export type ProjectStatus =
	| "planned"
	| "in-progress"
	| "review"
	| "blocked"
	| "done";

export type ProjectPriority = "urgent" | "high" | "medium" | "low";

export type AgentStatus = "active" | "idle" | "blocked";

export interface Project {
	id: string;
	name: string;
	client: string;
	stack: string[];
	priority: ProjectPriority;
	progress: number;
	status: ProjectStatus;
	summary: string;
	milestone: string;
	archivedAt: string | null;
}

export type ProjectWithProgress = Project;

export interface CreateProjectInput {
	name: string;
	client: string;
	stack: string[];
	priority: ProjectPriority;
	status: ProjectStatus;
	summary: string;
	milestone: string;
}

export interface UpdateProjectInput {
	name?: string;
	client?: string;
	stack?: string[];
	priority?: ProjectPriority;
	status?: ProjectStatus;
	summary?: string;
	milestone?: string;
}

export interface TaskItem {
	id: string;
	title: string;
	done: boolean;
	projectId: string;
	urgency: "today" | "week" | "later";
}

export interface CreateTaskInput {
	title: string;
	projectId: string;
	urgency?: TaskItem["urgency"];
}

export interface UpdateTaskInput {
	title?: string;
	done?: boolean;
	projectId?: string;
	urgency?: TaskItem["urgency"];
}

export interface LocalAgent {
	id: string;
	name: string;
	role: string;
	status: AgentStatus;
	currentTask: string;
	projectId: string;
	runtime: string;
}

export interface CreateAgentInput {
	name: string;
	role: string;
	status: AgentStatus;
	currentTask: string;
	projectId: string;
}

export interface UpdateAgentInput {
	role?: string;
	status?: AgentStatus;
	currentTask?: string;
	projectId?: string;
	runtime?: string;
}

export interface UserSnapshot {
	developer: string;
	activeProjects: number;
	completedTasks: number;
	remainingTasks: number;
	nextDeadline: string;
	completionRate: number;
	streakCount: number;
}

export interface UpdateUserSnapshotInput {
	developer?: string;
	nextDeadline?: string;
}
