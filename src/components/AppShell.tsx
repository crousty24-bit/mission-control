import logoUrl from "../../src-tauri/icons/256x256.png";
import { useUserSnapshot } from "../features/user/hooks";
import { NavLink, Outlet } from "../lib/router";
import { RewardNotification } from "./RewardNotification";

interface AppShellProps {
	projectSearchQuery: string;
	onProjectSearchChange: (query: string) => void;
}

export function AppShell({
	projectSearchQuery,
	onProjectSearchChange,
}: AppShellProps) {
	const { snapshot } = useUserSnapshot();

	return (
		<div className="app-shell">
			<RewardNotification />
			<header className="topbar">
				<div className="topbar__brand">
					<div className="brand-mark-frame" aria-hidden="true">
						<img
							className="brand-mark"
							src={logoUrl}
							alt="Mission Control"
							width="56"
							height="56"
						/>
					</div>
					<div className="topbar__identity">
						<p className="eyebrow">Dev Command Center</p>
						<h1 className="brand">Mission Control</h1>
					</div>
				</div>
				<nav className="topnav" aria-label="Navigation principale">
					<NavLink
						to="/"
						className={({ isActive }) =>
							isActive ? "topnav__link topnav__link--active" : "topnav__link"
						}
						end
					>
						Accueil
					</NavLink>
					<NavLink
						to="/dashboard"
						className={({ isActive }) =>
							isActive ? "topnav__link topnav__link--active" : "topnav__link"
						}
					>
						Dashboard
					</NavLink>
					<NavLink
						to="/archives"
						className={({ isActive }) =>
							isActive ? "topnav__link topnav__link--active" : "topnav__link"
						}
					>
						Archives
					</NavLink>
				</nav>
				<label className="topbar__search">
					<span className="topbar__search-icon" aria-hidden="true">
						<svg
							viewBox="0 0 24 24"
							role="img"
							focusable="false"
							aria-hidden="true"
						>
							<path d="M10.8 4.2a6.6 6.6 0 1 1 0 13.2 6.6 6.6 0 0 1 0-13.2Zm0 2a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Zm4.9 9.1 4.1 4.1-1.4 1.4-4.1-4.1 1.4-1.4Z" />
						</svg>
					</span>
					<input
						type="text"
						value={projectSearchQuery}
						placeholder="rechercher dans les projets"
						aria-label="Rechercher dans les projets"
						onChange={(event) => onProjectSearchChange(event.target.value)}
					/>
					{projectSearchQuery ? (
						<button
							type="button"
							className="topbar__search-reset"
							aria-label="Réinitialiser la recherche"
							onClick={() => onProjectSearchChange("")}
						>
							×
						</button>
					) : null}
				</label>
				<div className="topbar__rewards">
					<div className="topbar__reward">
						<span className="topbar__reward-icon" aria-hidden="true">
							<svg
								viewBox="0 0 24 24"
								role="img"
								focusable="false"
								aria-hidden="true"
							>
								<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
							</svg>
						</span>
						<span className="topbar__reward-copy">
							<span className="topbar__reward-label">Streak</span>
							<strong>+{snapshot.streakCount}</strong>
						</span>
					</div>
					<div className="topbar__reward">
						<span className="topbar__reward-icon" aria-hidden="true">
							<svg
								viewBox="0 0 24 24"
								role="img"
								focusable="false"
								aria-hidden="true"
							>
								<path d="M12 2 8.6 8.9 1 10l5.5 5.4L5.2 23 12 19.4 18.8 23l-1.3-7.6L23 10l-7.6-1.1L12 2Z" />
							</svg>
						</span>
						<span className="topbar__reward-copy">
							<span className="topbar__reward-label">Medals reward</span>
							<strong>+{snapshot.medalsRewardCount}</strong>
						</span>
					</div>
				</div>
			</header>

			<main className="app-main">
				<Outlet />
			</main>
		</div>
	);
}
