import { getDb } from "../db/connection.js";

function mapTask(row) {
	return {
		id: row.id,
		title: row.title,
		done: Boolean(row.done),
		projectId: row.project_id,
		urgency: row.urgency,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export function listTasks(projectId) {
	const db = getDb();
	const rows = projectId
		? db
				.prepare(
					"SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC",
				)
				.all(projectId)
		: db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
	return rows.map(mapTask);
}

export function getTaskById(taskId) {
	const row = getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
	return row ? mapTask(row) : null;
}

export function insertTask(task) {
	getDb()
		.prepare(`
    INSERT INTO tasks (id, title, done, project_id, urgency, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
		.run(
			task.id,
			task.title,
			task.done ? 1 : 0,
			task.projectId,
			task.urgency,
			task.createdAt,
			task.updatedAt,
		);
}

export function updateTask(taskId, changes) {
	const current = getTaskById(taskId);
	if (!current) {
		return null;
	}

	const nextTask = {
		...current,
		...changes,
		updatedAt: new Date().toISOString(),
	};

	getDb()
		.prepare(`
    UPDATE tasks
    SET title = ?, done = ?, project_id = ?, urgency = ?, updated_at = ?
    WHERE id = ?
  `)
		.run(
			nextTask.title,
			nextTask.done ? 1 : 0,
			nextTask.projectId,
			nextTask.urgency,
			nextTask.updatedAt,
			taskId,
		);

	return getTaskById(taskId);
}

export function deleteTask(taskId) {
	const result = getDb().prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
	return result.changes > 0;
}
