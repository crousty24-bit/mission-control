import type {
	CalendarEvent,
	DashboardNote,
	LocalAgent,
	ProjectWithProgress,
	TaskItem,
	UserSnapshot,
} from "../types";

export const staticSeedProjects: ProjectWithProgress[] = [
	{
		id: "studio",
		name: "Studio Pulse",
		client: "Internal",
		stack: ["React", "Vite", "TypeScript"],
		priority: "high",
		progress: 0,
		status: "in-progress",
		summary: "Dashboard produit avec orchestration locale des agents de build.",
		milestone: "UI freeze jeudi 18:00",
		archivedAt: null,
	},
	{
		id: "commerce",
		name: "Commerce Edge",
		client: "Northwind",
		stack: ["Next.js", "Stripe", "Postgres"],
		priority: "medium",
		progress: 0,
		status: "review",
		summary: "Corrections checkout et reprise des métriques de conversion.",
		milestone: "QA paiement demain matin",
		archivedAt: null,
	},
	{
		id: "infra",
		name: "Infra Watch",
		client: "Ops team",
		stack: ["Node", "Grafana", "Docker"],
		priority: "high",
		progress: 0,
		status: "blocked",
		summary: "Visibilité sur les agents locaux et relance des workers bloqués.",
		milestone: "Dépendance logs système",
		archivedAt: null,
	},
];

export const staticSeedTasks: TaskItem[] = [
	{
		id: "t1",
		title: "Finaliser la navigation dashboard",
		done: true,
		projectId: "studio",
		urgency: "today",
	},
	{
		id: "t2",
		title: "Intégrer les menus statut et priorité",
		done: true,
		projectId: "studio",
		urgency: "today",
	},
	{
		id: "t3",
		title: "Valider la modal de création projet",
		done: false,
		projectId: "studio",
		urgency: "week",
	},
	{
		id: "t4",
		title: "Relire le flux checkout avec QA",
		done: true,
		projectId: "commerce",
		urgency: "week",
	},
	{
		id: "t5",
		title: "Corriger les retours de review sur le checkout",
		done: false,
		projectId: "commerce",
		urgency: "today",
	},
	{
		id: "t6",
		title: "Débloquer la collecte des logs agents",
		done: false,
		projectId: "infra",
		urgency: "today",
	},
	{
		id: "t7",
		title: "Mapper les erreurs runtime des workers",
		done: false,
		projectId: "infra",
		urgency: "week",
	},
	{
		id: "t8",
		title: "Préparer le patch de supervision locale",
		done: true,
		projectId: "infra",
		urgency: "week",
	},
];

export const staticSeedAgents: LocalAgent[] = [
	{
		id: "a1",
		name: "openclaw",
		role: "Code worker",
		status: "active",
		currentTask: "Intègre la TDL au board Studio Pulse",
		projectId: "studio",
		runtime: "01h 24",
	},
	{
		id: "a2",
		name: "watchtower",
		role: "Observability",
		status: "blocked",
		currentTask: "Attend les logs Docker de Infra Watch",
		projectId: "infra",
		runtime: "00h 48",
	},
	{
		id: "a3",
		name: "mercury",
		role: "Release helper",
		status: "idle",
		currentTask: "Prêt pour la prochaine preview e-commerce",
		projectId: "commerce",
		runtime: "00h 12",
	},
];

export const staticSeedCalendarEvents: CalendarEvent[] = [
	{
		id: "event-demo",
		title: "Démo GitHub Pages",
		date: "2026-05-07",
		time: "18:00",
		kind: "event",
		notes: "Parcours statique avec persistance navigateur.",
		createdAt: "2026-05-07T08:00:00.000Z",
		updatedAt: "2026-05-07T08:00:00.000Z",
	},
	{
		id: "reminder-demo",
		title: "Préparer les captures",
		date: "2026-05-08",
		time: "09:30",
		kind: "reminder",
		notes: "Vérifier landing, dashboard et archives.",
		createdAt: "2026-05-07T08:00:00.000Z",
		updatedAt: "2026-05-07T08:00:00.000Z",
	},
];

export const staticSeedDashboardNote: DashboardNote = {
	id: "dashboard-note",
	content: "",
	updatedAt: "2026-05-07T08:00:00.000Z",
};

export const staticSeedSnapshot: UserSnapshot = {
	developer: "Developer",
	activeProjects: 0,
	completedTasks: 0,
	remainingTasks: 0,
	nextDeadline: "Upcoming milestone",
	completionRate: 0,
	streakCount: 0,
	streakLastRewardedAt: null,
	medalsRewardCount: 0,
};
