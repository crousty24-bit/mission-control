import { type FormEvent, useId, useState } from "react";
import type {
	CreateProjectInput,
	Project,
	ProjectPriority,
	ProjectStatus,
	UpdateProjectInput,
} from "../types";

interface ProjectModalProps {
	isOpen: boolean;
	mode: "create" | "edit" | "view";
	initialProject?: Project;
	onClose: () => void;
	onRequestEdit?: () => void;
	onSubmitProject: (
		project: CreateProjectInput | UpdateProjectInput,
	) => void | Promise<void>;
}

const priorityOptions: ProjectPriority[] = ["urgent", "high", "medium", "low"];
const statusOptions: ProjectStatus[] = [
	"in-progress",
	"review",
	"blocked",
	"done",
];

function buildInitialForm(project?: Project) {
	return {
		name: project?.name ?? "",
		client: project?.client ?? "",
		summary: project?.summary ?? "",
		milestone: project?.milestone ?? "",
		stack: project?.stack.join(", ") ?? "React, TypeScript",
		priority: project?.priority ?? ("medium" as ProjectPriority),
		status: project?.status ?? ("in-progress" as ProjectStatus),
		progress: project?.progress ?? 0,
	};
}

export function ProjectModal({
	isOpen,
	mode,
	initialProject,
	onClose,
	onRequestEdit,
	onSubmitProject,
}: ProjectModalProps) {
	const [form, setForm] = useState(() => buildInitialForm(initialProject));
	const nameId = useId();
	const clientId = useId();
	const summaryId = useId();
	const milestoneId = useId();
	const stackId = useId();
	const priorityId = useId();
	const statusId = useId();

	if (!isOpen) {
		return null;
	}

	if (mode === "view" && initialProject) {
		return (
			<div className="modal-backdrop">
				<section
					className="modal-panel"
					role="dialog"
					aria-modal="true"
					aria-labelledby="project-modal-title"
				>
					<div className="modal-header">
						<div>
							<p className="eyebrow">Projet</p>
							<h3 id="project-modal-title">Consulter le projet sélectionné</h3>
						</div>
					</div>

					<div className="modal-detail-grid">
						<div className="modal-detail">
							<span>Nom du projet</span>
							<strong>{initialProject.name}</strong>
						</div>
						<div className="modal-detail">
							<span>Client / contexte</span>
							<strong>{initialProject.client}</strong>
						</div>
						<div className="modal-detail modal-detail--wide">
							<span>Résumé</span>
							<p>{initialProject.summary}</p>
						</div>
						<div className="modal-detail">
							<span>Milestone</span>
							<strong>{initialProject.milestone}</strong>
						</div>
						<div className="modal-detail">
							<span>Stack</span>
							<strong>
								{initialProject.stack.join(", ") || "Non renseignée"}
							</strong>
						</div>
						<div className="modal-detail">
							<span>Priorité</span>
							<strong>{initialProject.priority}</strong>
						</div>
						<div className="modal-detail">
							<span>Statut</span>
							<strong>{initialProject.status}</strong>
						</div>
						<div className="modal-detail">
							<span>Progression</span>
							<strong>{initialProject.progress}%</strong>
						</div>
					</div>

					<div className="modal-actions">
						<button
							type="button"
							className="button button--primary"
							onClick={onRequestEdit}
						>
							Edit
						</button>
						<button
							type="button"
							className="button button--ghost"
							onClick={onClose}
						>
							Fermer
						</button>
					</div>
				</section>
			</div>
		);
	}

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const name = form.name.trim().slice(0, 20);
		const client = form.client.trim();
		const summary = form.summary.trim();
		const milestone = form.milestone.trim();
		const stack = form.stack
			.split(",")
			.map((value) => value.trim())
			.filter(Boolean);

		if (!name) {
			return;
		}

		void onSubmitProject({
			name,
			client,
			summary,
			milestone,
			stack,
			priority: form.priority,
			status: form.status,
		});
		onClose();
	};

	return (
		<div className="modal-backdrop">
			<section
				className="modal-panel"
				role="dialog"
				aria-modal="true"
				aria-labelledby="project-modal-title"
			>
				<div className="modal-header">
					<div>
						<p className="eyebrow">
							{mode === "create" ? "Nouveau projet" : "Édition projet"}
						</p>
						<h3 id="project-modal-title">
							{mode === "create"
								? "Créer un projet suivi dans le dashboard"
								: "Modifier le projet sélectionné"}
						</h3>
					</div>
					<button
						type="button"
						className="button button--ghost"
						onClick={onClose}
					>
						Fermer
					</button>
				</div>

				<form className="modal-form" onSubmit={handleSubmit}>
					<label htmlFor={nameId}>
						Nom du projet
						<input
							id={nameId}
							required
							maxLength={20}
							value={form.name}
							onChange={(event) =>
								setForm((current) => ({ ...current, name: event.target.value }))
							}
						/>
					</label>

					<label htmlFor={clientId}>
						Client / contexte
						<input
							id={clientId}
							value={form.client}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									client: event.target.value,
								}))
							}
						/>
					</label>

					<label htmlFor={summaryId} className="modal-form__wide">
						Résumé
						<textarea
							id={summaryId}
							rows={3}
							maxLength={96}
							value={form.summary}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									summary: event.target.value,
								}))
							}
						/>
					</label>

					<label htmlFor={milestoneId}>
						Milestone
						<input
							id={milestoneId}
							value={form.milestone}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									milestone: event.target.value,
								}))
							}
						/>
					</label>

					<label htmlFor={stackId}>
						Stack
						<input
							id={stackId}
							value={form.stack}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									stack: event.target.value,
								}))
							}
						/>
					</label>

					<label htmlFor={priorityId}>
						Priorité
						<select
							id={priorityId}
							value={form.priority}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									priority: event.target.value as ProjectPriority,
								}))
							}
						>
							{priorityOptions.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>
					</label>

					<label htmlFor={statusId}>
						Statut
						<select
							id={statusId}
							value={form.status}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									status: event.target.value as ProjectStatus,
								}))
							}
						>
							{statusOptions.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>
					</label>

					<div className="modal-actions modal-form__wide">
						<button
							type="button"
							className="button button--ghost"
							onClick={onClose}
						>
							Annuler
						</button>
						<button type="submit" className="button button--primary">
							{mode === "create" ? "Ajouter le projet" : "Enregistrer"}
						</button>
					</div>
				</form>
			</section>
		</div>
	);
}
