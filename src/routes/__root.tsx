import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";

import { DuckDBProvider } from "@/lib/duckdb/provider";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Big Kink Survey Explorer" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const navLinks = [
  { to: "/about", label: "About" },
  { to: "/", label: "Dashboard" },
  { to: "/explore", label: "Explore" },
  { to: "/columns", label: "Columns" },
  { to: "/profile", label: "Profile" },
  { to: "/relationships", label: "Relationships" },
  { to: "/sql", label: "SQL" },
  { to: "/notebook", label: "Notebook" },
] as const;

function RootComponent() {
  return (
    <DuckDBProvider>
      <div className="app-shell">
        <nav className="app-nav">
          <div className="nav-inner">
            <Link to="/" className="brand-link">
              <span className="brand-title">Big Kink Survey Explorer</span>
              <span className="brand-subtitle">Editorial Analysis Workspace</span>
            </Link>
            <div className="nav-links">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="nav-link"
                  activeProps={{ className: "nav-link nav-link-active" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </DuckDBProvider>
  );
}
