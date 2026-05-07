import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupTestDatabase } from "../test-utils/database.js";

let cleanupDatabase;
let streakService;
let userSnapshotRepository;

beforeEach(async () => {
	const database = await setupTestDatabase();
	cleanupDatabase = database.cleanup;
	streakService = await import("./streakService.js");
	userSnapshotRepository = await import(
		"../repositories/userSnapshotRepository.js"
	);
});

afterEach(async () => {
	await cleanupDatabase?.();
	cleanupDatabase = undefined;
});

describe("streakService", () => {
	it("rewards at most once per local day", () => {
		const firstReward = streakService.rewardDailyStreakIfNeeded(
			new Date("2026-05-07T09:00:00"),
		);
		const secondReward = streakService.rewardDailyStreakIfNeeded(
			new Date("2026-05-07T18:00:00"),
		);

		expect(firstReward.streakCount).toBe(1);
		expect(secondReward.streakCount).toBe(1);
	});

	it("resets expired or invalid streak cycles", () => {
		userSnapshotRepository.updateUserSnapshot({
			streakCount: 4,
			streakLastRewardedAt: "2026-05-01T09:00:00.000Z",
			streakCycleStartedAt: "invalid-date",
		});

		expect(
			streakService.resetExpiredStreakIfNeeded(
				new Date("2026-05-07T09:00:00.000Z"),
			),
		).toMatchObject({
			streakCount: 0,
			streakLastRewardedAt: null,
			streakCycleStartedAt: null,
		});

		userSnapshotRepository.updateUserSnapshot({
			streakCount: 4,
			streakLastRewardedAt: "2026-05-01T09:00:00.000Z",
			streakCycleStartedAt: "2026-05-01T09:00:00.000Z",
		});

		expect(
			streakService.resetExpiredStreakIfNeeded(
				new Date("2026-05-09T09:00:01.000Z"),
			),
		).toMatchObject({
			streakCount: 0,
			streakLastRewardedAt: null,
			streakCycleStartedAt: null,
		});
	});
});
