import {
	Children,
	cloneElement,
	createContext,
	isValidElement,
	type MouseEvent,
	type ReactElement,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

interface RouterContextValue {
	createHref: (to: string) => string;
	pathname: string;
	navigate: (to: string) => void;
}

interface RouteProps {
	path?: string;
	index?: boolean;
	element: ReactElement;
	children?: ReactNode;
}

interface NavLinkClassNameArgs {
	isActive: boolean;
}

interface NavLinkProps {
	to: string;
	end?: boolean;
	className?: string | ((args: NavLinkClassNameArgs) => string);
	children: ReactNode;
}

interface LinkProps {
	to: string;
	className?: string;
	children: ReactNode;
}

const RouterContext = createContext<RouterContextValue | null>(null);
const OutletContext = createContext<ReactNode>(null);

function normalize(pathname: string) {
	if (pathname === "/") {
		return pathname;
	}

	return pathname.replace(/\/+$/, "");
}

function isRouteElement(child: ReactNode): child is ReactElement<RouteProps> {
	return isValidElement(child) && child.type === Route;
}

function isMatch(pathname: string, route: RouteProps) {
	if (route.index) {
		return pathname === "/";
	}

	if (!route.path) {
		return true;
	}

	return normalize(pathname) === normalize(route.path);
}

function renderRoutes(children: ReactNode, pathname: string): ReactNode {
	const routes = Children.toArray(children).filter(isRouteElement);
	const match = routes.find((route) => isMatch(pathname, route.props));

	if (!match) {
		return null;
	}

	if (match.props.children) {
		const nestedContent = renderRoutes(match.props.children, pathname);
		return (
			<OutletContext.Provider value={nestedContent}>
				{cloneElement(match.props.element)}
			</OutletContext.Provider>
		);
	}

	return cloneElement(match.props.element);
}

interface BrowserRouterProps {
	children: ReactNode;
	useHashRouting?: boolean;
}

function getHashPathname() {
	const hashPath = window.location.hash.replace(/^#/, "");
	return hashPath || "/";
}

function getBrowserPathname(useHashRouting: boolean) {
	return useHashRouting ? getHashPathname() : window.location.pathname || "/";
}

export function BrowserRouter({
	children,
	useHashRouting = false,
}: BrowserRouterProps) {
	const [pathname, setPathname] = useState(() =>
		getBrowserPathname(useHashRouting),
	);

	useEffect(() => {
		const eventName = useHashRouting ? "hashchange" : "popstate";
		const onNavigation = () => setPathname(getBrowserPathname(useHashRouting));
		window.addEventListener(eventName, onNavigation);
		return () => window.removeEventListener(eventName, onNavigation);
	}, [useHashRouting]);

	const contextValue = useMemo<RouterContextValue>(
		() => ({
			createHref: (to: string) => (useHashRouting ? `#${to}` : to),
			pathname,
			navigate: (to: string) => {
				if (to === pathname) {
					return;
				}

				if (useHashRouting) {
					window.location.hash = to;
				} else {
					window.history.pushState({}, "", to);
				}
				setPathname(to);
			},
		}),
		[pathname, useHashRouting],
	);

	return (
		<RouterContext.Provider value={contextValue}>
			{children}
		</RouterContext.Provider>
	);
}

export function Routes({ children }: { children: ReactNode }) {
	const context = useContext(RouterContext);
	if (!context) {
		throw new Error("Routes must be used inside BrowserRouter");
	}

	return <>{renderRoutes(children, context.pathname)}</>;
}

export function Route(props: RouteProps) {
	void props;
	return null;
}

export function Outlet() {
	return <>{useContext(OutletContext)}</>;
}

export function Link({ to, className, children }: LinkProps) {
	const context = useContext(RouterContext);
	if (!context) {
		throw new Error("Link must be used inside BrowserRouter");
	}

	const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		context.navigate(to);
	};

	return (
		<a
			href={context.createHref(to)}
			className={className}
			onClick={handleClick}
		>
			{children}
		</a>
	);
}

export function NavLink({
	to,
	end = false,
	className,
	children,
}: NavLinkProps) {
	const context = useContext(RouterContext);
	if (!context) {
		throw new Error("NavLink must be used inside BrowserRouter");
	}

	const currentPath = normalize(context.pathname);
	const targetPath = normalize(to);
	const isActive = end
		? currentPath === targetPath
		: currentPath.startsWith(targetPath);

	const resolvedClassName =
		typeof className === "function" ? className({ isActive }) : className;

	return (
		<Link to={to} className={resolvedClassName}>
			{children}
		</Link>
	);
}
