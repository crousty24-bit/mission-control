import { randomUUID } from 'node:crypto'
import { getProjectById, updateProject } from '../repositories/projectsRepository.js'
import {
  deleteTask as removeTask,
  getTaskById,
  insertTask,
  listTasks,
  updateTask,
} from '../repositories/tasksRepository.js'

function syncProjectStatus(projectId) {
  const project = getProjectById(projectId)
  if (!project) {
    return
  }

  const tasks = listTasks(projectId)
  if (tasks.length === 0) {
    return
  }

  const allDone = tasks.every((task) => task.done)
  let nextStatus = project.status

  if (allDone && nextStatus !== 'done') {
    nextStatus = 'done'
  } else if (!allDone && nextStatus === 'done') {
    nextStatus = 'in-progress'
  }

  if (nextStatus !== project.status) {
    updateProject(projectId, { status: nextStatus })
  }
}

export function getTasks(projectId) {
  return listTasks(projectId)
}

export function createTaskRecord(input) {
  if (!getProjectById(input.projectId)) {
    return null
  }

  const timestamp = new Date().toISOString()
  const task = {
    id: randomUUID(),
    title: input.title,
    done: false,
    projectId: input.projectId,
    urgency: input.urgency ?? 'today',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  insertTask(task)
  syncProjectStatus(task.projectId)
  return getTaskById(task.id)
}

export function patchTask(taskId, changes) {
  const current = getTaskById(taskId)
  if (!current) {
    return null
  }

  if (changes.projectId && !getProjectById(changes.projectId)) {
    return null
  }

  const nextTask = updateTask(taskId, {
    title: changes.title ?? current.title,
    done: changes.done ?? current.done,
    projectId: changes.projectId ?? current.projectId,
    urgency: changes.urgency ?? current.urgency,
  })
  syncProjectStatus(nextTask.projectId)
  return nextTask
}

export function deleteTask(taskId) {
  const current = getTaskById(taskId)
  if (!current) {
    return false
  }

  const deleted = removeTask(taskId)
  if (deleted) {
    syncProjectStatus(current.projectId)
  }

  return deleted
}

export function getCompletionRate() {
  const tasks = listTasks()
  if (tasks.length === 0) {
    return 0
  }

  const doneCount = tasks.filter((task) => task.done).length
  return Math.round((doneCount / tasks.length) * 100)
}
