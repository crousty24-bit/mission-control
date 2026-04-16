import { randomUUID } from 'node:crypto'
import { getDb } from './connection.js'
import { seedAgents, seedProjects, seedSnapshot, seedTasks } from './seedData.js'

function now() {
  return new Date().toISOString()
}

export function initDatabase() {
  const db = getDb()

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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      project_id TEXT NOT NULL,
      urgency TEXT NOT NULL,
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
      updated_at TEXT NOT NULL
    );
  `)

  const projectCount = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count
  if (projectCount > 0) {
    return
  }

  const projectStmt = db.prepare(`
    INSERT INTO projects (id, name, client, stack, priority, status, summary, milestone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const taskStmt = db.prepare(`
    INSERT INTO tasks (id, title, done, project_id, urgency, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const agentStmt = db.prepare(`
    INSERT INTO agents (id, name, role, status, current_task, project_id, runtime, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const snapshotStmt = db.prepare(`
    INSERT INTO user_snapshot (id, developer, sprint, focus_score, next_deadline, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const timestamp = now()

  for (const project of seedProjects) {
    projectStmt.run(
      project.id,
      project.name,
      project.client,
      JSON.stringify(project.stack),
      project.priority,
      project.status,
      project.summary,
      project.milestone,
      timestamp,
      timestamp,
    )
  }

  for (const task of seedTasks) {
    taskStmt.run(
      task.id,
      task.title,
      task.done,
      task.projectId,
      task.urgency,
      timestamp,
      timestamp,
    )
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
    )
  }

  snapshotStmt.run(
    randomUUID(),
    seedSnapshot.developer,
    seedSnapshot.sprint,
    seedSnapshot.focusScore,
    seedSnapshot.nextDeadline,
    timestamp,
  )
}
