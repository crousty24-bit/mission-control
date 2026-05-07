import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupTestDatabase } from "../test-utils/database.js";

let calendarService;
let cleanupDatabase;

beforeEach(async () => {
	const database = await setupTestDatabase();
	cleanupDatabase = database.cleanup;
	calendarService = await import("./calendarService.js");
});

afterEach(async () => {
	await cleanupDatabase?.();
	cleanupDatabase = undefined;
});

describe("calendarService", () => {
	it("normalises event input and persists free events", () => {
		const event = calendarService.createCalendarEventRecord({
			title: "  Démo client  ",
			date: "2026-05-07",
			time: "",
			kind: "event",
			notes: "  Préparer markdown  ",
		});

		expect(event).toMatchObject({
			title: "Démo client",
			date: "2026-05-07",
			time: null,
			kind: "event",
			notes: "Préparer markdown",
		});
		expect(calendarService.getCalendarEvents()).toContainEqual(
			expect.objectContaining({ id: event.id }),
		);
	});

	it("rejects invalid event input", () => {
		expect(() =>
			calendarService.createCalendarEventRecord({
				title: "",
				date: "2026-05-07",
				kind: "event",
			}),
		).toThrow("Event title is required");
		expect(() =>
			calendarService.createCalendarEventRecord({
				title: "Date invalide",
				date: "07/05/2026",
				kind: "event",
			}),
		).toThrow("Event date is invalid");
		expect(() =>
			calendarService.createCalendarEventRecord({
				title: "Heure invalide",
				date: "2026-05-07",
				time: "9h",
				kind: "event",
			}),
		).toThrow("Event time is invalid");
		expect(() =>
			calendarService.createCalendarEventRecord({
				title: "Type invalide",
				date: "2026-05-07",
				kind: "task",
			}),
		).toThrow("Event kind is invalid");
	});

	it("patches and deletes free events", () => {
		const event = calendarService.createCalendarEventRecord({
			title: "Reminder",
			date: "2026-05-07",
			time: "18:00",
			kind: "reminder",
			notes: "",
		});

		expect(
			calendarService.patchCalendarEvent(event.id, {
				title: "Reminder modifié",
				time: null,
			}),
		).toMatchObject({ title: "Reminder modifié", time: null });
		expect(calendarService.deleteCalendarEvent(event.id)).toBe(true);
		expect(calendarService.deleteCalendarEvent(event.id)).toBe(false);
	});
});
