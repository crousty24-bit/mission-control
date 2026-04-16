import type { UserSnapshot } from '../types'

interface StatusPanelProps {
  snapshot: UserSnapshot
}

export function StatusPanel({ snapshot }: StatusPanelProps) {
  return (
    <section className="section-block" id="status">
      <div className="section-heading">
        <p className="eyebrow">Statut utilisateur</p>
        <h3>Cadence actuelle</h3>
      </div>

      <div className="status-layout">
        <div className="status-metric">
          <span>Sprint</span>
          <strong>{snapshot.sprint}</strong>
        </div>
        <div className="status-metric">
          <span>Cadence actuelle</span>
          <strong>{snapshot.focusScore}%</strong>
        </div>
        <div className="status-metric">
          <span>Completion globale</span>
          <strong>{snapshot.completionRate}%</strong>
        </div>
        <div className="progress-meter" aria-label="Completion globale">
          <div style={{ width: `${snapshot.completionRate}%` }} />
        </div>
      </div>
    </section>
  )
}
