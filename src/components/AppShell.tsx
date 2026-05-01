import logoUrl from "../../src-tauri/icons/256x256.png";
import { useUserSnapshot } from "../features/user/hooks";
import { NavLink, Outlet } from "../lib/router";

export function AppShell() {
	const { snapshot } = useUserSnapshot();

	return (
		<div className="app-shell">
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
				<div className="topbar__streak">
					<span className="topbar__streak-icon" aria-hidden="true">
						<svg
							viewBox="0 0 24 24"
							role="img"
							focusable="false"
							aria-hidden="true"
						>
							<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
						</svg>
					</span>
					<span className="topbar__streak-copy">
						<span className="topbar__streak-label">Streak</span>
						<strong>+{snapshot.streakCount}</strong>
					</span>
				</div>
			</header>

			<main className="app-main">
				<Outlet />
			</main>
		</div>
	);
}
