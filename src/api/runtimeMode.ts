export function isStaticDemoRuntime() {
	return import.meta.env.VITE_MISSION_CONTROL_STATIC_DEMO === "true";
}
