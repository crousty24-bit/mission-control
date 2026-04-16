import { getDb } from '../db/connection.js'

function mapAgent(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    status: row.status,
    currentTask: row.current_task,
    projectId: row.project_id,
    runtime: row.runtime,
    updatedAt: row.updated_at,
  }
}

export function listAgents() {
  const rows = getDb().prepare('SELECT * FROM agents ORDER BY name ASC').all()
  return rows.map(mapAgent)
}

export function getAgentById(agentId) {
  const row = getDb().prepare('SELECT * FROM agents WHERE id = ?').get(agentId)
  return row ? mapAgent(row) : null
}

export function insertAgent(agent) {
  getDb().prepare(`
    INSERT INTO agents (id, name, role, status, current_task, project_id, runtime, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    agent.id,
    agent.name,
    agent.role,
    agent.status,
    agent.currentTask,
    agent.projectId,
    agent.runtime,
    agent.updatedAt,
  )
}

export function updateAgent(agentId, changes) {
  const current = getAgentById(agentId)
  if (!current) {
    return null
  }

  const nextAgent = {
    ...current,
    ...changes,
    updatedAt: new Date().toISOString(),
  }

  getDb().prepare(`
    UPDATE agents
    SET role = ?, status = ?, current_task = ?, project_id = ?, runtime = ?, updated_at = ?
    WHERE id = ?
  `).run(
    nextAgent.role,
    nextAgent.status,
    nextAgent.currentTask,
    nextAgent.projectId,
    nextAgent.runtime,
    nextAgent.updatedAt,
    agentId,
  )

  return getAgentById(agentId)
}
