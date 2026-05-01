import {
	getUserSnapshotRecord,
	updateUserSnapshot,
} from "../repositories/userSnapshotRepository.js";

const streakCycleLengthMs = 7 * 24 * 60 * 60 * 1000;

function isSameLocalDay(firstDate, secondDate) {
	return (
		firstDate.getFullYear() === secondDate.getFullYear() &&
		firstDate.getMonth() === secondDate.getMonth() &&
		firstDate.getDate() === secondDate.getDate()
	);
}

function getResetSnapshot(snapshot, now) {
	if (!snapshot.streakCycleStartedAt) {
		return snapshot;
	}

	const cycleStartedAt = new Date(snapshot.streakCycleStartedAt);
	if (Number.isNaN(cycleStartedAt.getTime())) {
		return {
			...snapshot,
			streakCount: 0,
			streakLastRewardedAt: null,
			streakCycleStartedAt: null,
		};
	}

	if (now.getTime() - cycleStartedAt.getTime() < streakCycleLengthMs) {
		return snapshot;
	}

	return {
		...snapshot,
		streakCount: 0,
		streakLastRewardedAt: null,
		streakCycleStartedAt: null,
	};
}

export function resetExpiredStreakIfNeeded(now = new Date()) {
	const snapshot = getUserSnapshotRecord();
	if (!snapshot) {
		return null;
	}

	const nextSnapshot = getResetSnapshot(snapshot, now);
	if (nextSnapshot === snapshot) {
		return snapshot;
	}

	return updateUserSnapshot(nextSnapshot);
}

export function rewardDailyStreakIfNeeded(now = new Date()) {
	const snapshot = resetExpiredStreakIfNeeded(now);
	if (!snapshot) {
		return null;
	}

	const lastRewardedAt = snapshot.streakLastRewardedAt
		? new Date(snapshot.streakLastRewardedAt)
		: null;
	if (
		lastRewardedAt &&
		!Number.isNaN(lastRewardedAt.getTime()) &&
		isSameLocalDay(lastRewardedAt, now)
	) {
		return snapshot;
	}

	const timestamp = now.toISOString();
	return updateUserSnapshot({
		...snapshot,
		streakCount: snapshot.streakCount + 1,
		streakLastRewardedAt: timestamp,
		streakCycleStartedAt: snapshot.streakCycleStartedAt ?? timestamp,
	});
}
