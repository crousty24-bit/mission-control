import { useAppData } from '../app-data/useAppData'
import type { CreateProjectInput, ProjectStatus, ProjectPriority, UpdateProjectInput } from '../../types'

export function useProjects() {
  const { projects, isLoading, error } = useAppData()
  return { projects, isLoading, error }
}

export function useCreateProject() {
  const { createProject, isMutating } = useAppData()
  return { createProject, isMutating }
}

export function useUpdateProject() {
  const { updateProject, isMutating } = useAppData()
  return { updateProject, isMutating }
}

export function useProjectActions() {
  const { createProject, deleteProject, updateProject, isMutating } = useAppData()

  return {
    isMutating,
    createProject,
    editProject: (projectId: string, input: UpdateProjectInput) =>
      updateProject(projectId, input),
    deleteProject: (projectId: string) => deleteProject(projectId),
    updateProjectStatus: (projectId: string, status: ProjectStatus) =>
      updateProject(projectId, { status }),
    updateProjectPriority: (projectId: string, priority: ProjectPriority) =>
      updateProject(projectId, { priority }),
  }
}

export type { CreateProjectInput }
