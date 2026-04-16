import { createAgentRecord, patchAgent, getAgents } from '../services/agentService.js'
import { createProject, deleteProject, getProjectsView, patchProject } from '../services/projectService.js'
import { createTaskRecord, deleteTask, getTasks, patchTask } from '../services/taskService.js'
import { getUserSnapshotView, patchUserSnapshot } from '../services/userSnapshotService.js'
import { readJsonBody, sendJson, sendText } from '../utils/http.js'

function matchProjectPath(pathname) {
  return pathname.match(/^\/api\/projects\/([^/]+)$/)
}

function matchTaskPath(pathname) {
  return pathname.match(/^\/api\/tasks\/([^/]+)$/)
}

function matchAgentPath(pathname) {
  return pathname.match(/^\/api\/agents\/([^/]+)$/)
}

export async function handleApiRequest(request, response, url) {
  if (request.method === 'OPTIONS') {
    sendText(response, 204, '')
    return true
  }

  if (request.method === 'GET' && url.pathname === '/api/projects') {
    sendJson(response, 200, getProjectsView())
    return true
  }

  if (request.method === 'POST' && url.pathname === '/api/projects') {
    const payload = await readJsonBody(request)
    const project = createProject(payload)
    sendJson(response, 201, project)
    return true
  }

  const projectMatch = matchProjectPath(url.pathname)
  if (projectMatch && request.method === 'PATCH') {
    const project = patchProject(projectMatch[1], await readJsonBody(request))
    if (!project) {
      sendText(response, 404, 'Project not found')
      return true
    }

    sendJson(response, 200, project)
    return true
  }

  if (projectMatch && request.method === 'DELETE') {
    const deleted = deleteProject(projectMatch[1])
    if (!deleted) {
      sendText(response, 404, 'Project not found')
      return true
    }

    sendText(response, 204, '')
    return true
  }

  if (request.method === 'GET' && url.pathname === '/api/tasks') {
    const projectId = url.searchParams.get('projectId') ?? undefined
    sendJson(response, 200, getTasks(projectId))
    return true
  }

  if (request.method === 'POST' && url.pathname === '/api/tasks') {
    const task = createTaskRecord(await readJsonBody(request))
    if (!task) {
      sendText(response, 404, 'Project not found')
      return true
    }

    sendJson(response, 201, task)
    return true
  }

  const taskMatch = matchTaskPath(url.pathname)
  if (taskMatch && request.method === 'PATCH') {
    const task = patchTask(taskMatch[1], await readJsonBody(request))
    if (!task) {
      sendText(response, 404, 'Task not found')
      return true
    }

    sendJson(response, 200, task)
    return true
  }

  if (taskMatch && request.method === 'DELETE') {
    const deleted = deleteTask(taskMatch[1])
    if (!deleted) {
      sendText(response, 404, 'Task not found')
      return true
    }

    sendText(response, 204, '')
    return true
  }

  if (request.method === 'GET' && url.pathname === '/api/agents') {
    sendJson(response, 200, getAgents())
    return true
  }

  if (request.method === 'POST' && url.pathname === '/api/agents') {
    const agent = createAgentRecord(await readJsonBody(request))
    if (!agent) {
      sendText(response, 404, 'Project not found')
      return true
    }

    sendJson(response, 201, agent)
    return true
  }

  const agentMatch = matchAgentPath(url.pathname)
  if (agentMatch && request.method === 'PATCH') {
    const agent = patchAgent(agentMatch[1], await readJsonBody(request))
    if (!agent) {
      sendText(response, 404, 'Agent or project not found')
      return true
    }

    sendJson(response, 200, agent)
    return true
  }

  if (request.method === 'GET' && url.pathname === '/api/user-snapshot') {
    sendJson(response, 200, getUserSnapshotView())
    return true
  }

  if (request.method === 'PATCH' && url.pathname === '/api/user-snapshot') {
    const snapshot = patchUserSnapshot(await readJsonBody(request))
    if (!snapshot) {
      sendText(response, 404, 'Snapshot not found')
      return true
    }

    sendJson(response, 200, snapshot)
    return true
  }

  return false
}
