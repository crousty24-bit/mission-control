import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'

interface RouterContextValue {
  pathname: string
  navigate: (to: string) => void
}

interface RouteProps {
  path?: string
  index?: boolean
  element: ReactElement
  children?: ReactNode
}

interface NavLinkClassNameArgs {
  isActive: boolean
}

interface NavLinkProps {
  to: string
  end?: boolean
  className?: string | ((args: NavLinkClassNameArgs) => string)
  children: ReactNode
}

interface LinkProps {
  to: string
  className?: string
  children: ReactNode
}

const RouterContext = createContext<RouterContextValue | null>(null)
const OutletContext = createContext<ReactNode>(null)

function normalize(pathname: string) {
  if (pathname === '/') {
    return pathname
  }

  return pathname.replace(/\/+$/, '')
}

function isRouteElement(child: ReactNode): child is ReactElement<RouteProps> {
  return isValidElement(child) && child.type === Route
}

function isMatch(pathname: string, route: RouteProps) {
  if (route.index) {
    return pathname === '/'
  }

  if (!route.path) {
    return true
  }

  return normalize(pathname) === normalize(route.path)
}

function renderRoutes(children: ReactNode, pathname: string): ReactNode {
  const routes = Children.toArray(children).filter(isRouteElement)
  const match = routes.find((route) => isMatch(pathname, route.props))

  if (!match) {
    return null
  }

  if (match.props.children) {
    const nestedContent = renderRoutes(match.props.children, pathname)
    return (
      <OutletContext.Provider value={nestedContent}>
        {cloneElement(match.props.element)}
      </OutletContext.Provider>
    )
  }

  return cloneElement(match.props.element)
}

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(() => window.location.pathname || '/')

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || '/')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const contextValue = useMemo<RouterContextValue>(
    () => ({
      pathname,
      navigate: (to: string) => {
        if (to === pathname) {
          return
        }

        window.history.pushState({}, '', to)
        setPathname(to)
      },
    }),
    [pathname],
  )

  return <RouterContext.Provider value={contextValue}>{children}</RouterContext.Provider>
}

export function Routes({ children }: { children: ReactNode }) {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('Routes must be used inside BrowserRouter')
  }

  return <>{renderRoutes(children, context.pathname)}</>
}

export function Route(props: RouteProps) {
  void props
  return null
}

export function Outlet() {
  return <>{useContext(OutletContext)}</>
}

export function Link({ to, className, children }: LinkProps) {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('Link must be used inside BrowserRouter')
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    context.navigate(to)
  }

  return (
    <a href={to} className={className} onClick={handleClick}>
      {children}
    </a>
  )
}

export function NavLink({ to, end = false, className, children }: NavLinkProps) {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('NavLink must be used inside BrowserRouter')
  }

  const currentPath = normalize(context.pathname)
  const targetPath = normalize(to)
  const isActive = end ? currentPath === targetPath : currentPath.startsWith(targetPath)

  const resolvedClassName =
    typeof className === 'function' ? className({ isActive }) : className

  return (
    <Link to={to} className={resolvedClassName}>
      {children}
    </Link>
  )
}
