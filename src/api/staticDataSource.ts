import type {
	CreateAgentInput,
	CreateCalendarEventInput,
	CreateProjectInput,
	CreateTaskInput,
	DashboardNote,
	LocalAgent,
	ProjectPriority,
	ProjectStatus,
	ProjectWithProgress,
	TaskItem,
	UpdateAgentInput,
	UpdateCalendarEventInput,
	UpdateDashboardNoteInput,
	UpdateProjectInput,
	UpdateTaskInput,
	UpdateUserSnapshotInput,
	UserSnapshot,
} from "../types";
import type { MissionControlDataSource } from "./dataSource";
import {
	staticSeedAgents,
	staticSeedCalendarEvents,
	staticSeedDashboardNote,
	staticSeedProjects,
	staticSeedSnapshot,
	staticSeedTasks,
} from "./staticSeed";

const storageKey = "mission-control-static-demo:v1";

interface StaticStore {
	agents: LocalAgent[];
	calendarEvents: StaticCalendarEvent[];
	dashboardNote: DashboardNote;
	projects: StaticProject[];
	snapshot: StaticSnapshot;
	tasks: TaskItem[];
}

interface StaticProject extends ProjectWithProgress {
	createdAt: string;
	updatedAt: string;
}

interface StaticCalendarEvent {
	id: string;
	title: string;
	date: string;
	time: string | null;
	kind: "event" | "reminder";
	notes: string;
	createdAt: string;
	updatedAt: string;
}

interface StaticSnapshot {
	developer: string;
	nextDeadline: string;
	streakCount: number;
	streakLastRewardedAt: string | null;
	streakCycleStartedAt: string | null;
}

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function now() {
	return new Date().toISOString();
}

function createId(prefix: string) {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return `${prefix}-${crypto.randomUUID()}`;
	}

	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getProjectProgress(projectId: string, tasks: TaskItem[]) {
	const projectTasks = tasks.filter((task) => task.projectId === projectId);
	if (projectTasks.length === 0) {
		return 0;
	}

	const doneCount = projectTasks.filter((task) => task.done).length;
	return Math.round((doneCount / projectTasks.length) * 100);
}

function withProjectProgress(
	project: StaticProject,
	tasks: TaskItem[],
): ProjectWithProgress {
	const progress = getProjectProgress(project.id, tasks);
	return {
		id: project.id,
		name: project.name,
		client: project.client,
		stack: project.stack,
		priority: project.priority,
		progress,
		status: project.status,
		summary: project.summary,
		milestone: project.milestone,
		archivedAt: project.archivedAt,
	};
}

function getInitialStore(): StaticStore {
	const timestamp = now();
	return {
		agents: clone(staticSeedAgents),
		calendarEvents: clone(staticSeedCalendarEvents),
		dashboardNote: clone(staticSeedDashboardNote),
		projects: staticSeedProjects.map((project) => ({
			...clone(project),
			createdAt: timestamp,
			updatedAt: timestamp,
		})),
		snapshot: {
			developer: staticSeedSnapshot.developer,
			nextDeadline: staticSeedSnapshot.nextDeadline,
			streakCount: staticSeedSnapshot.streakCount,
			streakLastRewardedAt: staticSeedSnapshot.streakLastRewardedAt,
			streakCycleStartedAt: null,
		},
		tasks: clone(staticSeedTasks),
	};
}

function isStore(value: unknown): value is StaticStore {
	if (!value || typeof value !== "object") {
		return false;
	}

	const store = value as Partial<StaticStore>;
	return (
		Array.isArray(store.projects) &&
		Array.isArray(store.tasks) &&
		Array.isArray(store.agents) &&
		Array.isArray(store.calendarEvents) &&
		typeof store.dashboardNote === "object" &&
		typeof store.snapshot === "object"
	);
}

function readStore() {
	const item = localStorage.getItem(storageKey);
	if (!item) {
		const initialStore = getInitialStore();
		writeStore(initialStore);
		return initialStore;
	}

	try {
		const parsed = JSON.parse(item) as unknown;
		if (isStore(parsed)) {
			return parsed;
		}
	} catch {
		// Invalid demo data should never block the public demo.
	}

	const initialStore = getInitialStore();
	writeStore(initialStore);
	return initialStore;
}

function writeStore(store: StaticStore) {
	localStorage.setItem(storageKey, JSON.stringify(store));
}

function updateStore<T>(callback: (store: StaticStore) => T) {
	const store = readStore();
	const result = callback(store);
	writeStore(store);
	return result;
}

function getActiveProjects(store: StaticStore) {
	return store.projects.filter((project) => project.archivedAt === null);
}

function getArchivedProjects(store: StaticStore) {
	return store.projects.filter((project) => project.archivedAt !== null);
}

function getActiveTasks(store: StaticStore) {
	const activeProjectIds = new Set(
		getActiveProjects(store).map((project) => project.id),
	);
	return store.tasks.filter((task) => activeProjectIds.has(task.projectId));
}

function getCompletionRate(store: StaticStore) {
	const tasks = getActiveTasks(store);
	if (tasks.length === 0) {
		return 0;
	}

	return Math.round(
		(tasks.filter((task) => task.done).length / tasks.length) * 100,
	);
}

function getUserSnapshotView(store: StaticStore): UserSnapshot {
	const tasks = getActiveTasks(store);
	return {
		developer: store.snapshot.developer,
		activeProjects: getActiveProjects(store).length,
		completedTasks: tasks.filter((task) => task.done).length,
		remainingTasks: tasks.filter((task) => !task.done).length,
		nextDeadline: store.snapshot.nextDeadline,
		completionRate: getCompletionRate(store),
		streakCount: store.snapshot.streakCount,
		streakLastRewardedAt: store.snapshot.streakLastRewardedAt,
		medalsRewardCount: getArchivedProjects(store).length,
	};
}

function normalizeProjectInput(input: CreateProjectInput): StaticProject {
	const timestamp = now();
	return {
		id: createId("project"),
		name: input.name.trim().slice(0, 20),
		client: input.client.trim() || "Projet personnel",
		stack: input.stack,
		priority: input.priority,
		progress: 0,
		status: input.status,
		summary:
			input.summary.trim().slice(0, 96) || "Aucun résumé pour le moment.",
		milestone: input.milestone.trim() || "Sans échéance définie",
		archivedAt: null,
		createdAt: timestamp,
		updatedAt: timestamp,
	};
}

function syncProjectStatus(store: StaticStore, projectId: string) {
	const project = store.projects.find((item) => item.id === projectId);
	if (!project) {
		return;
	}

	const tasks = store.tasks.filter((task) => task.projectId === projectId);
	if (tasks.length === 0) {
		return;
	}

	const allDone = tasks.every((task) => task.done);
	if (allDone && project.status !== "done") {
		project.status = "done";
		rewardDailyStreak(store);
	} else if (!allDone && project.status === "done") {
		project.status = "in-progress";
	}

	project.updatedAt = now();
}

function isSameLocalDay(firstDate: Date, secondDate: Date) {
	return (
		firstDate.getFullYear() === secondDate.getFullYear() &&
		firstDate.getMonth() === secondDate.getMonth() &&
		firstDate.getDate() === secondDate.getDate()
	);
}

function rewardDailyStreak(store: StaticStore) {
	const currentDate = new Date();
	const lastRewardedAt = store.snapshot.streakLastRewardedAt
		? new Date(store.snapshot.streakLastRewardedAt)
		: null;
	if (
		lastRewardedAt &&
		!Number.isNaN(lastRewardedAt.getTime()) &&
		isSameLocalDay(lastRewardedAt, currentDate)
	) {
		return;
	}

	const timestamp = currentDate.toISOString();
	store.snapshot.streakCount += 1;
	store.snapshot.streakLastRewardedAt = timestamp;
	store.snapshot.streakCycleStartedAt ??= timestamp;
}

function reorderByIds<T extends { id: string }>(items: T[], ids: string[]) {
	const uniqueIds = [...new Set(ids)];
	if (uniqueIds.length !== items.length) {
		throw new Error("Reorder payload is incomplete");
	}

	const itemById = new Map(items.map((item) => [item.id, item]));
	if (uniqueIds.some((id) => !itemById.has(id))) {
		throw new Error("Reorder payload is invalid");
	}

	return uniqueIds.map((id) => itemById.get(id) as T);
}

export const staticDataSource: MissionControlDataSource = {
	mode: "static",
	label: "Mission Control Demo statique",
	getProjects: async () => {
		const store = readStore();
		return getActiveProjects(store).map((project) =>
			withProjectProgress(project, store.tasks),
		);
	},
	getArchivedProjects: async () => {
		const store = readStore();
		return getArchivedProjects(store).map((project) =>
			withProjectProgress(project, store.tasks),
		);
	},
	createProject: async (input: CreateProjectInput) =>
		updateStore((store) => {
			const project = normalizeProjectInput(input);
			store.projects.push(project);
			return withProjectProgress(project, store.tasks);
		}),
	updateProject: async (projectId: string, input: UpdateProjectInput) =>
		updateStore((store) => {
			const project = store.projects.find((item) => item.id === projectId);
			if (!project) {
				throw new Error("Project not found");
			}

			const previousStatus = project.status;
			project.name =
				input.name === undefined
					? project.name
					: input.name.trim().slice(0, 20);
			project.client =
				input.client === undefined
					? project.client
					: input.client.trim() || "Projet personnel";
			project.stack = input.stack ?? project.stack;
			project.priority = (input.priority ??
				project.priority) as ProjectPriority;
			project.status = (input.status ?? project.status) as ProjectStatus;
			project.summary =
				input.summary === undefined
					? project.summary
					: input.summary.trim().slice(0, 96) || "Aucun résumé pour le moment.";
			project.milestone =
				input.milestone === undefined
					? project.milestone
					: input.milestone.trim() || "Sans échéance définie";
			project.updatedAt = now();
			if (previousStatus !== "done" && project.status === "done") {
				rewardDailyStreak(store);
			}
			return withProjectProgress(project, store.tasks);
		}),
	reorderProjects: async (projectIds: string[]) => {
		updateStore((store) => {
			const activeProjects = getActiveProjects(store);
			const archivedProjects = getArchivedProjects(store);
			store.projects = [
				...reorderByIds(activeProjects, projectIds),
				...archivedProjects,
			];
		});
	},
	deleteProject: async (projectId: string) => {
		updateStore((store) => {
			store.projects = store.projects.filter(
				(project) => project.id !== projectId,
			);
			store.tasks = store.tasks.filter((task) => task.projectId !== projectId);
			store.agents = store.agents.filter(
				(agent) => agent.projectId !== projectId,
			);
		});
	},
	archiveProjects: async (projectIds: string[]) => {
		updateStore((store) => {
			const uniqueIds = [...new Set(projectIds)];
			if (uniqueIds.length === 0) {
				throw new Error("No projects selected for archive");
			}

			const projects = store.projects.filter((project) =>
				uniqueIds.includes(project.id),
			);
			if (projects.length !== uniqueIds.length) {
				throw new Error("Project not found");
			}
			if (
				projects.some(
					(project) => project.archivedAt !== null || project.status !== "done",
				)
			) {
				throw new Error("Only done projects can be archived");
			}

			const archivedAt = now();
			for (const project of projects) {
				project.archivedAt = archivedAt;
				project.updatedAt = archivedAt;
			}
		});
	},
	getTasks: async (projectId?: string) => {
		const store = readStore();
		return projectId
			? store.tasks.filter((task) => task.projectId === projectId)
			: store.tasks;
	},
	createTask: async (input: CreateTaskInput) =>
		updateStore((store) => {
			if (!store.projects.some((project) => project.id === input.projectId)) {
				throw new Error("Project not found");
			}

			const task: TaskItem = {
				id: createId("task"),
				title: input.title,
				done: false,
				projectId: input.projectId,
				urgency: input.urgency ?? "today",
			};
			store.tasks.push(task);
			syncProjectStatus(store, task.projectId);
			return task;
		}),
	updateTask: async (taskId: string, input: UpdateTaskInput) =>
		updateStore((store) => {
			const task = store.tasks.find((item) => item.id === taskId);
			if (!task) {
				throw new Error("Task not found");
			}
			if (
				input.projectId &&
				!store.projects.some((project) => project.id === input.projectId)
			) {
				throw new Error("Project not found");
			}

			const previousProjectId = task.projectId;
			const wasDone = task.done;
			task.title = input.title ?? task.title;
			task.done = input.done ?? task.done;
			task.projectId = input.projectId ?? task.projectId;
			task.urgency = input.urgency ?? task.urgency;
			if (previousProjectId !== task.projectId) {
				syncProjectStatus(store, previousProjectId);
			}
			syncProjectStatus(store, task.projectId);
			if (!wasDone && task.done) {
				rewardDailyStreak(store);
			}
			return task;
		}),
	reorderTasks: async (projectId: string, taskIds: string[]) => {
		updateStore((store) => {
			if (!store.projects.some((project) => project.id === projectId)) {
				throw new Error("Project not found");
			}

			const projectTasks = store.tasks.filter(
				(task) => task.projectId === projectId,
			);
			const otherTasks = store.tasks.filter(
				(task) => task.projectId !== projectId,
			);
			store.tasks = [...otherTasks, ...reorderByIds(projectTasks, taskIds)];
		});
	},
	deleteTask: async (taskId: string) => {
		updateStore((store) => {
			const task = store.tasks.find((item) => item.id === taskId);
			if (!task) {
				return;
			}

			store.tasks = store.tasks.filter((item) => item.id !== taskId);
			syncProjectStatus(store, task.projectId);
		});
	},
	getCalendarEvents: async () => readStore().calendarEvents,
	createCalendarEvent: async (input: CreateCalendarEventInput) =>
		updateStore((store) => {
			const timestamp = now();
			const event: StaticCalendarEvent = {
				id: createId("event"),
				title: input.title.trim(),
				date: input.date,
				time: input.time || null,
				kind: input.kind,
				notes: input.notes?.trim() ?? "",
				createdAt: timestamp,
				updatedAt: timestamp,
			};
			store.calendarEvents.push(event);
			return event;
		}),
	updateCalendarEvent: async (
		eventId: string,
		input: UpdateCalendarEventInput,
	) =>
		updateStore((store) => {
			const event = store.calendarEvents.find((item) => item.id === eventId);
			if (!event) {
				throw new Error("Event not found");
			}

			event.title =
				input.title === undefined ? event.title : input.title.trim();
			event.date = input.date ?? event.date;
			event.time = input.time === undefined ? event.time : input.time || null;
			event.kind = input.kind ?? event.kind;
			event.notes =
				input.notes === undefined ? event.notes : input.notes.trim();
			event.updatedAt = now();
			return event;
		}),
	deleteCalendarEvent: async (eventId: string) => {
		updateStore((store) => {
			store.calendarEvents = store.calendarEvents.filter(
				(event) => event.id !== eventId,
			);
		});
	},
	getDashboardNote: async () => readStore().dashboardNote,
	updateDashboardNote: async (input: UpdateDashboardNoteInput) =>
		updateStore((store) => {
			store.dashboardNote = {
				id: "dashboard-note",
				content: input.content,
				updatedAt: now(),
			};
			return store.dashboardNote;
		}),
	getAgents: async () => readStore().agents,
	createAgent: async (input: CreateAgentInput) =>
		updateStore((store) => {
			const agent: LocalAgent = {
				id: createId("agent"),
				name: input.name,
				role: input.role,
				status: input.status,
				currentTask: input.currentTask,
				projectId: input.projectId,
				runtime: "00h 00",
			};
			store.agents.push(agent);
			return agent;
		}),
	updateAgent: async (agentId: string, input: UpdateAgentInput) =>
		updateStore((store) => {
			const agent = store.agents.find((item) => item.id === agentId);
			if (!agent) {
				throw new Error("Agent not found");
			}

			agent.role = input.role ?? agent.role;
			agent.status = input.status ?? agent.status;
			agent.currentTask = input.currentTask ?? agent.currentTask;
			agent.projectId = input.projectId ?? agent.projectId;
			agent.runtime = input.runtime ?? agent.runtime;
			return agent;
		}),
	getUserSnapshot: async () => getUserSnapshotView(readStore()),
	updateUserSnapshot: async (input: UpdateUserSnapshotInput) =>
		updateStore((store) => {
			store.snapshot.developer = input.developer ?? store.snapshot.developer;
			store.snapshot.nextDeadline =
				input.nextDeadline ?? store.snapshot.nextDeadline;
			return getUserSnapshotView(store);
		}),
};
