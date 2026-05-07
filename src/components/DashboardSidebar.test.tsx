// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
	return render(
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
		const { rerender } = renderSidebar(true);

		const toggle = screen.getByRole("button", {
			name: "Réduire le menu dashboard",
		});
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		expect(
			screen.getByRole("heading", { name: "Organisation" }),
		).toBeInTheDocument();

		rerender(
			<DashboardSidebar
				calendarEvents={calendarEvents}
				dashboardNote={dashboardNote}
				isMenuOpen={false}
				isMutating={false}
				projects={projects}
				tasks={tasks}
				onCreateCalendarEvent={vi.fn()}
				onDeleteCalendarEvent={vi.fn()}
				onToggleMenu={vi.fn()}
				onUpdateDashboardNote={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Ouvrir le menu dashboard" }),
		).toHaveAttribute("aria-expanded", "false");
		expect(screen.getByLabelText("Activités du dashboard")).toContainElement(
			document.querySelector('[aria-hidden="true"]'),
		);
	});

	it("renders global completed task stats and period controls", () => {
		renderSidebar();

		expect(
			screen.getByRole("img", {
				name: "1 tâches terminées cette semaine",
			}),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Semaine" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Mois" })).toBeInTheDocument();
	});

	it("renders project milestones, unplanned milestones, events, and notes accordion", () => {
		renderSidebar();

		expect(screen.getByText("Refonte UI")).toBeInTheDocument();
		expect(screen.getByText("UI freeze jeudi 18:00")).toBeInTheDocument();
		expect(screen.getAllByText("18:00").length).toBeGreaterThan(0);
		expect(screen.getByText("À planifier")).toBeInTheDocument();
		expect(screen.getByText("Backlog")).toBeInTheDocument();
		expect(screen.getByText("Démo client")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Supprimer Démo client" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Notes/ })).toBeInTheDocument();
		expect(screen.queryByText("preview")).not.toBeInTheDocument();
	});

	it("creates calendar events and saves dashboard notes from user input", async () => {
		const user = userEvent.setup();
		const onCreateCalendarEvent = vi
			.fn()
			.mockResolvedValue({ ...calendarEvents[0], id: "event-2" });
		const onUpdateDashboardNote = vi
			.fn()
			.mockResolvedValue({ ...dashboardNote, content: "# Nouvelle note" });

		render(
			<DashboardSidebar
				calendarEvents={calendarEvents}
				dashboardNote={dashboardNote}
				isMenuOpen={true}
				isMutating={false}
				projects={projects}
				tasks={tasks}
				onCreateCalendarEvent={onCreateCalendarEvent}
				onDeleteCalendarEvent={vi.fn()}
				onToggleMenu={vi.fn()}
				onUpdateDashboardNote={onUpdateDashboardNote}
			/>,
		);

		await user.type(screen.getByLabelText("Titre de l'événement"), "Release");
		await user.clear(screen.getByLabelText("Date de l'événement"));
		await user.type(screen.getByLabelText("Date de l'événement"), "2026-05-08");
		await user.type(screen.getByLabelText("Heure de l'événement"), "09:30");
		await user.selectOptions(
			screen.getByLabelText("Type d'entrée planning"),
			"reminder",
		);
		await user.type(screen.getByLabelText("Note de l'événement"), "Préparer");
		await user.click(screen.getByRole("button", { name: "Ajouter" }));

		expect(onCreateCalendarEvent).toHaveBeenCalledWith({
			title: "Release",
			date: "2026-05-08",
			time: "09:30",
			kind: "reminder",
			notes: "Préparer",
		});

		await user.click(screen.getByRole("button", { name: /Notes/ }));
		await user.clear(screen.getByLabelText("Notes dashboard markdown"));
		await user.type(
			screen.getByLabelText("Notes dashboard markdown"),
			"# Nouvelle note",
		);
		await user.click(screen.getByRole("button", { name: "Enregistrer" }));

		expect(onUpdateDashboardNote).toHaveBeenCalledWith({
			content: "# Nouvelle note",
		});
	});
});
