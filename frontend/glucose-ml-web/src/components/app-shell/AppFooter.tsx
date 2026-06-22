import { Link } from "react-router-dom";
import "./app-footer.css";

const logoIconLayers = [
  {
    src: "/figma-assets/footer-logo-icon-1.svg",
    className: "app-footer__logo-icon-1",
  },
  {
    src: "/figma-assets/footer-logo-icon-2.svg",
    className: "app-footer__logo-icon-2",
  },
  {
    src: "/figma-assets/footer-logo-icon-3.svg",
    className: "app-footer__logo-icon-3",
  },
  {
    src: "/figma-assets/footer-logo-icon-4.svg",
    className: "app-footer__logo-icon-4",
  },
  {
    src: "/figma-assets/footer-logo-icon-5.svg",
    className: "app-footer__logo-icon-5",
  },
  {
    src: "/figma-assets/footer-logo-icon-6.svg",
    className: "app-footer__logo-icon-6",
  },
];

const AppFooter = () => {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <div className="app-footer__top">
          <div className="app-footer__brand">
            <Link
              to="/"
              className="app-footer__logo"
              aria-label="Glucose-ML home"
            >
              <img
                className="app-footer__logo-wordmark"
                src="/figma-assets/footer-logo-wordmark.svg"
                alt=""
              />
              {logoIconLayers.map((layer) => (
                <img
                  key={layer.src}
                  className={layer.className}
                  src={layer.src}
                  alt=""
                />
              ))}
            </Link>
            <p>
              An open platform to support data-centric research and development
              with continuous glucose monitoring datasets.
            </p>
          </div>

          <div className="app-footer__columns">
            <nav className="app-footer__column" aria-label="Footer pages">
              <h2>PAGES</h2>
              <div className="app-footer__links">
                <Link to="/">
                  <img src="/figma-assets/footer-home.svg" alt="" />
                  Explore
                </Link>
                <Link to="/background">
                  <img src="/figma-assets/footer-background.svg" alt="" />
                  Background
                </Link>
                <Link to="/about">
                  <img src="/figma-assets/footer-about.svg" alt="" />
                  About
                </Link>
              </div>
            </nav>

            <div className="app-footer__column app-footer__contact">
              <h2>CONTACT</h2>
              <div className="app-footer__links">
                <a
                  href="https://forms.gle/MeYeXDQZKTGz9AbAA"
                  rel="noreferrer"
                  target="_blank"
                >
                  <img src="/figma-assets/footer-feedback.svg" alt="" />
                  Share feedback
                </a>
                <a
                  href="https://forms.gle/ni7nZpD8NnLVAh5R6"
                  rel="noreferrer"
                  target="_blank"
                >
                  <img src="/figma-assets/footer-source.svg" alt="" />
                  Share dataset
                </a>
                <a href="mailto:ah-lab@emory.edu">
                  <img src="/figma-assets/footer-email.svg" alt="" />
                  ah-lab@emory.edu
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="app-footer__divider" />

        <div className="app-footer__legal">
          <span>© 2026 Augmented Health Lab. All rights reserved.</span>
          <a
            href="https://ah-lab.t-prioleau.com/"
            rel="noreferrer"
            target="_blank"
          >
            https://ah-lab.t-prioleau.com/
          </a>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
