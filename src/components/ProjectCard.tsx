import type { KeyboardEvent, MouseEvent } from 'react'
import { CrossIcon, IconButton, PencilIcon } from './IconButton'
import type { Project, ProjectPriority, ProjectStatus } from '../types'

interface ProjectCardProps {
  project: Project
  isSelected: boolean
  onSelect: (projectId: string) => void
  onOpenProject: (projectId: string) => void
  onEditProject: (projectId: string) => void
  onDeleteProject: (projectId: string) => void
  onUpdateStatus: (projectId: string, status: ProjectStatus) => void
  onUpdatePriority: (projectId: string, priority: ProjectPriority) => void
}

const statusOptions: ProjectStatus[] = ['review', 'in-progress', 'blocked', 'done']
const priorityOptions: ProjectPriority[] = ['urgent', 'high', 'medium', 'low']

function closeDropdown(event: MouseEvent<HTMLButtonElement>) {
  event.stopPropagation()
  event.currentTarget.closest('details')?.removeAttribute('open')
}

export function ProjectCard({
  project,
  isSelected,
  onSelect,
  onOpenProject,
  onEditProject,
  onDeleteProject,
  onUpdateStatus,
  onUpdatePriority,
}: ProjectCardProps) {
  const handleOpen = () => {
    onSelect(project.id)
    onOpenProject(project.id)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(project.id)
    }
  }

  return (
    <article
      className={isSelected ? 'project-card project-card--selected' : 'project-card'}
      onClick={() => onSelect(project.id)}
      onDoubleClick={handleOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="project-card__header">
        <div className="project-card__header-main">
          <p>{project.client}</p>
          <h4>{project.name}</h4>
          <details
            className="dropdown-menu project-card__status-menu"
            onClick={(event) => event.stopPropagation()}
          >
            <summary className={`status-badge status-badge--${project.status}`}>
              {project.status}
            </summary>
            <div className="dropdown-menu__content">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`dropdown-menu__item status-badge status-badge--${status}`}
                  onClick={(event) => {
                    closeDropdown(event)
                    onUpdateStatus(project.id, status)
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </details>
        </div>
        <div className="project-card__header-side">
          <div className="project-card__icon-actions">
            <IconButton
              label="Modifier le projet"
              icon={<PencilIcon />}
              onClick={(event) => {
                event.stopPropagation()
                onEditProject(project.id)
              }}
            />
            <IconButton
              label="Supprimer le projet"
              tone="danger"
              icon={<CrossIcon />}
              onClick={(event) => {
                event.stopPropagation()
                onDeleteProject(project.id)
              }}
            />
          </div>
        </div>
      </div>
      <p className="project-card__summary">{project.summary}</p>
      <div className="project-card__meta">
        <details className="dropdown-menu" onClick={(event) => event.stopPropagation()}>
          <summary className={`priority-pill priority-pill--${project.priority}`}>
            {project.priority}
          </summary>
          <div className="dropdown-menu__content">
            {priorityOptions.map((priority) => (
              <button
                key={priority}
                type="button"
                className={`dropdown-menu__item priority-pill priority-pill--${priority}`}
                onClick={(event) => {
                  closeDropdown(event)
                  onUpdatePriority(project.id, priority)
                }}
              >
                {priority}
              </button>
            ))}
          </div>
        </details>
        <span>{project.progress}%</span>
      </div>
      <div className="progress-meter" aria-hidden="true">
        <div style={{ width: `${project.progress}%` }} />
      </div>
    </article>
  )
}
