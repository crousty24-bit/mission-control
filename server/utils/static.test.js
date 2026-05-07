import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { serverConfig } from "../config.js";
import { serveStaticAsset } from "./static.js";

let originalDistPath;
let tempRoot;

function createMockResponse() {
	const chunks = [];
	return {
		headers: {},
		statusCode: 200,
		writeHead(statusCode, headers = {}) {
			this.statusCode = statusCode;
			this.headers = headers;
		},
		end(chunk = "") {
			if (chunk) {
				chunks.push(Buffer.from(chunk));
			}
		},
		getText() {
			return Buffer.concat(chunks).toString("utf8");
		},
	};
}

beforeEach(() => {
	originalDistPath = serverConfig.distPath;
	tempRoot = mkdtempSync(join(tmpdir(), "mission-control-static-"));
	serverConfig.distPath = join(tempRoot, "dist");
});

afterEach(() => {
	serverConfig.distPath = originalDistPath;
	rmSync(tempRoot, { force: true, recursive: true });
});

describe("serveStaticAsset", () => {
	it("does not serve files outside the configured dist directory", () => {
		writeFileSync(join(tempRoot, "secret.txt"), "secret");

		const response = createMockResponse();
		serveStaticAsset(response, "/../secret.txt");

		expect(response.statusCode).toBe(404);
		expect(response.getText()).toBe("Not found");
	});
});
