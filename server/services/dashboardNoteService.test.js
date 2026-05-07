import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupTestDatabase } from "../test-utils/database.js";

let cleanupDatabase;
let dashboardNoteService;

beforeEach(async () => {
	const database = await setupTestDatabase();
	cleanupDatabase = database.cleanup;
	dashboardNoteService = await import("./dashboardNoteService.js");
});

afterEach(async () => {
	await cleanupDatabase?.();
	cleanupDatabase = undefined;
});

describe("dashboardNoteService", () => {
	it("keeps one persisted dashboard note and stores markdown as raw content", () => {
		expect(dashboardNoteService.getDashboardNoteView()).toMatchObject({
			id: "dashboard-note",
			content: "",
		});

		const markdown = "# Titre\n\n- item\n\n`code`";
		const note = dashboardNoteService.patchDashboardNote({ content: markdown });

		expect(note).toMatchObject({
			id: "dashboard-note",
			content: markdown,
		});
		expect(dashboardNoteService.getDashboardNoteView().content).toBe(markdown);
	});
});
