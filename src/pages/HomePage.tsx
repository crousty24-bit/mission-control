import { HeroOverview } from '../components/HeroOverview'
import { useProjects } from '../features/projects/hooks'
import { useUserSnapshot } from '../features/user/hooks'

export function HomePage() {
  const { projects, isLoading, error } = useProjects()
  const { snapshot } = useUserSnapshot()

  if (isLoading) {
    return <section className="section-block feedback-panel">Chargement de Mission Control...</section>
  }

  if (error) {
    return <section className="section-block feedback-panel">Erreur API: {error}</section>
  }

  const leadProject = projects[0] ?? null

  return (
    <div className="page-stack">
      <HeroOverview snapshot={snapshot} leadProject={leadProject} />
    </div>
  )
}
