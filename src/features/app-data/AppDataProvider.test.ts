import { describe, expect, it, vi } from "vitest";
import type { UserSnapshot } from "../../types";
import { createRewardNotifications } from "./rewardNotifications";

function createSnapshot(overrides: Partial<UserSnapshot> = {}): UserSnapshot {
	return {
		developer: "Allen",
		activeProjects: 1,
		completedTasks: 0,
		remainingTasks: 1,
		nextDeadline: "Sans échéance",
		completionRate: 0,
		streakCount: 0,
		streakLastRewardedAt: null,
		medalsRewardCount: 0,
		...overrides,
	};
}

describe("createRewardNotifications", () => {
	it("does not notify on initial load", () => {
		expect(createRewardNotifications(null, createSnapshot())).toEqual([]);
	});

	it("creates streak notification when the rewarded date changes", () => {
		const notifications = createRewardNotifications(
			createSnapshot(),
			createSnapshot({
				streakCount: 2,
				streakLastRewardedAt: "2026-05-07T09:00:00.000Z",
			}),
		);

		expect(notifications).toEqual([
			expect.objectContaining({
				id: "streak-2026-05-07T09:00:00.000Z",
				type: "streak",
			}),
		]);
	});

	it("creates medal notifications from positive archive deltas", () => {
		vi.spyOn(Date, "now").mockReturnValue(1234);

		expect(
			createRewardNotifications(
				createSnapshot({ medalsRewardCount: 1 }),
				createSnapshot({ medalsRewardCount: 3 }),
			),
		).toEqual([
			expect.objectContaining({
				id: "medals-3-1234",
				type: "medals",
				message: "Bravo ! Tu as terminé 2 projets, continue comme ça.",
			}),
		]);
	});
});
