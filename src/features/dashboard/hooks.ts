import type {
	CreateCalendarEventInput,
	UpdateCalendarEventInput,
	UpdateDashboardNoteInput,
} from "../../types";
import { useAppData } from "../app-data/useAppData";

export function useDashboardCalendar() {
	const { calendarEvents, error, isLoading } = useAppData();
	return { calendarEvents, error, isLoading };
}

export function useDashboardNote() {
	const { dashboardNote, error, isLoading } = useAppData();
	return { dashboardNote, error, isLoading };
}

export function useDashboardFeatureActions() {
	const {
		createCalendarEvent,
		deleteCalendarEvent,
		updateCalendarEvent,
		updateDashboardNote,
		isMutating,
	} = useAppData();

	return {
		isMutating,
		createCalendarEvent: (input: CreateCalendarEventInput) =>
			createCalendarEvent(input),
		updateCalendarEvent: (eventId: string, input: UpdateCalendarEventInput) =>
			updateCalendarEvent(eventId, input),
		deleteCalendarEvent: (eventId: string) => deleteCalendarEvent(eventId),
		updateDashboardNote: (input: UpdateDashboardNoteInput) =>
			updateDashboardNote(input),
	};
}
