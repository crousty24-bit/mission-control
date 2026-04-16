import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { createMissionControlDataSource } from '../../api/createDataSource'
import { AppDataContext, emptySnapshot, type AppDataContextValue } from './context'
import type {
  LocalAgent,
  ProjectWithProgress,
  TaskItem,
  UserSnapshot,
} from '../../types'

export function AppDataProvider({ children }: PropsWithChildren) {
  const dataSource = useMemo(() => createMissionControlDataSource(), [])
  const [projects, setProjects] = useState<ProjectWithProgress[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [agents, setAgents] = useState<LocalAgent[]>([])
  const [snapshot, setSnapshot] = useState<UserSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)

    const [projectsData, tasksData, agentsData, snapshotData] = await Promise.all([
      dataSource.getProjects(),
      dataSource.getTasks(),
      dataSource.getAgents(),
      dataSource.getUserSnapshot(),
    ])

    setProjects(projectsData)
    setTasks(tasksData)
    setAgents(agentsData)
    setSnapshot(snapshotData)
  }, [dataSource])

  const getLoadErrorMessage = useCallback(() => {
    if (dataSource.mode === 'tauri') {
      return "Desktop data source failed. Vérifie que Mission Control Desktop est lancé correctement."
    }

    return "Request failed. Vérifie que l'API locale Mission Control est lancée."
  }, [dataSource])

  useEffect(() => {
    let isMounted = true

    setIsLoading(true)
    reload()
      .catch((reason: unknown) => {
        if (!isMounted) {
          return
        }

        const message = reason instanceof Error ? reason.message : 'Chargement impossible'
        setError(getLoadErrorMessage())
        console.error(`${dataSource.label} load error:`, message)
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [dataSource, getLoadErrorMessage, reload])

  const runMutation = useCallback(async <T,>(callback: () => Promise<T>) => {
    setIsMutating(true)
    setError(null)

    try {
      const result = await callback()
      await reload()
      return result
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Mutation impossible'
      setError(getLoadErrorMessage())
      console.error(`${dataSource.label} mutation error:`, message)
      throw reason
    } finally {
      setIsMutating(false)
    }
  }, [dataSource, getLoadErrorMessage, reload])

  const value = useMemo<AppDataContextValue>(
    () => ({
      agents,
      dataSourceLabel: dataSource.label,
      dataSourceMode: dataSource.mode,
      error,
      isLoading,
      isMutating,
      projects,
      reload,
      snapshot: snapshot ?? emptySnapshot,
      tasks,
      createProject: (input) => runMutation(() => dataSource.createProject(input)),
      updateProject: (projectId, input) =>
        runMutation(() => dataSource.updateProject(projectId, input)),
      deleteProject: (projectId) => runMutation(() => dataSource.deleteProject(projectId)),
      createTask: (input) => runMutation(() => dataSource.createTask(input)),
      updateTask: (taskId, input) => runMutation(() => dataSource.updateTask(taskId, input)),
      deleteTask: (taskId) => runMutation(() => dataSource.deleteTask(taskId)),
      createAgent: (input) => runMutation(() => dataSource.createAgent(input)),
      updateAgent: (agentId, input) => runMutation(() => dataSource.updateAgent(agentId, input)),
      updateUserSnapshot: (input) => runMutation(() => dataSource.updateUserSnapshot(input)),
    }),
    [agents, dataSource, error, isLoading, isMutating, projects, reload, runMutation, snapshot, tasks],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
