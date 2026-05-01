import {
	type PropsWithChildren,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { createMissionControlDataSource } from "../../api/createDataSource";
import type {
	LocalAgent,
	ProjectWithProgress,
	TaskItem,
	UserSnapshot,
} from "../../types";
import {
	AppDataContext,
	type AppDataContextValue,
	emptySnapshot,
	type RewardNotification,
} from "./context";

interface AppDataPayload {
	agents: LocalAgent[];
	archivedProjects: ProjectWithProgress[];
	projects: ProjectWithProgress[];
	snapshot: UserSnapshot;
	tasks: TaskItem[];
}

function createRewardNotifications(
	previousSnapshot: UserSnapshot | null,
	nextSnapshot: UserSnapshot,
): RewardNotification[] {
	if (!previousSnapshot) {
		return [];
	}

	const notifications: RewardNotification[] = [];
	if (
		nextSnapshot.streakLastRewardedAt &&
		nextSnapshot.streakLastRewardedAt !== previousSnapshot.streakLastRewardedAt
	) {
		notifications.push({
			id: `streak-${nextSnapshot.streakLastRewardedAt}`,
			type: "streak",
			message: `Bravo ! Tu totalises +${nextSnapshot.streakCount} jours de streak consécutifs.`,
		});
	}

	const medalsRewardDelta =
		nextSnapshot.medalsRewardCount - previousSnapshot.medalsRewardCount;
	if (medalsRewardDelta === 1) {
		notifications.push({
			id: `medals-${nextSnapshot.medalsRewardCount}-${Date.now()}`,
			type: "medals",
			message: "Bravo ! Tu as terminé un projet, continue comme ça.",
		});
	} else if (medalsRewardDelta > 1) {
		notifications.push({
			id: `medals-${nextSnapshot.medalsRewardCount}-${Date.now()}`,
			type: "medals",
			message: `Bravo ! Tu as terminé ${medalsRewardDelta} projets, continue comme ça.`,
		});
	}

	return notifications;
}

export function AppDataProvider({ children }: PropsWithChildren) {
	const dataSource = useMemo(() => createMissionControlDataSource(), []);
	const [projects, setProjects] = useState<ProjectWithProgress[]>([]);
	const [archivedProjects, setArchivedProjects] = useState<
		ProjectWithProgress[]
	>([]);
	const [tasks, setTasks] = useState<TaskItem[]>([]);
	const [agents, setAgents] = useState<LocalAgent[]>([]);
	const [snapshot, setSnapshot] = useState<UserSnapshot | null>(null);
	const [rewardNotifications, setRewardNotifications] = useState<
		RewardNotification[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isMutating, setIsMutating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reload = useCallback(async (): Promise<AppDataPayload> => {
		setError(null);

		const [
			projectsData,
			archivedProjectsData,
			tasksData,
			agentsData,
			snapshotData,
		] = await Promise.all([
			dataSource.getProjects(),
			dataSource.getArchivedProjects(),
			dataSource.getTasks(),
			dataSource.getAgents(),
			dataSource.getUserSnapshot(),
		]);

		setProjects(projectsData);
		setArchivedProjects(archivedProjectsData);
		setTasks(tasksData);
		setAgents(agentsData);
		setSnapshot(snapshotData);
		return {
			agents: agentsData,
			archivedProjects: archivedProjectsData,
			projects: projectsData,
			snapshot: snapshotData,
			tasks: tasksData,
		};
	}, [dataSource]);

	const getLoadErrorMessage = useCallback(() => {
		if (dataSource.mode === "tauri") {
			return "Desktop data source failed. Vérifie que Mission Control Desktop est lancé correctement.";
		}

		return "Request failed. Vérifie que l'API locale Mission Control est lancée.";
	}, [dataSource]);

	useEffect(() => {
		let isMounted = true;

		setIsLoading(true);
		reload()
			.catch((reason: unknown) => {
				if (!isMounted) {
					return;
				}

				const message =
					reason instanceof Error ? reason.message : "Chargement impossible";
				setError(getLoadErrorMessage());
				console.error(`${dataSource.label} load error:`, message);
			})
			.finally(() => {
				if (isMounted) {
					setIsLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [dataSource, getLoadErrorMessage, reload]);

	const runMutation = useCallback(
		async <T,>(callback: () => Promise<T>) => {
			setIsMutating(true);
			setError(null);
			const previousSnapshot = snapshot;

			try {
				const result = await callback();
				const nextData = await reload();
				const notifications = createRewardNotifications(
					previousSnapshot,
					nextData.snapshot,
				);
				if (notifications.length > 0) {
					setRewardNotifications((current) => [...current, ...notifications]);
				}
				return result;
			} catch (reason) {
				const message =
					reason instanceof Error ? reason.message : "Mutation impossible";
				setError(getLoadErrorMessage());
				console.error(`${dataSource.label} mutation error:`, message);
				throw reason;
			} finally {
				setIsMutating(false);
			}
		},
		[dataSource, getLoadErrorMessage, reload, snapshot],
	);

	const dismissRewardNotification = useCallback(() => {
		setRewardNotifications((current) => current.slice(1));
	}, []);

	const value = useMemo<AppDataContextValue>(
		() => ({
			agents,
			archivedProjects,
			dataSourceLabel: dataSource.label,
			dataSourceMode: dataSource.mode,
			error,
			isLoading,
			isMutating,
			projects,
			reload: () => reload().then(() => undefined),
			rewardNotification: rewardNotifications[0] ?? null,
			snapshot: snapshot ?? emptySnapshot,
			tasks,
			dismissRewardNotification,
			createProject: (input) =>
				runMutation(() => dataSource.createProject(input)),
			updateProject: (projectId, input) =>
				runMutation(() => dataSource.updateProject(projectId, input)),
			reorderProjects: (projectIds) =>
				runMutation(() => dataSource.reorderProjects(projectIds)),
			deleteProject: (projectId) =>
				runMutation(() => dataSource.deleteProject(projectId)),
			archiveProjects: (projectIds) =>
				runMutation(() => dataSource.archiveProjects(projectIds)),
			createTask: (input) => runMutation(() => dataSource.createTask(input)),
			updateTask: (taskId, input) =>
				runMutation(() => dataSource.updateTask(taskId, input)),
			reorderTasks: (projectId, taskIds) =>
				runMutation(() => dataSource.reorderTasks(projectId, taskIds)),
			deleteTask: (taskId) => runMutation(() => dataSource.deleteTask(taskId)),
			createAgent: (input) => runMutation(() => dataSource.createAgent(input)),
			updateAgent: (agentId, input) =>
				runMutation(() => dataSource.updateAgent(agentId, input)),
			updateUserSnapshot: (input) =>
				runMutation(() => dataSource.updateUserSnapshot(input)),
		}),
		[
			agents,
			archivedProjects,
			dataSource,
			dismissRewardNotification,
			error,
			isLoading,
			isMutating,
			projects,
			reload,
			rewardNotifications,
			runMutation,
			snapshot,
			tasks,
		],
	);

	return (
		<AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
	);
}
