import { getDb } from "../db/connection.js";

function mapSnapshot(row) {
	return {
		id: row.id,
		developer: row.developer,
		sprint: row.sprint,
		focusScore: row.focus_score,
		nextDeadline: row.next_deadline,
		updatedAt: row.updated_at,
	};
}

export function getUserSnapshotRecord() {
	const row = getDb().prepare("SELECT * FROM user_snapshot LIMIT 1").get();
	return row ? mapSnapshot(row) : null;
}

export function updateUserSnapshot(changes) {
	const current = getUserSnapshotRecord();
	if (!current) {
		return null;
	}

	const nextSnapshot = {
		...current,
		...changes,
		updatedAt: new Date().toISOString(),
	};

	getDb()
		.prepare(`
    UPDATE user_snapshot
    SET developer = ?, sprint = ?, focus_score = ?, next_deadline = ?, updated_at = ?
    WHERE id = ?
  `)
		.run(
			nextSnapshot.developer,
			current.sprint,
			current.focusScore,
			nextSnapshot.nextDeadline,
			nextSnapshot.updatedAt,
			current.id,
		);

	return getUserSnapshotRecord();
}
