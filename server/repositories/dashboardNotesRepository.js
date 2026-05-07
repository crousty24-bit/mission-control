import { getDb } from "../db/connection.js";

const DASHBOARD_NOTE_ID = "dashboard-note";

function mapDashboardNote(row) {
	return {
		id: row.id,
		content: row.content,
		updatedAt: row.updated_at,
	};
}

export function getDashboardNote() {
	const db = getDb();
	const row = db
		.prepare("SELECT * FROM dashboard_notes WHERE id = ?")
		.get(DASHBOARD_NOTE_ID);

	if (row) {
		return mapDashboardNote(row);
	}

	const updatedAt = new Date().toISOString();
	db.prepare(
		"INSERT INTO dashboard_notes (id, content, updated_at) VALUES (?, ?, ?)",
	).run(DASHBOARD_NOTE_ID, "", updatedAt);

	return {
		id: DASHBOARD_NOTE_ID,
		content: "",
		updatedAt,
	};
}

export function updateDashboardNote(content) {
	const updatedAt = new Date().toISOString();
	getDb()
		.prepare(`
    INSERT INTO dashboard_notes (id, content, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at
  `)
		.run(DASHBOARD_NOTE_ID, content, updatedAt);

	return getDashboardNote();
}
