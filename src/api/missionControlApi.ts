import { request } from './http'
import type { MissionControlDataSource } from './dataSource'
import type {
  CreateAgentInput,
  CreateProjectInput,
  CreateTaskInput,
  UpdateAgentInput,
  UpdateProjectInput,
  UpdateTaskInput,
  UpdateUserSnapshotInput,
} from '../types'

function getTasksUrl(projectId?: string) {
  return projectId ? `/api/tasks?projectId=${projectId}` : '/api/tasks'
}

export const httpDataSource: MissionControlDataSource = {
  mode: 'http',
  label: 'Mission Control API locale',
  getProjects: () => request('/api/projects'),
  createProject: (input: CreateProjectInput) =>
    request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateProject: (projectId: string, input: UpdateProjectInput) =>
    request(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  deleteProject: (projectId: string) =>
    request(`/api/projects/${projectId}`, {
      method: 'DELETE',
    }).then(() => undefined),
  getTasks: (projectId?: string) => request(getTasksUrl(projectId)),
  createTask: (input: CreateTaskInput) =>
    request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateTask: (taskId: string, input: UpdateTaskInput) =>
    request(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  deleteTask: (taskId: string) =>
    request(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    }).then(() => undefined),
  getAgents: () => request('/api/agents'),
  createAgent: (input: CreateAgentInput) =>
    request('/api/agents', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateAgent: (agentId: string, input: UpdateAgentInput) =>
    request(`/api/agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  getUserSnapshot: () => request('/api/user-snapshot'),
  updateUserSnapshot: (input: UpdateUserSnapshotInput) =>
    request('/api/user-snapshot', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
}
