import { randomUUID } from 'node:crypto'
import {
  deleteProject as removeProject,
  insertProject,
  getProjectById,
  listProjects,
  updateProject,
} from '../repositories/projectsRepository.js'
import { listTasks } from '../repositories/tasksRepository.js'

function getProjectProgress(projectId, tasks) {
  const relatedTasks = tasks.filter((task) => task.projectId === projectId)
  if (relatedTasks.length === 0) {
    return 0
  }

  const doneCount = relatedTasks.filter((task) => task.done).length
  return Math.round((doneCount / relatedTasks.length) * 100)
}

export function getProjectsView() {
  const tasks = listTasks()
  return listProjects().map((project) => {
    const progress = getProjectProgress(project.id, tasks)
    return {
      ...project,
      progress,
      status: project.status,
    }
  })
}

export function getProjectView(projectId) {
  return getProjectsView().find((project) => project.id === projectId) ?? null
}

export function createProject(input) {
  const timestamp = new Date().toISOString()
  const name = input.name.trim().slice(0, 20)
  const summary = input.summary?.trim().slice(0, 96)
  const project = {
    id: randomUUID(),
    name,
    client: input.client?.trim() || 'Projet personnel',
    stack: input.stack ?? [],
    priority: input.priority,
    status: input.status,
    summary: summary || 'Aucun résumé pour le moment.',
    milestone: input.milestone?.trim() || 'Sans échéance définie',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  insertProject(project)
  return getProjectView(project.id)
}

export function patchProject(projectId, changes) {
  const current = getProjectById(projectId)
  if (!current) {
    return null
  }

  const nextName = changes.name === undefined ? current.name : changes.name.trim().slice(0, 20)
  const nextSummary = changes.summary === undefined
    ? current.summary
    : (changes.summary.trim().slice(0, 96) || 'Aucun résumé pour le moment.')

  updateProject(projectId, {
    name: nextName,
    client: changes.client === undefined ? current.client : (changes.client.trim() || 'Projet personnel'),
    stack: changes.stack ?? current.stack,
    priority: changes.priority ?? current.priority,
    status: changes.status ?? current.status,
    summary: nextSummary,
    milestone: changes.milestone === undefined ? current.milestone : (changes.milestone.trim() || 'Sans échéance définie'),
  })

  return getProjectView(projectId)
}

export function deleteProject(projectId) {
  if (!getProjectById(projectId)) {
    return false
  }

  return removeProject(projectId)
}
