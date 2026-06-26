import "./app-shell.css";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import AppFooter from "./AppFooter";

const AppShell = ({
  children,
  showFooter = true,
}: {
  children: ReactNode;
  showFooter?: boolean;
}) => {
  return (
    <div className="app-shell">
      <header className="app-shell-nav">
        <Link to="/" className="app-shell-logo" aria-label="Glucose-ML home">
          <img src="/glucose-ml-logo.svg" alt="Glucose-ML" />
        </Link>
        <nav className="app-shell-links" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `app-shell-link${isActive ? " app-shell-link--active" : ""}`
            }
          >
            <span
              className="app-shell-link__icon app-shell-link__icon--home"
              aria-hidden="true"
            />
            Explore
          </NavLink>
          <NavLink
            to="/background"
            className={({ isActive }) =>
              `app-shell-link${isActive ? " app-shell-link--active" : ""}`
            }
          >
            <span
              className="app-shell-link__icon app-shell-link__icon--background"
              aria-hidden="true"
            />
            Background
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `app-shell-link${isActive ? " app-shell-link--active" : ""}`
            }
          >
            <span
              className="app-shell-link__icon app-shell-link__icon--about"
              aria-hidden="true"
            />
            About
          </NavLink>
        </nav>
      </header>
      {children}
      {showFooter ? <AppFooter /> : null}
    </div>
  );
};

export default AppShell;
