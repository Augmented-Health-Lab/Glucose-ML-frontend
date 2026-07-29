import "./app-shell.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import AppFooter from "./AppFooter";

const moreLinks = [
  {
    label: "Share feedback",
    href: "https://forms.gle/MeYeXDQZKTGz9AbAA",
    icon: "feedback",
  },
  {
    label: "Share CGM dataset",
    href: "https://forms.gle/ni7nZpD8NnLVAh5R6",
    icon: "source",
  },
  {
    label: "Join the community",
    href: "https://forms.gle/L1mv7xLo1zrDSNS7A",
    icon: "community",
  },
];

const MoreMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="app-shell-more" ref={containerRef}>
      <button
        type="button"
        className={`app-shell-link app-shell-more__trigger${
          isOpen ? " app-shell-more__trigger--open" : ""
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
      >
        More
        <span
          className="app-shell-more__chevron"
          aria-hidden="true"
        />
      </button>
      {isOpen ? (
        <div className="app-shell-more__panel">
          <span className="app-shell-more__item app-shell-more__item--disabled">
            <span
              className="app-shell-link__icon app-shell-more__icon--faq"
              aria-hidden="true"
            />
            Frequently asked questions
          </span>
          {moreLinks.map((link) => (
            <a
              key={link.href}
              className="app-shell-more__item"
              href={link.href}
              rel="noreferrer"
              target="_blank"
              onClick={() => setIsOpen(false)}
            >
              <span
                className={`app-shell-link__icon app-shell-more__icon--${link.icon}`}
                aria-hidden="true"
              />
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
};

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
          <MoreMenu />
        </nav>
      </header>
      {children}
      {showFooter ? <AppFooter /> : null}
    </div>
  );
};

export default AppShell;
