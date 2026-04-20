import { getDb } from "../db/connection.js";

function mapProject(row) {
	return {
		id: row.id,
		name: row.name,
		client: row.client,
		stack: JSON.parse(row.stack),
		priority: row.priority,
		status: row.status,
		summary: row.summary,
		milestone: row.milestone,
		orderIndex: row.order_index,
		archivedAt: row.archived_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function buildInClause(projectIds) {
	return projectIds.map(() => "?").join(", ");
}

function listProjectsByArchiveState(archived) {
	const db = getDb();
	const query = archived
		? "SELECT * FROM projects WHERE archived_at IS NOT NULL ORDER BY archived_at DESC, order_index ASC, created_at DESC"
		: "SELECT * FROM projects WHERE archived_at IS NULL ORDER BY order_index ASC, created_at ASC";
	const rows = db.prepare(query).all();
	return rows.map(mapProject);
}

export function listProjects() {
	return listProjectsByArchiveState(false);
}

export function listArchivedProjects() {
	return listProjectsByArchiveState(true);
}

export function getProjectById(projectId) {
	const db = getDb();
	const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
	return row ? mapProject(row) : null;
}

export function getProjectsByIds(projectIds) {
	if (projectIds.length === 0) {
		return [];
	}

	const rows = getDb()
		.prepare(
			`SELECT * FROM projects WHERE id IN (${buildInClause(projectIds)})`,
		)
		.all(...projectIds);
	return rows.map(mapProject);
}

export function insertProject(project) {
	const db = getDb();
	db.prepare(`
    INSERT INTO projects (id, name, client, stack, priority, status, summary, milestone, order_index, archived_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
		project.id,
		project.name,
		project.client,
		JSON.stringify(project.stack),
		project.priority,
		project.status,
		project.summary,
		project.milestone,
		project.orderIndex,
		project.archivedAt,
		project.createdAt,
		project.updatedAt,
	);
}

export function updateProject(projectId, changes) {
	const current = getProjectById(projectId);
	if (!current) {
		return null;
	}

	const nextProject = {
		...current,
		...changes,
		updatedAt: new Date().toISOString(),
	};

	getDb()
		.prepare(`
    UPDATE projects
    SET name = ?, client = ?, stack = ?, priority = ?, status = ?, summary = ?, milestone = ?, order_index = ?, archived_at = ?, updated_at = ?
    WHERE id = ?
  `)
		.run(
			nextProject.name,
			nextProject.client,
			JSON.stringify(nextProject.stack),
			nextProject.priority,
			nextProject.status,
			nextProject.summary,
			nextProject.milestone,
			nextProject.orderIndex,
			nextProject.archivedAt,
			nextProject.updatedAt,
			projectId,
		);

	return getProjectById(projectId);
}

export function deleteProject(projectId) {
	const result = getDb()
		.prepare("DELETE FROM projects WHERE id = ?")
		.run(projectId);
	return result.changes > 0;
}

export function archiveProjects(projectIds, archivedAt) {
	if (projectIds.length === 0) {
		return 0;
	}

	const updatedAt = archivedAt;
	const result = getDb()
		.prepare(
			`UPDATE projects
       SET archived_at = ?, updated_at = ?
       WHERE id IN (${buildInClause(projectIds)})`,
		)
		.run(archivedAt, updatedAt, ...projectIds);

	return result.changes;
}

export function getNextProjectOrderIndex() {
	const row = getDb()
		.prepare(
			"SELECT COALESCE(MAX(order_index), -1) + 1 AS next_order_index FROM projects WHERE archived_at IS NULL",
		)
		.get();
	return row.next_order_index;
}

export function reorderProjects(projectIds) {
	const db = getDb();
	const updateProjectOrder = db.prepare(
		"UPDATE projects SET order_index = ?, updated_at = ? WHERE id = ?",
	);
	const updatedAt = new Date().toISOString();

	db.exec("BEGIN");
	try {
		for (const [index, projectId] of projectIds.entries()) {
			updateProjectOrder.run(index, updatedAt, projectId);
		}
		db.exec("COMMIT");
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
}
