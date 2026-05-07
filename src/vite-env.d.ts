/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_MISSION_CONTROL_STATIC_DEMO?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
