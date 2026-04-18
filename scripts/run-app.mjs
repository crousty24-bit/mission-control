import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();
const distIndexPath = join(rootDir, "dist", "index.html");
const appUrl = "http://127.0.0.1:3001";

function run(command, args) {
	return spawn(command, args, {
		cwd: rootDir,
		env: process.env,
		stdio: "inherit",
	});
}

function openBrowser(url) {
	const openCommand =
		process.platform === "darwin"
			? ["open", [url]]
			: process.platform === "win32"
				? ["cmd", ["/c", "start", "", url]]
				: ["xdg-open", [url]];

	const [command, args] = openCommand;
	const child = spawn(command, args, {
		cwd: rootDir,
		env: process.env,
		stdio: "ignore",
		detached: true,
	});
	child.unref();
}

if (!existsSync(distIndexPath)) {
	console.log("Front build missing, running npm run build first...");
	const build = run("npm", ["run", "build"]);
	build.on("exit", (code) => {
		if (code !== 0) {
			process.exit(code ?? 1);
		}

		launch();
	});
} else {
	launch();
}

function launch() {
	const server = run("node", ["server/index.js"]);
	let shuttingDown = false;

	const shutdown = (code = 0) => {
		if (shuttingDown) {
			return;
		}

		shuttingDown = true;
		if (!server.killed) {
			server.kill("SIGTERM");
		}
		setTimeout(() => process.exit(code), 100);
	};

	process.on("SIGINT", () => shutdown(0));
	process.on("SIGTERM", () => shutdown(0));

	server.on("exit", (code, signal) => {
		if (signal) {
			process.exit(0);
		}

		process.exit(code ?? 0);
	});

	setTimeout(() => {
		openBrowser(appUrl);
	}, 900);
}
