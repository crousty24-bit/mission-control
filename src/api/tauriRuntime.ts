const tauriCoreModuleName = "@tauri-apps/api/core";

declare global {
	interface Window {
		__TAURI_INTERNALS__?: {
			invoke: <T>(
				command: string,
				payload?: Record<string, unknown>,
			) => Promise<T>;
		};
		isTauri?: boolean;
	}
}

type TauriCoreModule = {
	invoke: <T>(command: string, payload?: Record<string, unknown>) => Promise<T>;
	isTauri?: () => boolean;
};

let tauriCorePromise: Promise<TauriCoreModule | null> | null = null;

function hasLegacyTauriInvoker() {
	return (
		typeof window !== "undefined" &&
		typeof window.__TAURI_INTERNALS__?.invoke === "function"
	);
}

function hasOfficialTauriFlag() {
	return typeof window !== "undefined" && window.isTauri === true;
}

async function loadTauriCore() {
	if (!tauriCorePromise) {
		tauriCorePromise = import(/* @vite-ignore */ tauriCoreModuleName)
			.then((module) => module as TauriCoreModule)
			.catch(() => null);
	}

	return tauriCorePromise;
}

export function isTauriRuntime() {
	return hasLegacyTauriInvoker() || hasOfficialTauriFlag();
}

export async function invokeTauri<T>(
	command: string,
	payload?: Record<string, unknown>,
) {
	const tauriCore = await loadTauriCore();
	if (tauriCore?.invoke) {
		return tauriCore.invoke<T>(command, payload);
	}

	const legacyInvoker = window.__TAURI_INTERNALS__;
	if (legacyInvoker?.invoke) {
		return legacyInvoker.invoke<T>(command, payload);
	}

	throw new Error("Tauri runtime unavailable");
}
