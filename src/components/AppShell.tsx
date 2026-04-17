import logoUrl from "../../src-tauri/icons/256x256.png";
import { NavLink, Outlet } from "../lib/router";

export function AppShell() {
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
				<div className="topbar__spacer" aria-hidden="true" />
			</header>

			<main className="app-main">
				<Outlet />
			</main>
		</div>
	);
}
