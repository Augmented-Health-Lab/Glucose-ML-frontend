import "./app-shell.css";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
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
          <Link to="/" className="app-shell-link">
            <img src="/figma-assets/nav-home.svg" alt="" />
            Explore
          </Link>
          <Link to="/background" className="app-shell-link">
            <img src="/figma-assets/nav-background.svg" alt="" />
            Background
          </Link>
          <Link to="/about" className="app-shell-link">
            <img src="/figma-assets/nav-about.svg" alt="" />
            About
          </Link>
        </nav>
      </header>
      {children}
      {showFooter ? <AppFooter /> : null}
    </div>
  );
};

export default AppShell;
