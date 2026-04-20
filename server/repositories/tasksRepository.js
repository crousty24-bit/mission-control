import { getDb } from "../db/connection.js";

function mapTask(row) {
	return {
		id: row.id,
		title: row.title,
		done: Boolean(row.done),
		projectId: row.project_id,
		urgency: row.urgency,
		orderIndex: row.order_index,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export function listTasks(projectId) {
	const db = getDb();
	const rows = projectId
		? db
				.prepare(
					`SELECT tasks.*
					 FROM tasks
					 JOIN projects ON projects.id = tasks.project_id
					 WHERE tasks.project_id = ?
					 ORDER BY
					 	CASE
					 		WHEN COALESCE(projects.task_order_customized, 0) = 0 THEN tasks.done
					 		ELSE 0
					 	END ASC,
					 	tasks.order_index ASC,
					 	tasks.created_at ASC`,
				)
				.all(projectId)
		: db
				.prepare(
					`SELECT tasks.*
					 FROM tasks
					 JOIN projects ON projects.id = tasks.project_id
					 ORDER BY
					 	tasks.project_id ASC,
					 	CASE
					 		WHEN COALESCE(projects.task_order_customized, 0) = 0 THEN tasks.done
					 		ELSE 0
					 	END ASC,
					 	tasks.order_index ASC,
					 	tasks.created_at ASC`,
				)
				.all();
	return rows.map(mapTask);
}

export function getTaskById(taskId) {
	const row = getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
	return row ? mapTask(row) : null;
}

export function insertTask(task) {
	const db = getDb();
	const shiftTaskOrderIndexes = db.prepare(`
    UPDATE tasks
    SET order_index = order_index + 1, updated_at = ?
    WHERE project_id = ? AND order_index >= ?
  `);
	const insertTaskStatement = db.prepare(`
    INSERT INTO tasks (id, title, done, project_id, urgency, order_index, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

	db.exec("BEGIN");
	try {
		shiftTaskOrderIndexes.run(task.updatedAt, task.projectId, task.orderIndex);
		insertTaskStatement.run(
			task.id,
			task.title,
			task.done ? 1 : 0,
			task.projectId,
			task.urgency,
			task.orderIndex,
			task.createdAt,
			task.updatedAt,
		);
		db.exec("COMMIT");
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
}

export function updateTask(taskId, changes) {
	const current = getTaskById(taskId);
	if (!current) {
		return null;
	}

	const nextProjectId = changes.projectId ?? current.projectId;
	const nextOrderIndex =
		nextProjectId !== current.projectId
			? getNextTaskOrderIndex(nextProjectId)
			: current.orderIndex;

	const nextTask = {
		...current,
		...changes,
		projectId: nextProjectId,
		orderIndex: nextOrderIndex,
		updatedAt: new Date().toISOString(),
	};

	getDb()
		.prepare(`
    UPDATE tasks
    SET title = ?, done = ?, project_id = ?, urgency = ?, order_index = ?, updated_at = ?
    WHERE id = ?
  `)
		.run(
			nextTask.title,
			nextTask.done ? 1 : 0,
			nextTask.projectId,
			nextTask.urgency,
			nextTask.orderIndex,
			nextTask.updatedAt,
			taskId,
		);

	return getTaskById(taskId);
}

export function deleteTask(taskId) {
	const result = getDb().prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
	return result.changes > 0;
}

export function getNextTaskOrderIndex(projectId) {
	const row = getDb()
		.prepare(
			"SELECT COALESCE(MAX(order_index), -1) + 1 AS next_order_index FROM tasks WHERE project_id = ?",
		)
		.get(projectId);
	return row.next_order_index;
}

export function reorderTasks(projectId, taskIds) {
	const db = getDb();
	const updateTaskOrder = db.prepare(
		"UPDATE tasks SET order_index = ?, updated_at = ? WHERE id = ? AND project_id = ?",
	);
	const markProjectTaskOrderCustomized = db.prepare(
		"UPDATE projects SET task_order_customized = 1, updated_at = ? WHERE id = ?",
	);
	const updatedAt = new Date().toISOString();

	db.exec("BEGIN");
	try {
		for (const [index, taskId] of taskIds.entries()) {
			updateTaskOrder.run(index, updatedAt, taskId, projectId);
		}
		markProjectTaskOrderCustomized.run(updatedAt, projectId);
		db.exec("COMMIT");
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
}
