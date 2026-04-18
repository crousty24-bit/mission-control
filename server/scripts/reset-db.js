import { existsSync, rmSync } from "node:fs";
import { serverConfig } from "../config.js";
import { initDatabase } from "../db/init.js";

if (existsSync(serverConfig.dbPath)) {
	rmSync(serverConfig.dbPath);
}

initDatabase();
console.log(`Database reset at ${serverConfig.dbPath}`);
