import { afterEach, describe, expect, it, vi } from "vitest";
import { type ApiError, request } from "./http";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("request", () => {
	it("returns parsed JSON responses", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(request("/api/projects")).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledWith("/api/projects", {
			headers: { "Content-Type": "application/json" },
		});
	});

	it("returns undefined for 204 responses", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
		);

		await expect(request("/api/projects/archive")).resolves.toBeUndefined();
	});

	it("throws ApiError with response status and body text", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(new Response("Project not found", { status: 404 })),
		);

		await expect(request("/api/projects/missing")).rejects.toMatchObject({
			name: "ApiError",
			message: "Project not found",
			status: 404,
		} satisfies Partial<ApiError>);
	});
});
