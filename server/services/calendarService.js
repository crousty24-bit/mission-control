import { randomUUID } from "node:crypto";
import {
	getCalendarEventById,
	insertCalendarEvent,
	listCalendarEvents,
	deleteCalendarEvent as removeCalendarEvent,
	updateCalendarEvent,
} from "../repositories/calendarEventsRepository.js";

const eventKinds = new Set(["event", "reminder"]);

function normalizeEventInput(input, current = {}) {
	const title = (input.title ?? current.title ?? "").trim();
	const date = (input.date ?? current.date ?? "").trim();
	const kind = input.kind ?? current.kind ?? "event";
	const timeValue = input.time === undefined ? current.time : input.time;
	const time =
		typeof timeValue === "string" && timeValue.trim() ? timeValue.trim() : null;

	if (!title) {
		throw new Error("Event title is required");
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new Error("Event date is invalid");
	}

	if (time && !/^\d{2}:\d{2}$/.test(time)) {
		throw new Error("Event time is invalid");
	}

	if (!eventKinds.has(kind)) {
		throw new Error("Event kind is invalid");
	}

	return {
		title,
		date,
		time,
		kind,
		notes: (input.notes ?? current.notes ?? "").trim(),
	};
}

export function getCalendarEvents() {
	return listCalendarEvents();
}

export function createCalendarEventRecord(input) {
	const timestamp = new Date().toISOString();
	const event = {
		id: randomUUID(),
		...normalizeEventInput(input),
		createdAt: timestamp,
		updatedAt: timestamp,
	};

	return insertCalendarEvent(event);
}

export function patchCalendarEvent(eventId, changes) {
	const current = getCalendarEventById(eventId);
	if (!current) {
		return null;
	}

	return updateCalendarEvent(eventId, normalizeEventInput(changes, current));
}

export function deleteCalendarEvent(eventId) {
	return removeCalendarEvent(eventId);
}
