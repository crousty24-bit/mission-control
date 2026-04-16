import { getDb } from '../db/connection.js'

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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listProjects() {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM projects ORDER BY created_at ASC').all()
  return rows.map(mapProject)
}

export function getProjectById(projectId) {
  const db = getDb()
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId)
  return row ? mapProject(row) : null
}

export function insertProject(project) {
  const db = getDb()
  db.prepare(`
    INSERT INTO projects (id, name, client, stack, priority, status, summary, milestone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    project.id,
    project.name,
    project.client,
    JSON.stringify(project.stack),
    project.priority,
    project.status,
    project.summary,
    project.milestone,
    project.createdAt,
    project.updatedAt,
  )
}

export function updateProject(projectId, changes) {
  const current = getProjectById(projectId)
  if (!current) {
    return null
  }

  const nextProject = {
    ...current,
    ...changes,
    updatedAt: new Date().toISOString(),
  }

  getDb().prepare(`
    UPDATE projects
    SET name = ?, client = ?, stack = ?, priority = ?, status = ?, summary = ?, milestone = ?, updated_at = ?
    WHERE id = ?
  `).run(
    nextProject.name,
    nextProject.client,
    JSON.stringify(nextProject.stack),
    nextProject.priority,
    nextProject.status,
    nextProject.summary,
    nextProject.milestone,
    nextProject.updatedAt,
    projectId,
  )

  return getProjectById(projectId)
}

export function deleteProject(projectId) {
  const result = getDb().prepare('DELETE FROM projects WHERE id = ?').run(projectId)
  return result.changes > 0
}
