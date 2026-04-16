import { useState } from 'react'
import { AgentModal } from './AgentModal'
import { IconButton, PencilIcon } from './IconButton'
import type { CreateAgentInput, LocalAgent, Project } from '../types'

interface AgentMonitorProps {
  agents: LocalAgent[]
  selectedProjectId: string
  onToggleAgent: (agentId: string) => void
  onSaveAgent: (agent: LocalAgent) => void
  onCreateAgent: (agent: CreateAgentInput) => void
  projects: Project[]
}

export function AgentMonitor({
  agents,
  selectedProjectId,
  onToggleAgent,
  onSaveAgent,
  onCreateAgent,
  projects,
}: AgentMonitorProps) {
  const [modalState, setModalState] = useState<
    | { mode: 'create' }
    | { mode: 'edit'; agent: LocalAgent }
    | null
  >(null)
  const visibleAgents = agents.filter((agent) => agent.projectId === selectedProjectId)
  const projectNameById = new Map(projects.map((project) => [project.id, project.name]))

  return (
    <section className="section-block">
      <div className="section-heading">
        <div className="section-heading__row">
          <div>
            <p className="eyebrow">Agents locaux</p>
            <h3>Workers liés au projet actif</h3>
            <p className="section-note">Feature en développement.</p>
          </div>
          <button
            type="button"
            className="button button--primary button--compact button--nowrap"
            onClick={() => setModalState({ mode: 'create' })}
          >
            Ajouter un agent
          </button>
        </div>
      </div>

      <div className="agent-list">
        {visibleAgents.map((agent) => (
          <article key={agent.id} className="agent-row">
            <div>
              <div className="agent-row__title">
                <strong>{agent.name}</strong>
                <div className="project-card__icon-actions">
                  <IconButton
                    label={`Modifier ${agent.name}`}
                    icon={<PencilIcon />}
                    onClick={() => setModalState({ mode: 'edit', agent })}
                  />
                  <button
                    type="button"
                    className={`status-badge status-badge--${agent.status}`}
                    onClick={() => onToggleAgent(agent.id)}
                  >
                    {agent.status}
                  </button>
                </div>
              </div>
              <p className="agent-row__role">{agent.role}</p>
            </div>
            <div className="agent-row__detail">
              <span>Projet</span>
              <strong>{projectNameById.get(agent.projectId)}</strong>
            </div>
            <div className="agent-row__detail">
              <span>Tâche en cours</span>
              <p className="agent-row__task">{agent.currentTask}</p>
            </div>
          </article>
        ))}
      </div>
      {modalState ? (
        <AgentModal
          key={modalState.mode === 'edit' ? modalState.agent.id : 'new-agent'}
          isOpen
          mode={modalState.mode}
          agent={modalState.mode === 'edit' ? modalState.agent : undefined}
          selectedProjectId={selectedProjectId}
          projects={projects}
          onClose={() => setModalState(null)}
          onSave={(payload) => {
            if (modalState.mode === 'create') {
              onCreateAgent(payload as CreateAgentInput)
              return
            }

            onSaveAgent(payload as LocalAgent)
          }}
        />
      ) : null}
    </section>
  )
}
