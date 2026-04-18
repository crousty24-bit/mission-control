export async function readJsonBody(request) {
	const chunks = [];
	for await (const chunk of request) {
		chunks.push(chunk);
	}

	if (chunks.length === 0) {
		return {};
	}

	return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function sendJson(response, statusCode, payload) {
	response.writeHead(statusCode, {
		"Content-Type": "application/json; charset=utf-8",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
	});
	response.end(JSON.stringify(payload));
}

export function sendText(response, statusCode, message) {
	response.writeHead(statusCode, {
		"Content-Type": "text/plain; charset=utf-8",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
	});
	response.end(message);
}
