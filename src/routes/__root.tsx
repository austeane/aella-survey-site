import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { FeedbackDialog } from "@/components/feedback-dialog";
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

type ExploreChildLink = {
  to: "/explore/crosstab" | "/columns" | "/profile" | "/relationships" | "/data-quality";
  label: string;
  description: string;
};

const desktopNavLinks = [
  { to: "/", label: "Home" },
  { to: "/sql", label: "SQL Console" },
  { to: "/notebook", label: "Notebook" },
  { to: "/about", label: "About" },
] as const;

const exploreChildLinks: ExploreChildLink[] = [
  {
    to: "/explore/crosstab",
    label: "Compare Questions",
    description: "Cross-tab two questions and inspect specific cells.",
  },
  {
    to: "/columns",
    label: "Browse Topics",
    description: "Search and filter all survey questions.",
  },
  {
    to: "/profile",
    label: "Build a Profile",
    description: "Define one or two groups and see what over-indexes.",
  },
  {
    to: "/relationships",
    label: "What's Connected?",
    description: "Find the strongest question-to-question associations.",
  },
  {
    to: "/data-quality",
    label: "Data Quality",
    description: "Check missingness and caveats before interpreting.",
  },
];

const mobileExploreLinks = [
  { to: "/explore", label: "Explore Home" },
  ...exploreChildLinks.map((link) => ({ to: link.to, label: link.label })),
] as const;

const exploreGroupPaths = new Set([
  "/explore",
  "/explore/crosstab",
  "/columns",
  "/profile",
  "/relationships",
  "/data-quality",
]);

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isExploreGroupActive = exploreGroupPaths.has(pathname);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setMobileExploreOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false);
        setMobileExploreOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) return;
    setMobileExploreOpen(false);
  }, [mobileMenuOpen]);

  const closeMobileMenus = () => {
    setMobileMenuOpen(false);
    setMobileExploreOpen(false);
  };

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
              <Link
                to={desktopNavLinks[0].to}
                className="nav-link"
                activeProps={{ className: "nav-link nav-link-active" }}
              >
                {desktopNavLinks[0].label}
              </Link>

              <div className="nav-dropdown">
                <Link
                  to="/explore"
                  className={`nav-link nav-link--featured ${isExploreGroupActive ? "nav-link-active" : ""}`}
                >
                  <span className="nav-feature-glyph" aria-hidden="true">
                    ✦
                  </span>
                  <span>Explore</span>
                  <span className="nav-feature-caret" aria-hidden="true">
                    ▾
                  </span>
                </Link>

                <div className="nav-dropdown-menu" aria-label="Explore pages">
                  {exploreChildLinks.map((link) => (
                    <Link key={link.to} to={link.to} className="nav-dropdown-item" aria-label={link.label}>
                      <span className="nav-dropdown-item-label">{link.label}</span>
                      <span className="nav-dropdown-item-description">{link.description}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {desktopNavLinks.slice(1).map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="nav-link"
                  activeProps={{ className: "nav-link nav-link-active" }}
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                className="nav-link"
                onClick={() => setFeedbackOpen(true)}
              >
                Feedback
              </button>
            </div>
          </div>

          <div id="mobile-nav-links" className={`nav-links-mobile ${mobileMenuOpen ? "nav-links-mobile--open" : ""}`}>
            <Link
              to="/"
              className="nav-link nav-link--mobile"
              activeProps={{ className: "nav-link nav-link--mobile nav-link-active" }}
              onClick={closeMobileMenus}
            >
              Home
            </Link>

            <button
              type="button"
              className={`nav-link nav-link--mobile nav-link--mobile-group ${isExploreGroupActive ? "nav-link-active" : ""}`}
              aria-expanded={mobileExploreOpen}
              aria-controls="mobile-explore-links"
              onClick={() => setMobileExploreOpen((open) => !open)}
            >
              <span className="nav-mobile-group-label">
                <span className="nav-feature-glyph" aria-hidden="true">
                  ✦
                </span>{" "}
                Explore
              </span>
              <span className="nav-mobile-group-icon" aria-hidden="true">
                {mobileExploreOpen ? "−" : "+"}
              </span>
            </button>

            <div
              id="mobile-explore-links"
              className={`nav-mobile-subitems ${mobileExploreOpen ? "nav-mobile-subitems--open" : ""}`}
            >
              {mobileExploreLinks.map((link) => (
                <Link
                  key={`mobile-${link.to}`}
                  to={link.to}
                  className="nav-link nav-link--mobile nav-link--mobile-sub"
                  activeProps={{ className: "nav-link nav-link--mobile nav-link--mobile-sub nav-link-active" }}
                  onClick={closeMobileMenus}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {desktopNavLinks.slice(1).map((link) => (
              <Link
                key={`mobile-${link.to}`}
                to={link.to}
                className="nav-link nav-link--mobile"
                activeProps={{ className: "nav-link nav-link--mobile nav-link-active" }}
                onClick={closeMobileMenus}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              className="nav-link nav-link--mobile"
              onClick={() => {
                closeMobileMenus();
                setFeedbackOpen(true);
              }}
            >
              Feedback
            </button>
          </div>
        </nav>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </DuckDBProvider>
  );
}
