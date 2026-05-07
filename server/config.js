import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(
	fileURLToPath(new URL("../package.json", import.meta.url)),
);

export const serverConfig = {
	appUrl: "http://127.0.0.1:3001",
	dbPath:
		process.env.MISSION_CONTROL_DB_PATH ??
		join(rootDir, "server", "data", "mission-control.sqlite"),
	distPath: join(rootDir, "dist"),
	host: "127.0.0.1",
	port: 3001,
	rootDir,
};
