import { useArchivedProjects } from "../features/projects/hooks";

export function ArchivesPage() {
	const { archivedProjects, isLoading, error } = useArchivedProjects();

	if (isLoading) {
		return (
			<section className="section-block feedback-panel">
				Chargement des archives...
			</section>
		);
	}

	if (error) {
		return (
			<section className="section-block feedback-panel">
				Erreur API: {error}
			</section>
		);
	}

	return (
		<div className="page-stack">
			<section className="section-block archive-section">
				<div className="section-heading">
					<p className="eyebrow">Archives</p>
					<h3>Projets archivés</h3>
				</div>

				{archivedProjects.length === 0 ? (
					<p className="empty-state">Aucun projet archivé pour le moment.</p>
				) : (
					<ul className="archive-list">
						{archivedProjects.map((project) => (
							<li key={project.id} className="archive-row">
								<strong>{project.name}</strong>
								<span>{project.client}</span>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
