import { useId, useState, type FormEvent } from 'react'
import { CrossIcon, IconButton, PencilIcon } from './IconButton'
import type { Project, TaskItem } from '../types'

interface TodoPanelProps {
  tasks: TaskItem[]
  selectedProject: Project
  onToggleTask: (taskId: string) => void
  onAddTask: (title: string, projectId: string) => void
  onDeleteTask: (taskId: string) => void
  onEditTask: (taskId: string, title: string) => void
}

export function TodoPanel({
  tasks,
  selectedProject,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onEditTask,
}: TodoPanelProps) {
  const [draft, setDraft] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const inputId = useId()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) {
      return
    }

    onAddTask(trimmed, selectedProject.id)
    setDraft('')
  }

  const startEditing = (task: TaskItem) => {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
  }

  const handleEditSubmit = (taskId: string) => {
    const trimmed = editingTitle.trim()
    if (!trimmed) {
      return
    }

    onEditTask(taskId, trimmed)
    setEditingTaskId(null)
    setEditingTitle('')
  }

  return (
    <section className="section-block">
      <div className="section-heading">
        <p className="eyebrow">Todo list</p>
        <h3>Tâches du projet sélectionné</h3>
      </div>

      <form className="task-form" onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="sr-only">
          Nouvelle tâche
        </label>
        <input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Ajouter une tâche pour ${selectedProject.name}`}
        />
        <button type="submit" className="button button--primary">
          Ajouter
        </button>
      </form>

      <div className="task-list">
        {tasks.length === 0 ? (
          <p className="empty-state">
            Aucune tâche pour ce projet. Ajoute une première action pour lancer le
            suivi de progression.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={task.done ? 'task-row task-row--done' : 'task-row'}
            >
              {editingTaskId === task.id ? (
                <div className="task-row__main task-row__main--editing">
                  <input
                    className="task-row__edit-input"
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    aria-label={`Modifier la tâche ${task.title}`}
                  />
                </div>
              ) : (
                <label className="task-row__main">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => onToggleTask(task.id)}
                  />
                  <span>{task.title}</span>
                </label>
              )}
              <small>{task.urgency}</small>
              <div className="task-row__actions">
                {editingTaskId === task.id ? (
                  <>
                    <button
                      type="button"
                      className="button button--quiet task-row__text-action"
                      onClick={() => handleEditSubmit(task.id)}
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      className="button button--quiet task-row__text-action"
                      onClick={() => {
                        setEditingTaskId(null)
                        setEditingTitle('')
                      }}
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <IconButton
                      label="Modifier la tâche"
                      icon={<PencilIcon />}
                      onClick={() => startEditing(task)}
                    />
                    <IconButton
                      label="Supprimer la tâche"
                      tone="danger"
                      icon={<CrossIcon />}
                      onClick={() => onDeleteTask(task.id)}
                    />
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
