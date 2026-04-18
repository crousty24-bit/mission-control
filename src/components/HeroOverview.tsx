import { Link } from "../lib/router";
import type { Project, UserSnapshot } from "../types";
import { BorderGlow } from "./BorderGlow";

interface HeroOverviewProps {
	snapshot: UserSnapshot;
	leadProject: Project | null;
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

			<section
				className="signal-grid"
				aria-labelledby="hero-overview-summary-title"
			>
				<h3 id="hero-overview-summary-title" className="sr-only">
					Résumé d'activité
				</h3>
				<BorderGlow
					className="signal-glow-card signal-glow-card--lead"
					edgeSensitivity={32}
					glowColor="20 63 56"
					backgroundColor="#221510"
					borderRadius={22}
					glowRadius={26}
					glowIntensity={0.38}
					coneSpread={24}
					animated
					fillOpacity={0.26}
					colors={["#d46f45", "#f0c1ab", "#ffd7c1"]}
				>
					<div className="signal-grid__lead">
						<span>Completion globale</span>
						<strong>{snapshot.completionRate}%</strong>
						<p>
							{snapshot.completedTasks} tâches accomplies.{" "}
							{snapshot.remainingTasks} restantes dans les projets actifs.
						</p>
					</div>
				</BorderGlow>

				<div className="signal-grid__stack">
					<BorderGlow
						className="signal-glow-card"
						edgeSensitivity={34}
						glowColor="20 63 56"
						backgroundColor="#21140f"
						borderRadius={22}
						glowRadius={24}
						glowIntensity={0.34}
						coneSpread={22}
						fillOpacity={0.22}
						colors={["#d46f45", "#f0c1ab", "#ffd7c1"]}
					>
						<div className="signal-card">
							<span>Projet en tête</span>
							<strong>{leadProject?.name ?? "Aucun projet"}</strong>
							<p>
								{leadProject?.milestone ??
									"Crée un premier projet pour démarrer."}
							</p>
						</div>
					</BorderGlow>

					<BorderGlow
						className="signal-glow-card"
						edgeSensitivity={34}
						glowColor="20 63 56"
						backgroundColor="#21140f"
						borderRadius={22}
						glowRadius={24}
						glowIntensity={0.34}
						coneSpread={22}
						fillOpacity={0.22}
						colors={["#d46f45", "#f0c1ab", "#ffd7c1"]}
					>
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
					</BorderGlow>
				</div>
			</section>
		</section>
	);
}
