// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BrowserRouter, Link, Route, Routes } from "./router";

function TestRoutes({ useHashRouting = false }: { useHashRouting?: boolean }) {
	return (
		<BrowserRouter useHashRouting={useHashRouting}>
			<Link to="/dashboard">Dashboard</Link>
			<Routes>
				<Route index element={<p>Accueil</p>} />
				<Route path="/dashboard" element={<p>Dashboard page</p>} />
				<Route path="/archives" element={<p>Archives page</p>} />
			</Routes>
		</BrowserRouter>
	);
}

describe("BrowserRouter", () => {
	it("keeps history navigation for the default runtime", async () => {
		window.history.replaceState({}, "", "/");
		const user = userEvent.setup();

		render(<TestRoutes />);

		expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
			"href",
			"/dashboard",
		);
		await user.click(screen.getByRole("link", { name: "Dashboard" }));

		expect(window.location.pathname).toBe("/dashboard");
		expect(screen.getByText("Dashboard page")).toBeInTheDocument();
	});

	it("uses hash navigation for the static demo runtime", async () => {
		window.history.replaceState({}, "", "/mission-control/");
		window.location.hash = "#/archives";
		const user = userEvent.setup();

		render(<TestRoutes useHashRouting />);

		expect(screen.getByText("Archives page")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
			"href",
			"#/dashboard",
		);
		await user.click(screen.getByRole("link", { name: "Dashboard" }));

		expect(window.location.hash).toBe("#/dashboard");
		expect(screen.getByText("Dashboard page")).toBeInTheDocument();
	});
});
