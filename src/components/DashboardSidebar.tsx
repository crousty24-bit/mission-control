import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import type {
	CalendarEvent,
	CalendarEventKind,
	DashboardNote,
	Project,
} from "../types";

interface DashboardSidebarProps {
	calendarEvents: CalendarEvent[];
	dashboardNote: DashboardNote;
	isMenuOpen: boolean;
	isMutating: boolean;
	projects: Project[];
	onCreateCalendarEvent: (input: {
		title: string;
		date: string;
		time?: string | null;
		kind: CalendarEventKind;
		notes?: string;
	}) => Promise<CalendarEvent>;
	onDeleteCalendarEvent: (eventId: string) => Promise<void>;
	onToggleMenu: () => void;
	onUpdateDashboardNote: (input: { content: string }) => Promise<DashboardNote>;
}

interface ProjectMilestoneItem {
	id: string;
	projectName: string;
	title: string;
	date: string | null;
	time: string | null;
}

const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const dayIndexes = new Map([
	["lundi", 0],
	["mardi", 1],
	["mercredi", 2],
	["jeudi", 3],
	["vendredi", 4],
	["samedi", 5],
	["dimanche", 6],
]);

function toDateInputValue(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
	const nextDate = new Date(date);
	nextDate.setDate(nextDate.getDate() + amount);
	return nextDate;
}

function getWeekStart(date: Date) {
	const weekStart = new Date(date);
	const dayOffset = (weekStart.getDay() + 6) % 7;
	weekStart.setDate(weekStart.getDate() - dayOffset);
	weekStart.setHours(0, 0, 0, 0);
	return weekStart;
}

function normalizeMilestone(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

function parseMilestoneTime(value: string) {
	const timeMatch = value.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/);
	if (timeMatch) {
		return timeMatch[0];
	}

	const normalized = normalizeMilestone(value);
	if (normalized.includes("matin")) {
		return "09:00";
	}
	if (normalized.includes("apres-midi")) {
		return "14:00";
	}
	if (normalized.includes("soir")) {
		return "18:00";
	}

	return null;
}

function parseProjectMilestone(
	project: Project,
	today: Date,
): ProjectMilestoneItem {
	const milestone = project.milestone.trim();
	const normalized = normalizeMilestone(milestone);
	const time = parseMilestoneTime(milestone);

	if (!milestone || normalized.includes("sans echeance definie")) {
		return {
			id: `project-${project.id}`,
			projectName: project.name,
			title: milestone || "Sans échéance définie",
			date: null,
			time: null,
		};
	}

	if (normalized.includes("demain")) {
		return {
			id: `project-${project.id}`,
			projectName: project.name,
			title: milestone,
			date: toDateInputValue(addDays(today, 1)),
			time,
		};
	}

	for (const [dayName, dayIndex] of dayIndexes) {
		if (normalized.includes(dayName)) {
			return {
				id: `project-${project.id}`,
				projectName: project.name,
				title: milestone,
				date: toDateInputValue(addDays(getWeekStart(today), dayIndex)),
				time,
			};
		}
	}

	return {
		id: `project-${project.id}`,
		projectName: project.name,
		title: milestone,
		date: null,
		time: null,
	};
}

function renderInlineMarkdown(value: string, keyPrefix: string) {
	const nodes: ReactNode[] = [];
	const tokenPattern =
		/(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
	let currentIndex = 0;
	let tokenIndex = 0;

	for (const match of value.matchAll(tokenPattern)) {
		if (match.index === undefined) {
			continue;
		}

		if (match.index > currentIndex) {
			nodes.push(value.slice(currentIndex, match.index));
		}

		const key = `${keyPrefix}-${tokenIndex}`;
		if (match[2] && match[3]) {
			nodes.push(
				<a key={key} href={match[3]} target="_blank" rel="noreferrer">
					{match[2]}
				</a>,
			);
		} else if (match[4]) {
			nodes.push(<code key={key}>{match[4]}</code>);
		} else if (match[5]) {
			nodes.push(<strong key={key}>{match[5]}</strong>);
		} else if (match[6]) {
			nodes.push(<em key={key}>{match[6]}</em>);
		}

		currentIndex = match.index + match[0].length;
		tokenIndex += 1;
	}

	if (currentIndex < value.length) {
		nodes.push(value.slice(currentIndex));
	}

	return nodes;
}

function renderMarkdown(content: string) {
	const lines = content.split("\n");
	const nodes: ReactNode[] = [];
	let listItems: Array<{ key: string; nodes: ReactNode[] }> = [];
	let codeLines: string[] = [];
	let isCodeBlock = false;
	let blockIndex = 0;

	const flushList = () => {
		if (listItems.length === 0) {
			return;
		}
		nodes.push(
			<ul key={`list-${blockIndex}`}>
				{listItems.map((item) => (
					<li key={item.key}>{item.nodes}</li>
				))}
			</ul>,
		);
		listItems = [];
		blockIndex += 1;
	};

	const flushCodeBlock = () => {
		if (codeLines.length === 0) {
			return;
		}
		nodes.push(
			<pre key={`code-${blockIndex}`}>
				<code>{codeLines.join("\n")}</code>
			</pre>,
		);
		codeLines = [];
		blockIndex += 1;
	};

	for (const line of lines) {
		if (line.trim().startsWith("```")) {
			if (isCodeBlock) {
				flushCodeBlock();
			} else {
				flushList();
			}
			isCodeBlock = !isCodeBlock;
			continue;
		}

		if (isCodeBlock) {
			codeLines.push(line);
			continue;
		}

		const trimmed = line.trim();
		if (!trimmed) {
			flushList();
			continue;
		}

		if (trimmed.startsWith("- ")) {
			const key = `li-${blockIndex}-${listItems.length}-${trimmed}`;
			listItems.push({
				key,
				nodes: renderInlineMarkdown(trimmed.slice(2), key),
			});
			continue;
		}

		flushList();
		if (trimmed.startsWith("### ")) {
			nodes.push(
				<h4 key={`heading-${blockIndex}`}>
					{renderInlineMarkdown(trimmed.slice(4), `h4-${blockIndex}`)}
				</h4>,
			);
		} else if (trimmed.startsWith("## ")) {
			nodes.push(
				<h3 key={`heading-${blockIndex}`}>
					{renderInlineMarkdown(trimmed.slice(3), `h3-${blockIndex}`)}
				</h3>,
			);
		} else if (trimmed.startsWith("# ")) {
			nodes.push(
				<h2 key={`heading-${blockIndex}`}>
					{renderInlineMarkdown(trimmed.slice(2), `h2-${blockIndex}`)}
				</h2>,
			);
		} else {
			nodes.push(
				<p key={`paragraph-${blockIndex}`}>
					{renderInlineMarkdown(trimmed, `p-${blockIndex}`)}
				</p>,
			);
		}
		blockIndex += 1;
	}

	flushList();
	if (isCodeBlock) {
		flushCodeBlock();
	}

	return nodes;
}

function DashboardNoteEditor({
	dashboardNote,
	isMutating,
	onUpdateDashboardNote,
}: {
	dashboardNote: DashboardNote;
	isMutating: boolean;
	onUpdateDashboardNote: (input: { content: string }) => Promise<DashboardNote>;
}) {
	const [noteDraft, setNoteDraft] = useState(dashboardNote.content);
	const markdownPreview = useMemo(() => renderMarkdown(noteDraft), [noteDraft]);

	const handleSaveNote = async () => {
		await onUpdateDashboardNote({ content: noteDraft });
	};

	return (
		<div className="dashboard-feature__body dashboard-note">
			<textarea
				value={noteDraft}
				placeholder="Notes markdown..."
				aria-label="Notes dashboard markdown"
				onChange={(event) => setNoteDraft(event.target.value)}
			/>
			<section className="dashboard-note__preview" aria-label="Aperçu markdown">
				{markdownPreview}
			</section>
			<button
				type="button"
				disabled={isMutating || noteDraft === dashboardNote.content}
				onClick={() => void handleSaveNote()}
			>
				Enregistrer
			</button>
		</div>
	);
}

export function DashboardSidebar({
	calendarEvents,
	dashboardNote,
	isMenuOpen,
	isMutating,
	projects,
	onCreateCalendarEvent,
	onDeleteCalendarEvent,
	onToggleMenu,
	onUpdateDashboardNote,
}: DashboardSidebarProps) {
	const today = useMemo(() => {
		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		return currentDate;
	}, []);
	const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
	const [isPlanningOpen, setIsPlanningOpen] = useState(true);
	const [isNotesOpen, setIsNotesOpen] = useState(false);
	const [eventTitle, setEventTitle] = useState("");
	const [eventDate, setEventDate] = useState(() => toDateInputValue(today));
	const [eventTime, setEventTime] = useState("");
	const [eventKind, setEventKind] = useState<CalendarEventKind>("event");
	const [eventNotes, setEventNotes] = useState("");

	const weekDays = useMemo(
		() =>
			Array.from({ length: 7 }, (_, index) => {
				const date = addDays(weekStart, index);
				return {
					date,
					dateValue: toDateInputValue(date),
					label: dayLabels[index],
				};
			}),
		[weekStart],
	);
	const projectMilestones = useMemo(
		() => projects.map((project) => parseProjectMilestone(project, today)),
		[projects, today],
	);
	const unplannedMilestones = projectMilestones.filter((item) => !item.date);

	const handleCreateEvent = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		await onCreateCalendarEvent({
			title: eventTitle,
			date: eventDate,
			time: eventTime || null,
			kind: eventKind,
			notes: eventNotes,
		});
		setEventTitle("");
		setEventTime("");
		setEventNotes("");
	};

	return (
		<aside
			id="dashboard-activity-menu"
			className="dashboard-sidebar"
			aria-label="Activités du dashboard"
		>
			<button
				type="button"
				className="dashboard-sidebar__toggle"
				aria-controls="dashboard-activity-menu"
				aria-expanded={isMenuOpen}
				aria-label={
					isMenuOpen ? "Réduire le menu dashboard" : "Ouvrir le menu dashboard"
				}
				title={
					isMenuOpen ? "Réduire le menu dashboard" : "Ouvrir le menu dashboard"
				}
				onClick={onToggleMenu}
			>
				<span className="dashboard-sidebar__toggle-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
						<path
							d="M4 7h16M4 12h16M4 17h16"
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeWidth="1.8"
						/>
					</svg>
				</span>
				<span className="sr-only">
					{isMenuOpen
						? "Réduire le menu dashboard"
						: "Ouvrir le menu dashboard"}
				</span>
			</button>

			<div className="dashboard-sidebar__panel" aria-hidden={!isMenuOpen}>
				<div className="dashboard-sidebar__header">
					<p className="eyebrow">Dashboard</p>
					<h2>Activités</h2>
				</div>

				<section className="dashboard-feature">
					<button
						type="button"
						className="dashboard-feature__summary"
						aria-expanded={isPlanningOpen}
						onClick={() => setIsPlanningOpen((isOpen) => !isOpen)}
					>
						<span>Planning</span>
						<small>{isPlanningOpen ? "Réduire" : "Ouvrir"}</small>
					</button>

					{isPlanningOpen ? (
						<div className="dashboard-feature__body">
							<div className="dashboard-weeknav">
								<button
									type="button"
									onClick={() => setWeekStart((date) => addDays(date, -7))}
								>
									Préc.
								</button>
								<strong>
									{weekDays[0].date.toLocaleDateString("fr-FR", {
										day: "2-digit",
										month: "short",
									})}{" "}
									-{" "}
									{weekDays[6].date.toLocaleDateString("fr-FR", {
										day: "2-digit",
										month: "short",
									})}
								</strong>
								<button
									type="button"
									onClick={() => setWeekStart((date) => addDays(date, 7))}
								>
									Suiv.
								</button>
								<button
									type="button"
									onClick={() => setWeekStart(getWeekStart(today))}
								>
									Aujourd'hui
								</button>
							</div>

							<div className="dashboard-week">
								{weekDays.map((day) => {
									const dayEvents = calendarEvents.filter(
										(item) => item.date === day.dateValue,
									);
									const dayMilestones = projectMilestones.filter(
										(item) => item.date === day.dateValue,
									);

									return (
										<div className="dashboard-day" key={day.dateValue}>
											<div className="dashboard-day__header">
												<strong>{day.label}</strong>
												<span>
													{day.date.toLocaleDateString("fr-FR", {
														day: "2-digit",
														month: "2-digit",
													})}
												</span>
											</div>
											{dayMilestones.map((item) => (
												<div
													className="dashboard-calendar-item dashboard-calendar-item--project"
													key={item.id}
												>
													<span>{item.time ?? "--:--"}</span>
													<strong>{item.projectName}</strong>
													<small>{item.title}</small>
												</div>
											))}
											{dayEvents.map((item) => (
												<div className="dashboard-calendar-item" key={item.id}>
													<span>{item.time ?? "--:--"}</span>
													<strong>{item.title}</strong>
													<small>
														{item.kind === "reminder"
															? "Reminder"
															: "Événement"}
													</small>
													{item.notes ? <p>{item.notes}</p> : null}
													<button
														type="button"
														onClick={() => void onDeleteCalendarEvent(item.id)}
													>
														Supprimer
													</button>
												</div>
											))}
										</div>
									);
								})}
							</div>

							{unplannedMilestones.length > 0 ? (
								<div className="dashboard-unplanned">
									<strong>À planifier</strong>
									{unplannedMilestones.map((item) => (
										<p key={item.id}>
											<span>{item.projectName}</span> {item.title}
										</p>
									))}
								</div>
							) : null}

							<form
								className="dashboard-event-form"
								onSubmit={handleCreateEvent}
							>
								<input
									type="text"
									value={eventTitle}
									placeholder="Nouvel événement"
									aria-label="Titre de l'événement"
									onChange={(event) => setEventTitle(event.target.value)}
								/>
								<div className="dashboard-event-form__row">
									<input
										type="date"
										value={eventDate}
										aria-label="Date de l'événement"
										onChange={(event) => setEventDate(event.target.value)}
									/>
									<input
										type="time"
										value={eventTime}
										aria-label="Heure de l'événement"
										onChange={(event) => setEventTime(event.target.value)}
									/>
								</div>
								<select
									value={eventKind}
									aria-label="Type d'entrée planning"
									onChange={(event) =>
										setEventKind(event.target.value as CalendarEventKind)
									}
								>
									<option value="event">Événement</option>
									<option value="reminder">Reminder</option>
								</select>
								<textarea
									value={eventNotes}
									placeholder="Note optionnelle"
									aria-label="Note de l'événement"
									onChange={(event) => setEventNotes(event.target.value)}
								/>
								<button
									type="submit"
									disabled={isMutating || !eventTitle.trim()}
								>
									Ajouter
								</button>
							</form>
						</div>
					) : null}
				</section>

				<section className="dashboard-feature">
					<button
						type="button"
						className="dashboard-feature__summary"
						aria-expanded={isNotesOpen}
						onClick={() => setIsNotesOpen((isOpen) => !isOpen)}
					>
						<span>Notes</span>
						<small>{isNotesOpen ? "Réduire" : "Ouvrir"}</small>
					</button>

					{isNotesOpen ? (
						<DashboardNoteEditor
							key={dashboardNote.updatedAt}
							dashboardNote={dashboardNote}
							isMutating={isMutating}
							onUpdateDashboardNote={onUpdateDashboardNote}
						/>
					) : null}
				</section>
			</div>
		</aside>
	);
}
