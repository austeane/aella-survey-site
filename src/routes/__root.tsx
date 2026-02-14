import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

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
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/columns", label: "Browse Topics" },
  { to: "/profile", label: "Build a Profile" },
  { to: "/relationships", label: "What's Connected?" },
  { to: "/sql", label: "SQL Console" },
  { to: "/notebook", label: "Notebook" },
  { to: "/data-quality", label: "Data Quality" },
  { to: "/about", label: "About" },
] as const;

function RootComponent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <DuckDBProvider>
      <div className="app-shell">
        <nav className="app-nav">
          <div className="nav-inner">
            <Link to="/" className="brand-link">
              <span className="brand-title">Big Kink Survey Explorer</span>
              <span className="brand-subtitle">Question-First Research Explorer</span>
            </Link>
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-links"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? "Close" : "Menu"}
            </button>
            <div className="nav-links nav-links--desktop">
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
          <div id="mobile-nav-links" className={`nav-links-mobile ${mobileMenuOpen ? "nav-links-mobile--open" : ""}`}>
            {navLinks.map((link) => (
              <Link
                key={`mobile-${link.to}`}
                to={link.to}
                className="nav-link nav-link--mobile"
                activeProps={{ className: "nav-link nav-link--mobile nav-link-active" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </DuckDBProvider>
  );
}
