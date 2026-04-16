import { Link } from '../lib/router'
import type { Project, UserSnapshot } from '../types'

interface HeroOverviewProps {
  snapshot: UserSnapshot
  leadProject: Project | null
}

export function HeroOverview({ snapshot, leadProject }: HeroOverviewProps) {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <h2>Bienvenue sur ton dashboard personnel.</h2>
        <p className="hero-text">Prêt à reprendre ton travail ?</p>
        <div className="hero-actions">
          <Link className="button button--primary" to="/dashboard">
            Ouvrir le dashboard
          </Link>
        </div>
      </div>

      <div className="signal-grid" aria-label="Résumé d'activité">
        <div className="signal-grid__lead">
          <span>Cadence actuelle</span>
          <strong>{snapshot.focusScore}%</strong>
          <p>
            {snapshot.completedThisWeek} tâches closes en local. Prochaine
            échéance : {snapshot.nextDeadline}.
          </p>
        </div>

        <div className="signal-grid__stack">
          <div className="signal-card">
            <span>Projet en tête</span>
            <strong>{leadProject?.name ?? 'Aucun projet'}</strong>
            <p>{leadProject?.milestone ?? 'Crée un premier projet pour démarrer.'}</p>
          </div>

          <div className="signal-card signal-card--row">
            <div>
              <span>Projets actifs</span>
              <strong>{snapshot.activeProjects}</strong>
            </div>
            <div>
              <span>Completion globale</span>
              <strong>{snapshot.completionRate}%</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
