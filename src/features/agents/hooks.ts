import { useAppData } from '../app-data/useAppData'
import type { AgentStatus, CreateAgentInput, LocalAgent } from '../../types'

export function useAgents(projectId?: string) {
  const { agents, isLoading, error } = useAppData()
  return {
    agents: projectId ? agents.filter((agent) => agent.projectId === projectId) : agents,
    isLoading,
    error,
  }
}

export function useAgentActions() {
  const { agents, createAgent, updateAgent, isMutating } = useAppData()

  return {
    isMutating,
    createAgent: (input: CreateAgentInput) => createAgent(input),
    saveAgent: (agent: LocalAgent) =>
      updateAgent(agent.id, {
        role: agent.role,
        status: agent.status,
        currentTask: agent.currentTask,
        projectId: agent.projectId,
      }),
    toggleAgentStatus: async (agentId: string) => {
      const agent = agents.find((item) => item.id === agentId)
      if (!agent) {
        throw new Error('Agent not found')
      }

      const nextStatus: AgentStatus = agent.status === 'active' ? 'idle' : 'active'
      return updateAgent(agentId, { status: nextStatus })
    },
  }
}
