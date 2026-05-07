import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CalendarEvent, DashboardNote, Project, TaskItem } from "../types";
import { DashboardSidebar } from "./DashboardSidebar";

const projects: Project[] = [
	{
		id: "project-1",
		name: "Refonte UI",
		client: "Client",
		stack: ["React"],
		priority: "high",
		progress: 50,
		status: "in-progress",
		summary: "Résumé",
		milestone: "UI freeze jeudi 18:00",
		archivedAt: null,
	},
	{
		id: "project-2",
		name: "Backlog",
		client: "Client",
		stack: ["Node"],
		priority: "medium",
		progress: 0,
		status: "planned",
		summary: "Résumé",
		milestone: "À clarifier",
		archivedAt: null,
	},
];

const tasks: TaskItem[] = [
	{
		id: "task-1",
		title: "Terminée",
		done: true,
		projectId: "project-1",
		urgency: "today",
	},
	{
		id: "task-2",
		title: "Ouverte",
		done: false,
		projectId: "project-1",
		urgency: "week",
	},
];

const calendarEvents: CalendarEvent[] = [
	{
		id: "event-1",
		title: "Démo client",
		date: "2026-05-07",
		time: "18:00",
		kind: "event",
		notes: "Préparer la démo",
		createdAt: "2026-05-07T08:00:00.000Z",
		updatedAt: "2026-05-07T08:00:00.000Z",
	},
];

const dashboardNote: DashboardNote = {
	id: "dashboard-note",
	content: "# Note",
	updatedAt: "2026-05-07T08:00:00.000Z",
};

function renderSidebar(isMenuOpen = true) {
	return renderToStaticMarkup(
		<DashboardSidebar
			calendarEvents={calendarEvents}
			dashboardNote={dashboardNote}
			isMenuOpen={isMenuOpen}
			isMutating={false}
			projects={projects}
			tasks={tasks}
			onCreateCalendarEvent={vi.fn()}
			onDeleteCalendarEvent={vi.fn()}
			onToggleMenu={vi.fn()}
			onUpdateDashboardNote={vi.fn()}
		/>,
	);
}

describe("DashboardSidebar", () => {
	it("renders the accessible toggle state and organisation header", () => {
		const openMarkup = renderSidebar(true);
		const closedMarkup = renderSidebar(false);

		expect(openMarkup).toContain('aria-expanded="true"');
		expect(openMarkup).toContain("Organisation");
		expect(closedMarkup).toContain('aria-expanded="false"');
		expect(closedMarkup).toContain('aria-hidden="true"');
	});

	it("renders global completed task stats and period controls", () => {
		const markup = renderSidebar();

		expect(markup).toContain("1 tâches terminées");
		expect(markup).toContain("cette semaine");
		expect(markup).toContain("Semaine");
		expect(markup).toContain("Mois");
	});

	it("renders project milestones, unplanned milestones, events, and notes accordion", () => {
		const markup = renderSidebar();

		expect(markup).toContain("Refonte UI");
		expect(markup).toContain("UI freeze jeudi 18:00");
		expect(markup).toContain("18:00");
		expect(markup).toContain("À planifier");
		expect(markup).toContain("Backlog");
		expect(markup).toContain("Démo client");
		expect(markup).toContain("Supprimer Démo client");
		expect(markup).toContain("Notes");
		expect(markup).not.toContain("preview");
	});
});
