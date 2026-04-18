import type { CreateTaskInput } from "../../types";
import { useAppData } from "../app-data/useAppData";

export function useTasks(projectId?: string) {
	const { tasks, isLoading, error } = useAppData();
	return {
		tasks: projectId
			? tasks.filter((task) => task.projectId === projectId)
			: tasks,
		isLoading,
		error,
	};
}

export function useTaskActions() {
	const { createTask, deleteTask, tasks, updateTask, isMutating } =
		useAppData();

	return {
		isMutating,
		createTask: (input: CreateTaskInput) => createTask(input),
		toggleTask: async (taskId: string) => {
			const task = tasks.find((item) => item.id === taskId);
			if (!task) {
				throw new Error("Task not found");
			}

			return updateTask(taskId, { done: !task.done });
		},
		editTask: (taskId: string, title: string) => updateTask(taskId, { title }),
		deleteTask: (taskId: string) => deleteTask(taskId),
	};
}
