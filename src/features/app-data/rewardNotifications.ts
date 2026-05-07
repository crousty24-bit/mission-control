import type { UserSnapshot } from "../../types";
import type { RewardNotification } from "./context";

export function createRewardNotifications(
	previousSnapshot: UserSnapshot | null,
	nextSnapshot: UserSnapshot,
): RewardNotification[] {
	if (!previousSnapshot) {
		return [];
	}

	const notifications: RewardNotification[] = [];
	if (
		nextSnapshot.streakLastRewardedAt &&
		nextSnapshot.streakLastRewardedAt !== previousSnapshot.streakLastRewardedAt
	) {
		notifications.push({
			id: `streak-${nextSnapshot.streakLastRewardedAt}`,
			type: "streak",
			message: `Bravo ! Tu totalises +${nextSnapshot.streakCount} jours de streak consécutifs.`,
		});
	}

	const medalsRewardDelta =
		nextSnapshot.medalsRewardCount - previousSnapshot.medalsRewardCount;
	if (medalsRewardDelta === 1) {
		notifications.push({
			id: `medals-${nextSnapshot.medalsRewardCount}-${Date.now()}`,
			type: "medals",
			message: "Bravo ! Tu as terminé un projet, continue comme ça.",
		});
	} else if (medalsRewardDelta > 1) {
		notifications.push({
			id: `medals-${nextSnapshot.medalsRewardCount}-${Date.now()}`,
			type: "medals",
			message: `Bravo ! Tu as terminé ${medalsRewardDelta} projets, continue comme ça.`,
		});
	}

	return notifications;
}
