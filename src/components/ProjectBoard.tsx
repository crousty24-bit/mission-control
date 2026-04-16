import { useEffect, useState } from 'react'
import { ProjectModal } from './ProjectModal'
import { ProjectCard } from './ProjectCard'
import type {
  CreateProjectInput,
  Project,
  ProjectPriority,
  ProjectStatus,
  UpdateProjectInput,
} from '../types'

interface ProjectBoardProps {
  projects: Project[]
  selectedProjectId: string
  onSelectProject: (projectId: string) => void
  onCreateProject: (project: CreateProjectInput) => Promise<Project> | Promise<void>
  onEditProject: (projectId: string, project: UpdateProjectInput) => Promise<Project> | Promise<void>
  onUpdateStatus: (projectId: string, status: ProjectStatus) => void
  onUpdatePriority: (projectId: string, priority: ProjectPriority) => void
  onDeleteProject: (projectId: string) => void
}

export function ProjectBoard({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onEditProject,
  onUpdateStatus,
  onUpdatePriority,
  onDeleteProject,
}: ProjectBoardProps) {
  const [modalState, setModalState] = useState<{
    mode: 'create' | 'edit' | 'view'
    project?: Project
  } | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      if (target.closest('.project-board .dropdown-menu')) {
        return
      }

      document
        .querySelectorAll('.project-board .dropdown-menu[open]')
        .forEach((dropdown) => dropdown.removeAttribute('open'))
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  return (
    <section className="section-block">
      <div className="section-heading">
        <div className="section-heading__row">
          <div>
            <p className="eyebrow">Projets</p>
            <h3>Pipeline en cours</h3>
          </div>
          <button
            type="button"
            className="button button--ghost button--compact"
            onClick={() => setModalState({ mode: 'create' })}
          >
            Ajouter un projet
          </button>
        </div>
      </div>
      <div className="project-board">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            isSelected={project.id === selectedProjectId}
            onSelect={onSelectProject}
            onOpenProject={(projectId) =>
              setModalState({
                mode: 'view',
                project: projects.find((item) => item.id === projectId),
              })
            }
            onEditProject={(projectId) =>
              setModalState({
                mode: 'edit',
                project: projects.find((item) => item.id === projectId),
              })
            }
            onDeleteProject={onDeleteProject}
            onUpdateStatus={onUpdateStatus}
            onUpdatePriority={onUpdatePriority}
          />
        ))}
      </div>
      {modalState ? (
        <ProjectModal
          key={`${modalState.mode}-${modalState.project?.id ?? 'new'}`}
          isOpen
          mode={modalState.mode}
          initialProject={modalState.project}
          onClose={() => setModalState(null)}
          onRequestEdit={() => {
            if (!modalState.project) {
              return
            }

            setModalState({
              mode: 'edit',
              project: modalState.project,
            })
          }}
          onSubmitProject={async (project) => {
            if (modalState.mode === 'create') {
              await onCreateProject(project as CreateProjectInput)
              return
            }

            if (modalState.mode === 'edit' && modalState.project) {
              await onEditProject(modalState.project.id, project as UpdateProjectInput)
            }
          }}
        />
      ) : null}
    </section>
  )
}
