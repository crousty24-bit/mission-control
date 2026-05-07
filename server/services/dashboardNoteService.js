import {
	getDashboardNote,
	updateDashboardNote,
} from "../repositories/dashboardNotesRepository.js";

export function getDashboardNoteView() {
	return getDashboardNote();
}

export function patchDashboardNote(input) {
	return updateDashboardNote(String(input.content ?? ""));
}
