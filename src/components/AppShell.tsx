import { NavLink, Outlet } from '../lib/router'

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Dev Command Center</p>
          <h1 className="brand">Mission Control</h1>
        </div>
        <nav className="topnav" aria-label="Navigation principale">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'topnav__link topnav__link--active' : 'topnav__link'
            }
            end
          >
            Accueil
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? 'topnav__link topnav__link--active' : 'topnav__link'
            }
          >
            Dashboard
          </NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
