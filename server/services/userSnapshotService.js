import { listProjects } from '../repositories/projectsRepository.js'
import { getUserSnapshotRecord, updateUserSnapshot } from '../repositories/userSnapshotRepository.js'
import { getCompletionRate } from './taskService.js'

export function getUserSnapshotView() {
  const snapshot = getUserSnapshotRecord()
  if (!snapshot) {
    return null
  }

  return {
    developer: snapshot.developer,
    sprint: snapshot.sprint,
    focusScore: snapshot.focusScore,
    completedThisWeek: Math.round((getCompletionRate() / 100) * 12),
    activeProjects: listProjects().length,
    nextDeadline: snapshot.nextDeadline,
    completionRate: getCompletionRate(),
  }
}

export function patchUserSnapshot(changes) {
  const current = getUserSnapshotRecord()
  if (!current) {
    return null
  }

  updateUserSnapshot({
    developer: changes.developer ?? current.developer,
    sprint: changes.sprint ?? current.sprint,
    focusScore: changes.focusScore ?? current.focusScore,
    nextDeadline: changes.nextDeadline ?? current.nextDeadline,
  })

  return getUserSnapshotView()
}
