export const seedProjects = [
	{
		id: "studio",
		name: "Studio Pulse",
		client: "Internal",
		stack: ["React", "Vite", "TypeScript"],
		priority: "high",
		status: "in-progress",
		summary: "Dashboard produit avec orchestration locale des agents de build.",
		milestone: "UI freeze jeudi 18:00",
	},
	{
		id: "commerce",
		name: "Commerce Edge",
		client: "Northwind",
		stack: ["Next.js", "Stripe", "Postgres"],
		priority: "medium",
		status: "review",
		summary: "Corrections checkout et reprise des métriques de conversion.",
		milestone: "QA paiement demain matin",
	},
	{
		id: "infra",
		name: "Infra Watch",
		client: "Ops team",
		stack: ["Node", "Grafana", "Docker"],
		priority: "high",
		status: "blocked",
		summary: "Visibilité sur les agents locaux et relance des workers bloqués.",
		milestone: "Dépendance logs système",
	},
];

export const seedTasks = [
	{
		id: "t1",
		title: "Finaliser la navigation dashboard",
		done: 1,
		projectId: "studio",
		urgency: "today",
	},
	{
		id: "t2",
		title: "Intégrer les menus statut et priorité",
		done: 1,
		projectId: "studio",
		urgency: "today",
	},
	{
		id: "t3",
		title: "Valider la modal de création projet",
		done: 0,
		projectId: "studio",
		urgency: "week",
	},
	{
		id: "t4",
		title: "Relire le flux checkout avec QA",
		done: 1,
		projectId: "commerce",
		urgency: "week",
	},
	{
		id: "t5",
		title: "Corriger les retours de review sur le checkout",
		done: 0,
		projectId: "commerce",
		urgency: "today",
	},
	{
		id: "t6",
		title: "Débloquer la collecte des logs agents",
		done: 0,
		projectId: "infra",
		urgency: "today",
	},
	{
		id: "t7",
		title: "Mapper les erreurs runtime des workers",
		done: 0,
		projectId: "infra",
		urgency: "week",
	},
	{
		id: "t8",
		title: "Préparer le patch de supervision locale",
		done: 1,
		projectId: "infra",
		urgency: "week",
	},
];

export const seedAgents = [
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

export const seedSnapshot = {
	developer: "Developer",
	sprint: "Current Sprint",
	focusScore: 76,
	nextDeadline: "Upcoming milestone",
};
