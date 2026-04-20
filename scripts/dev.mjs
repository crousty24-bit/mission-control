import { spawn } from "node:child_process";
import { request } from "node:http";

const API_HOST = "127.0.0.1";
const API_PORT = 3001;
const API_PROJECTS_PATH = "/api/projects";

function startProcess(command, args, name) {
	const child = spawn(command, args, {
		cwd: process.cwd(),
		env: process.env,
		stdio: "inherit",
	});

	child.on("exit", (code, signal) => {
		if (signal) {
			console.log(`${name} stopped with signal ${signal}`);
			return;
		}

		if (code && code !== 0) {
			console.log(`${name} stopped with code ${code}`);
			shutdown(code);
		}
	});

	return child;
}

const children = [];
let shuttingDown = false;

function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function probeMissionControlApi() {
	return new Promise((resolve) => {
		const req = request(
			{
				host: API_HOST,
				port: API_PORT,
				path: API_PROJECTS_PATH,
				method: "GET",
				timeout: 800,
			},
			(response) => {
				let body = "";
				response.setEncoding("utf8");
				response.on("data", (chunk) => {
					body += chunk;
				});
				response.on("end", () => {
					if (response.statusCode !== 200) {
						resolve(false);
						return;
					}

					try {
						const payload = JSON.parse(body);
						resolve(Array.isArray(payload));
					} catch {
						resolve(false);
					}
				});
			},
		);

		req.on("timeout", () => {
			req.destroy();
			resolve(false);
		});
		req.on("error", () => resolve(false));
		req.end();
	});
}

function shutdown(exitCode = 0) {
	if (shuttingDown) {
		return;
	}

	shuttingDown = true;

	for (const child of children) {
		if (!child.killed) {
			child.kill("SIGTERM");
		}
	}

	setTimeout(() => process.exit(exitCode), 100);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function startDev() {
	const existingApiReady = await probeMissionControlApi();
	if (existingApiReady) {
		console.log(
			"Mission Control API already available on http://127.0.0.1:3001, reusing existing server.",
		);
	} else {
		const api = startProcess("node", ["server/index.js"], "API server");
		children.push(api);
		await wait(700);

		if (shuttingDown) {
			return;
		}

		const apiStarted = await probeMissionControlApi();
		if (!apiStarted) {
			console.error(
				"Cannot start Mission Control API on http://127.0.0.1:3001. The port is likely already used by another process.",
			);
			console.error(
				"Stop the process using port 3001 or free the port, then retry `npm run dev`.",
			);
			shutdown(1);
			return;
		}
	}

	if (shuttingDown) {
		return;
	}

	const vite = startProcess("npm", ["run", "dev:front"], "Vite dev server");
	children.push(vite);
}

void startDev();
