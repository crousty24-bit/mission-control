import { useAppData } from "../app-data/useAppData";

export function useUserSnapshot() {
	const { snapshot, isLoading, error, updateUserSnapshot, isMutating } =
		useAppData();
	return {
		snapshot,
		isLoading,
		error,
		isMutating,
		updateUserSnapshot,
	};
}
