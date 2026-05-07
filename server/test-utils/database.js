import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { vi } from "vitest";

export async function setupTestDatabase() {
	vi.resetModules();
	const tempDir = mkdtempSync(join(tmpdir(), "mission-control-test-"));
	process.env.MISSION_CONTROL_DB_PATH = join(tempDir, "mission-control.sqlite");

	const { initDatabase } = await import("../db/init.js");
	const { closeDatabase } = await import("../db/connection.js");
	initDatabase();

	return {
		dbPath: process.env.MISSION_CONTROL_DB_PATH,
		async cleanup() {
			closeDatabase();
			delete process.env.MISSION_CONTROL_DB_PATH;
			rmSync(tempDir, { recursive: true, force: true });
			vi.resetModules();
		},
	};
}
