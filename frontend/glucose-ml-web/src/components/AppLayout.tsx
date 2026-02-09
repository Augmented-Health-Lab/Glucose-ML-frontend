import { Outlet, Link, useLocation } from "react-router-dom";
import "./AppLayout.css";

export default function AppLayout() {
  const location = useLocation();
  const isDetailPage = location.pathname.startsWith("/dataset/");

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className={isDetailPage ? "app-header-inner" : "container-lg"}>
          <Link to="/" className="app-logo" aria-label="Glucose + ML - Home">
            <img
              src="/icon/glucose-ml-logo_horizontal.svg"
              alt="Glucose + ML Precision Medicine Lab"
              className="app-logo-img"
            />
          </Link>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
