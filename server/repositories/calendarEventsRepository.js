import { getDb } from "../db/connection.js";

function mapCalendarEvent(row) {
	return {
		id: row.id,
		title: row.title,
		date: row.date,
		time: row.time,
		kind: row.kind,
		notes: row.notes,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export function listCalendarEvents() {
	const rows = getDb()
		.prepare(
			"SELECT * FROM calendar_events ORDER BY date ASC, time IS NULL ASC, time ASC, created_at ASC",
		)
		.all();
	return rows.map(mapCalendarEvent);
}

export function getCalendarEventById(eventId) {
	const row = getDb()
		.prepare("SELECT * FROM calendar_events WHERE id = ?")
		.get(eventId);
	return row ? mapCalendarEvent(row) : null;
}

export function insertCalendarEvent(event) {
	getDb()
		.prepare(`
    INSERT INTO calendar_events (id, title, date, time, kind, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
		.run(
			event.id,
			event.title,
			event.date,
			event.time,
			event.kind,
			event.notes,
			event.createdAt,
			event.updatedAt,
		);

	return getCalendarEventById(event.id);
}

export function updateCalendarEvent(eventId, changes) {
	const current = getCalendarEventById(eventId);
	if (!current) {
		return null;
	}

	const nextEvent = {
		...current,
		...changes,
		updatedAt: new Date().toISOString(),
	};

	getDb()
		.prepare(`
    UPDATE calendar_events
    SET title = ?, date = ?, time = ?, kind = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `)
		.run(
			nextEvent.title,
			nextEvent.date,
			nextEvent.time,
			nextEvent.kind,
			nextEvent.notes,
			nextEvent.updatedAt,
			eventId,
		);

	return getCalendarEventById(eventId);
}

export function deleteCalendarEvent(eventId) {
	const result = getDb()
		.prepare("DELETE FROM calendar_events WHERE id = ?")
		.run(eventId);
	return result.changes > 0;
}
