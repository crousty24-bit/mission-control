import { randomUUID } from "node:crypto";
import { getDb } from "./connection.js";
import {
	seedAgents,
	seedProjects,
	seedSnapshot,
	seedTasks,
} from "./seedData.js";

function now() {
	return new Date().toISOString();
}

function ensureColumn(db, tableName, columnName, definition) {
	const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
	const hasColumn = columns.some((column) => column.name === columnName);
	if (!hasColumn) {
		db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
	}

	return !hasColumn;
}

function hydrateProjectOrderIndex(db) {
	const projects = db
		.prepare(
			"SELECT id FROM projects WHERE archived_at IS NULL ORDER BY created_at ASC, id ASC",
		)
		.all();
	const updateOrder = db.prepare(
		"UPDATE projects SET order_index = ? WHERE id = ?",
	);

	db.exec("BEGIN");
	try {
		for (const [index, project] of projects.entries()) {
			updateOrder.run(index, project.id);
		}
		db.exec("COMMIT");
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
}

function hydrateTaskOrderIndex(db) {
	const tasks = db
		.prepare(
			"SELECT id, project_id FROM tasks ORDER BY project_id ASC, created_at ASC, id ASC",
		)
		.all();
	const updateOrder = db.prepare(
		"UPDATE tasks SET order_index = ? WHERE id = ?",
	);
	db.exec("BEGIN");
	try {
		const orderByProject = new Map();
		for (const task of tasks) {
			const nextIndex = orderByProject.get(task.project_id) ?? 0;
			updateOrder.run(nextIndex, task.id);
			orderByProject.set(task.project_id, nextIndex + 1);
		}
		db.exec("COMMIT");
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
}

export function initDatabase() {
	const db = getDb();

	db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client TEXT NOT NULL,
      stack TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT NOT NULL,
      milestone TEXT NOT NULL,
      task_order_customized INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      archived_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      project_id TEXT NOT NULL,
      urgency TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      current_task TEXT NOT NULL,
      project_id TEXT NOT NULL,
      runtime TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_snapshot (
      id TEXT PRIMARY KEY,
      developer TEXT NOT NULL,
      sprint TEXT NOT NULL,
      focus_score INTEGER NOT NULL,
      next_deadline TEXT NOT NULL,
      streak_count INTEGER NOT NULL DEFAULT 0,
      streak_last_rewarded_at TEXT,
      streak_cycle_started_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      kind TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_notes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

	ensureColumn(db, "projects", "archived_at", "TEXT");
	ensureColumn(
		db,
		"projects",
		"task_order_customized",
		"INTEGER NOT NULL DEFAULT 0",
	);
	const addedProjectOrderColumn = ensureColumn(
		db,
		"projects",
		"order_index",
		"INTEGER NOT NULL DEFAULT 0",
	);
	const addedTaskOrderColumn = ensureColumn(
		db,
		"tasks",
		"order_index",
		"INTEGER NOT NULL DEFAULT 0",
	);
	ensureColumn(
		db,
		"user_snapshot",
		"streak_count",
		"INTEGER NOT NULL DEFAULT 0",
	);
	ensureColumn(db, "user_snapshot", "streak_last_rewarded_at", "TEXT");
	ensureColumn(db, "user_snapshot", "streak_cycle_started_at", "TEXT");

	if (addedProjectOrderColumn) {
		hydrateProjectOrderIndex(db);
	}

	if (addedTaskOrderColumn) {
		hydrateTaskOrderIndex(db);
	}

	const noteCount = db
		.prepare("SELECT COUNT(*) AS count FROM dashboard_notes")
		.get().count;
	if (noteCount === 0) {
		db.prepare(
			"INSERT INTO dashboard_notes (id, content, updated_at) VALUES (?, ?, ?)",
		).run("dashboard-note", "", now());
	}

	const projectCount = db
		.prepare("SELECT COUNT(*) AS count FROM projects")
		.get().count;
	if (projectCount > 0) {
		return;
	}

	const projectStmt = db.prepare(`
    INSERT INTO projects (id, name, client, stack, priority, status, summary, milestone, order_index, archived_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

	const taskStmt = db.prepare(`
    INSERT INTO tasks (id, title, done, project_id, urgency, order_index, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

	const agentStmt = db.prepare(`
    INSERT INTO agents (id, name, role, status, current_task, project_id, runtime, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

	const snapshotStmt = db.prepare(`
    INSERT INTO user_snapshot (id, developer, sprint, focus_score, next_deadline, streak_count, streak_last_rewarded_at, streak_cycle_started_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

	const timestamp = now();

	for (const [index, project] of seedProjects.entries()) {
		projectStmt.run(
			project.id,
			project.name,
			project.client,
			JSON.stringify(project.stack),
			project.priority,
			project.status,
			project.summary,
			project.milestone,
			index,
			null,
			timestamp,
			timestamp,
		);
	}

	const taskOrderByProject = new Map();
	for (const task of seedTasks) {
		const nextIndex = taskOrderByProject.get(task.projectId) ?? 0;
		taskStmt.run(
			task.id,
			task.title,
			task.done,
			task.projectId,
			task.urgency,
			nextIndex,
			timestamp,
			timestamp,
		);
		taskOrderByProject.set(task.projectId, nextIndex + 1);
	}

	for (const agent of seedAgents) {
		agentStmt.run(
			agent.id,
			agent.name,
			agent.role,
			agent.status,
			agent.currentTask,
			agent.projectId,
			agent.runtime,
			timestamp,
		);
	}

	snapshotStmt.run(
		randomUUID(),
		seedSnapshot.developer,
		seedSnapshot.sprint,
		seedSnapshot.focusScore,
		seedSnapshot.nextDeadline,
		seedSnapshot.streakCount,
		null,
		null,
		timestamp,
	);
}
