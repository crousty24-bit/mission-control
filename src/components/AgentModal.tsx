import { useId, useState, type FormEvent } from 'react'
import type { AgentStatus, CreateAgentInput, LocalAgent, Project } from '../types'

interface AgentModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  agent?: LocalAgent
  selectedProjectId?: string
  projects: Project[]
  onClose: () => void
  onSave: (agent: LocalAgent | CreateAgentInput) => void
}

const agentStatusOptions: AgentStatus[] = ['active', 'idle', 'blocked']

export function AgentModal({
  isOpen,
  agent,
  mode,
  projects,
  selectedProjectId,
  onClose,
  onSave,
}: AgentModalProps) {
  const [form, setForm] = useState(() => ({
    name: agent?.name ?? '',
    role: agent?.role ?? '',
    status: agent?.status ?? ('idle' as AgentStatus),
    currentTask: agent?.currentTask ?? '',
    projectId: agent?.projectId ?? selectedProjectId ?? projects[0]?.id ?? '',
  }))
  const nameId = useId()
  const roleId = useId()
  const statusId = useId()
  const taskId = useId()
  const projectId = useId()

  if (!isOpen) {
    return null
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (mode === 'create') {
      onSave({
        name: form.name.trim(),
        role: form.role.trim(),
        status: form.status,
        currentTask: form.currentTask.trim(),
        projectId: form.projectId,
      })
      onClose()
      return
    }

    if (!agent) {
      return
    }

    onSave({
      ...agent,
      name: form.name.trim(),
      role: form.role.trim(),
      status: form.status,
      currentTask: form.currentTask.trim(),
      projectId: form.projectId,
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="modal-panel modal-panel--narrow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">{mode === 'create' ? 'Nouvel agent' : 'Édition agent'}</p>
            <h3 id="agent-modal-title">
              {mode === 'create' ? 'Ajouter un agent local' : `Gérer le suivi de ${agent?.name}`}
            </h3>
          </div>
          <button type="button" className="button button--ghost" onClick={onClose}>
            Fermer
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label htmlFor={nameId}>
            Nom
            <input
              id={nameId}
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>

          <label htmlFor={roleId}>
            Rôle
            <input
              id={roleId}
              required
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({ ...current, role: event.target.value }))
              }
            />
          </label>

          <label htmlFor={statusId}>
            Statut
            <select
              id={statusId}
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as AgentStatus,
                }))
              }
            >
              {agentStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor={projectId}>
            Projet
            <select
              id={projectId}
              value={form.projectId}
              onChange={(event) =>
                setForm((current) => ({ ...current, projectId: event.target.value }))
              }
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor={taskId} className="modal-form__wide">
            Tâche en cours
            <textarea
              id={taskId}
              required
              rows={3}
              value={form.currentTask}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  currentTask: event.target.value,
                }))
              }
            />
          </label>

          <div className="modal-actions modal-form__wide">
            <button type="button" className="button button--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="button button--primary">
              {mode === 'create' ? 'Ajouter l’agent' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
