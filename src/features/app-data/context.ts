import { createContext } from "react";
import type {
	CreateAgentInput,
	CreateProjectInput,
	LocalAgent,
	ProjectWithProgress,
	TaskItem,
	UpdateAgentInput,
	UpdateProjectInput,
	UpdateUserSnapshotInput,
	UserSnapshot,
} from "../../types";

export interface RewardNotification {
	id: string;
	message: string;
	type: "medals" | "streak";
}

export interface AppDataContextValue {
	agents: LocalAgent[];
	archivedProjects: ProjectWithProgress[];
	dataSourceLabel: string;
	dataSourceMode: "http" | "tauri";
	error: string | null;
	isLoading: boolean;
	isMutating: boolean;
	projects: ProjectWithProgress[];
	reload: () => Promise<void>;
	rewardNotification: RewardNotification | null;
	snapshot: UserSnapshot;
	tasks: TaskItem[];
	dismissRewardNotification: () => void;
	createProject: (input: CreateProjectInput) => Promise<ProjectWithProgress>;
	updateProject: (
		projectId: string,
		input: UpdateProjectInput,
	) => Promise<ProjectWithProgress>;
	reorderProjects: (projectIds: string[]) => Promise<void>;
	deleteProject: (projectId: string) => Promise<void>;
	archiveProjects: (projectIds: string[]) => Promise<void>;
	createTask: (input: {
		title: string;
		projectId: string;
		urgency?: TaskItem["urgency"];
	}) => Promise<TaskItem>;
	updateTask: (
		taskId: string,
		input: Partial<Pick<TaskItem, "title" | "done" | "projectId" | "urgency">>,
	) => Promise<TaskItem>;
	reorderTasks: (projectId: string, taskIds: string[]) => Promise<void>;
	deleteTask: (taskId: string) => Promise<void>;
	createAgent: (input: CreateAgentInput) => Promise<LocalAgent>;
	updateAgent: (
		agentId: string,
		input: UpdateAgentInput,
	) => Promise<LocalAgent>;
	updateUserSnapshot: (input: UpdateUserSnapshotInput) => Promise<UserSnapshot>;
}

export const emptySnapshot: UserSnapshot = {
	developer: "Developer",
	activeProjects: 0,
	completedTasks: 0,
	remainingTasks: 0,
	nextDeadline: "No deadline",
	completionRate: 0,
	streakCount: 0,
	streakLastRewardedAt: null,
	medalsRewardCount: 0,
};

export const AppDataContext = createContext<AppDataContextValue | null>(null);
