import type {
	CreateProjectInput,
	ProjectPriority,
	ProjectStatus,
	UpdateProjectInput,
} from "../../types";
import { useAppData } from "../app-data/useAppData";

export function useProjects() {
	const { projects, isLoading, error } = useAppData();
	return { projects, isLoading, error };
}

export function useArchivedProjects() {
	const { archivedProjects, isLoading, error } = useAppData();
	return { archivedProjects, isLoading, error };
}

export function useCreateProject() {
	const { createProject, isMutating } = useAppData();
	return { createProject, isMutating };
}

export function useUpdateProject() {
	const { updateProject, isMutating } = useAppData();
	return { updateProject, isMutating };
}

export function useProjectActions() {
	const {
		createProject,
		deleteProject,
		reorderProjects: persistProjectOrder,
		updateProject,
		archiveProjects,
		isMutating,
	} = useAppData();

	return {
		isMutating,
		createProject,
		editProject: (projectId: string, input: UpdateProjectInput) =>
			updateProject(projectId, input),
		reorderProjects: (projectIds: string[]) => persistProjectOrder(projectIds),
		deleteProject: (projectId: string) => deleteProject(projectId),
		archiveProjects: (projectIds: string[]) => archiveProjects(projectIds),
		updateProjectStatus: (projectId: string, status: ProjectStatus) =>
			updateProject(projectId, { status }),
		updateProjectPriority: (projectId: string, priority: ProjectPriority) =>
			updateProject(projectId, { priority }),
	};
}

export type { CreateProjectInput };
