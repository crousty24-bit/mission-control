import { useState } from "react";
import { isStaticDemoRuntime } from "./api/runtimeMode";
import { AppShell } from "./components/AppShell";
import { AppDataProvider } from "./features/app-data/AppDataProvider";
import { BrowserRouter, Route, Routes } from "./lib/router";
import { ArchivesPage } from "./pages/ArchivesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import "./App.css";

function App() {
	const [projectSearchQuery, setProjectSearchQuery] = useState("");

	return (
		<AppDataProvider>
			<BrowserRouter useHashRouting={isStaticDemoRuntime()}>
				<Routes>
					<Route
						element={
							<AppShell
								projectSearchQuery={projectSearchQuery}
								onProjectSearchChange={setProjectSearchQuery}
							/>
						}
					>
						<Route index element={<HomePage />} />
						<Route
							path="/dashboard"
							element={
								<DashboardPage projectSearchQuery={projectSearchQuery} />
							}
						/>
						<Route path="/archives" element={<ArchivesPage />} />
					</Route>
				</Routes>
			</BrowserRouter>
		</AppDataProvider>
	);
}

export default App;
