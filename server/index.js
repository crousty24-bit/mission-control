import { createServer } from "node:http";
import { serverConfig } from "./config.js";
import { initDatabase } from "./db/init.js";
import { handleApiRequest } from "./routes/api.js";
import { sendText } from "./utils/http.js";
import { serveStaticAsset } from "./utils/static.js";

initDatabase();

const server = createServer(async (request, response) => {
	if (!request.url) {
		sendText(response, 400, "Invalid request");
		return;
	}

	const url = new URL(
		request.url,
		`http://${serverConfig.host}:${serverConfig.port}`,
	);

	try {
		const handled = await handleApiRequest(request, response, url);
		if (!handled) {
			if (request.method === "GET" || request.method === "HEAD") {
				serveStaticAsset(response, url.pathname);
				return;
			}

			sendText(response, 404, "Not found");
		}
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unexpected server error";
		sendText(response, 500, message);
	}
});

server.on("error", (error) => {
	if (error.code === "EADDRINUSE") {
		console.error(
			`Mission Control API cannot start on ${serverConfig.appUrl}: port already in use.`,
		);
		console.error(
			"Stop the process using port 3001, or reuse the existing Mission Control API if that is the intended server.",
		);
		process.exit(1);
	}

	console.error(
		`Mission Control API failed to start on ${serverConfig.appUrl}: ${error.message}`,
	);
	process.exit(1);
});

server.listen(serverConfig.port, serverConfig.host, () => {
	console.log(`Mission Control listening on ${serverConfig.appUrl}`);
});
