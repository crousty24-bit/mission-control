import {
	type FormEvent,
	type PointerEvent,
	useEffect,
	useEffectEvent,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import type { Project, TaskItem } from "../types";
import { CrossIcon, GripIcon, IconButton, PencilIcon } from "./IconButton";

interface TodoPanelProps {
	tasks: TaskItem[];
	selectedProject: Project;
	onToggleTask: (taskId: string) => void;
	onAddTask: (title: string, projectId: string) => void;
	onDeleteTask: (taskId: string) => void;
	onEditTask: (taskId: string, title: string) => void;
	onReorderTasks: (
		projectId: string,
		taskIds: string[],
	) => Promise<void> | void;
}

function moveTask(
	tasks: TaskItem[],
	draggedTaskId: string,
	targetTaskId: string,
) {
	const draggedIndex = tasks.findIndex((task) => task.id === draggedTaskId);
	const targetIndex = tasks.findIndex((task) => task.id === targetTaskId);

	if (
		draggedIndex === -1 ||
		targetIndex === -1 ||
		draggedIndex === targetIndex
	) {
		return tasks;
	}

	const nextTasks = [...tasks];
	const [draggedTask] = nextTasks.splice(draggedIndex, 1);
	nextTasks.splice(targetIndex, 0, draggedTask);
	return nextTasks;
}

function orderTasks(tasks: TaskItem[], taskOrderOverride: string[] | null) {
	if (!taskOrderOverride) {
		return tasks;
	}

	const tasksById = new Map(tasks.map((task) => [task.id, task]));
	const orderedTasks = taskOrderOverride
		.map((taskId) => tasksById.get(taskId))
		.filter((task): task is TaskItem => Boolean(task));
	const knownTaskIds = new Set(orderedTasks.map((task) => task.id));
	const remainingTasks = tasks.filter((task) => !knownTaskIds.has(task.id));

	return [...remainingTasks, ...orderedTasks];
}

export function TodoPanel({
	tasks,
	selectedProject,
	onToggleTask,
	onAddTask,
	onDeleteTask,
	onEditTask,
	onReorderTasks,
}: TodoPanelProps) {
	const [isShowingAllTasks, setIsShowingAllTasks] = useState(false);
	const [draft, setDraft] = useState("");
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
	const [editingTitle, setEditingTitle] = useState("");
	const [taskOrderOverride, setTaskOrderOverride] = useState<string[] | null>(
		null,
	);
	const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
	const draggedTaskIdRef = useRef<string | null>(null);
	const inputId = useId();
	const selectedProjectId = selectedProject.id;
	const dragStartOrderRef = useRef<string[]>([]);
	const didReorderRef = useRef(false);
	const orderedTasks = useMemo(() => {
		return orderTasks(tasks, taskOrderOverride);
	}, [taskOrderOverride, tasks]);
	const visibleTasks = useMemo(
		() => (isShowingAllTasks ? orderedTasks : orderedTasks.slice(0, 4)),
		[isShowingAllTasks, orderedTasks],
	);
	const orderedTasksRef = useRef(orderedTasks);
	const tasksRef = useRef(tasks);
	const selectedProjectIdRef = useRef(selectedProject.id);
	const onReorderTasksRef = useRef(onReorderTasks);

	useEffect(() => {
		orderedTasksRef.current = orderedTasks;
	}, [orderedTasks]);

	useEffect(() => {
		tasksRef.current = tasks;
		selectedProjectIdRef.current = selectedProjectId;
		onReorderTasksRef.current = onReorderTasks;
	}, [onReorderTasks, selectedProjectId, tasks]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = draft.trim();
		if (!trimmed) {
			return;
		}

		onAddTask(trimmed, selectedProjectId);
		setDraft("");
	};

	const startEditing = (task: TaskItem) => {
		setEditingTaskId(task.id);
		setEditingTitle(task.title);
	};

	const handleEditSubmit = (taskId: string) => {
		const trimmed = editingTitle.trim();
		if (!trimmed) {
			return;
		}

		onEditTask(taskId, trimmed);
		setEditingTaskId(null);
		setEditingTitle("");
	};

	const restoreTaskOrder = useEffectEvent((taskOrder: string[]) => {
		const currentTaskOrder = tasksRef.current.map((task) => task.id);
		setTaskOrderOverride(
			taskOrder.join(",") === currentTaskOrder.join(",") ? null : taskOrder,
		);
	});

	const handleTaskPointerDown =
		(taskId: string) => (event: PointerEvent<HTMLButtonElement>) => {
			event.preventDefault();
			event.stopPropagation();
			dragStartOrderRef.current = orderedTasks.map((task) => task.id);
			didReorderRef.current = false;
			draggedTaskIdRef.current = taskId;
			setDraggedTaskId(taskId);
		};

	const finishTaskReorder = useEffectEvent(() => {
		if (!draggedTaskIdRef.current) {
			dragStartOrderRef.current = [];
			return;
		}

		const previousOrder = dragStartOrderRef.current;
		const nextOrder = orderedTasksRef.current.map((task) => task.id);
		draggedTaskIdRef.current = null;
		setDraggedTaskId(null);
		dragStartOrderRef.current = [];
		didReorderRef.current = false;

		if (previousOrder.join(",") === nextOrder.join(",")) {
			return;
		}

		void Promise.resolve()
			.then(() =>
				onReorderTasksRef.current(selectedProjectIdRef.current, nextOrder),
			)
			.catch(() => {
				restoreTaskOrder(previousOrder);
			});
	});

	useEffect(() => {
		if (!draggedTaskId) {
			return;
		}

		const handlePointerMove = (event: globalThis.PointerEvent) => {
			if (!draggedTaskIdRef.current) {
				return;
			}

			const target = document.elementFromPoint(
				event.clientX,
				event.clientY,
			) as HTMLElement | null;
			const targetRow = target?.closest("[data-task-row-id]");
			const targetTaskId = targetRow?.getAttribute("data-task-row-id");

			if (!targetTaskId || draggedTaskIdRef.current === targetTaskId) {
				return;
			}

			didReorderRef.current = true;
			const nextTasks = moveTask(
				orderedTasksRef.current,
				draggedTaskIdRef.current,
				targetTaskId,
			);
			setTaskOrderOverride(nextTasks.map((task) => task.id));
		};

		const cancelTaskDrag = () => {
			if (dragStartOrderRef.current.length > 0) {
				restoreTaskOrder(dragStartOrderRef.current);
			}

			didReorderRef.current = false;
			dragStartOrderRef.current = [];
			draggedTaskIdRef.current = null;
			setDraggedTaskId(null);
		};

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", finishTaskReorder);
		window.addEventListener("pointercancel", cancelTaskDrag);
		window.addEventListener("blur", cancelTaskDrag);

		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", finishTaskReorder);
			window.removeEventListener("pointercancel", cancelTaskDrag);
			window.removeEventListener("blur", cancelTaskDrag);
		};
	}, [draggedTaskId]);

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

			<ul className="task-list">
				{tasks.length === 0 ? (
					<li className="empty-state">
						Aucune tâche pour ce projet. Ajoute une première action pour lancer
						le suivi de progression.
					</li>
				) : (
					visibleTasks.map((task) => (
						<li
							key={task.id}
							data-task-row-id={task.id}
							className={[
								task.done ? "task-row task-row--done" : "task-row",
								draggedTaskId === task.id ? "task-row--dragging" : null,
							]
								.filter(Boolean)
								.join(" ")}
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
												setEditingTaskId(null);
												setEditingTitle("");
											}}
										>
											Annuler
										</button>
									</>
								) : (
									<>
										<button
											type="button"
											className="drag-handle"
											aria-label={`Réordonner ${task.title}`}
											title={`Réordonner ${task.title}`}
											onClick={(event) => {
												event.preventDefault();
												event.stopPropagation();
											}}
											onPointerDown={handleTaskPointerDown(task.id)}
										>
											<GripIcon />
										</button>
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
						</li>
					))
				)}
			</ul>

			{orderedTasks.length > 4 ? (
				<div className="section-footer-action">
					<button
						type="button"
						className="section-link-action"
						aria-expanded={isShowingAllTasks}
						onClick={() => setIsShowingAllTasks((current) => !current)}
					>
						{isShowingAllTasks ? "show less" : "view all"}
					</button>
				</div>
			) : null}
		</section>
	);
}
