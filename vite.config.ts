import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/api": "http://127.0.0.1:3001",
		},
	},
	test: {
		environment: "node",
		globals: true,
		include: ["src/**/*.test.{ts,tsx}", "server/**/*.test.js"],
		setupFiles: ["src/test/setup.ts"],
	},
});
