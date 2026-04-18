import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { serverConfig } from "../config.js";

let database;

export function getDb() {
	if (database) {
		return database;
	}

	mkdirSync(dirname(serverConfig.dbPath), { recursive: true });
	database = new DatabaseSync(serverConfig.dbPath);
	database.exec("PRAGMA foreign_keys = ON;");
	return database;
}
