import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const readOptionalFile = (url: URL) =>
  existsSync(url) ? readFileSync(url, "utf8") : "";

const appShellTsx = readFileSync(
  new URL("../src/components/app-shell/AppShell.tsx", import.meta.url),
  "utf8"
);
const appFooterTsx = readOptionalFile(
  new URL("../src/components/app-shell/AppFooter.tsx", import.meta.url)
);
const appFooterCss = readOptionalFile(
  new URL("../src/components/app-shell/app-footer.css", import.meta.url)
);

test("app shell renders the Figma footer on every page", () => {
  assert.match(appShellTsx, /import AppFooter/);
  assert.match(appShellTsx, /<AppFooter \/>/);
});

test("footer includes the approved Figma copy and functional destinations", () => {
  assert.match(
    appFooterTsx,
    /An open platform to support data-centric research and development\s+with continuous glucose monitoring datasets\./
  );
  assert.match(appFooterTsx, />PAGES</);
  assert.match(appFooterTsx, />CONTACT</);
  assert.doesNotMatch(appFooterTsx, />LEARN</);
  assert.match(appFooterTsx, /\sExplore\s/);
  assert.match(appFooterTsx, /to="\/background"/);
  assert.match(appFooterTsx, /to="\/about"/);
  assert.match(
    appFooterTsx,
    /href="https:\/\/forms\.gle\/MeYeXDQZKTGz9AbAA"/
  );
  assert.match(
    appFooterTsx,
    /href="https:\/\/forms\.gle\/ni7nZpD8NnLVAh5R6"/
  );
  assert.match(appFooterTsx, /href="mailto:ah-lab@emory\.edu"/);
  assert.match(appFooterTsx, /Share feedback/);
  assert.match(appFooterTsx, /Share dataset/);
  assert.match(appFooterTsx, /© 2026 Augmented Health Lab\. All rights reserved\./);
  assert.match(appFooterTsx, /https:\/\/ah-lab\.t-prioleau\.com\//);
});

test("footer uses the exported Figma logo, page, and contact icon assets", () => {
  assert.match(appFooterTsx, /footer-logo-wordmark\.svg/);
  assert.match(appFooterTsx, /footer-logo-icon-/);
  assert.match(appFooterTsx, /footer-home\.svg/);
  assert.match(appFooterTsx, /footer-background\.svg/);
  assert.match(appFooterTsx, /footer-about\.svg/);
  assert.match(appFooterTsx, /footer-feedback\.svg/);
  assert.match(appFooterTsx, /footer-source\.svg/);
  assert.match(appFooterTsx, /footer-email\.svg/);
});

test("footer matches the desktop Figma geometry and stacks responsively", () => {
  assert.match(
    appFooterCss,
    /\.app-footer\s*\{[^}]*min-height:\s*280px[^}]*background:\s*#e1e8e7/s
  );
  assert.match(
    appFooterCss,
    /\.app-footer__inner\s*\{[^}]*width:\s*min\(1341px,\s*calc\(100%\s*-\s*99px\)\)[^}]*padding:\s*27px\s+0\s+50px/s
  );
  assert.match(
    appFooterCss,
    /\.app-footer__top\s*\{[^}]*grid-template-columns:\s*776px\s+402px[^}]*justify-content:\s*space-between/s
  );
  assert.match(
    appFooterCss,
    /\.app-footer__columns\s*\{[^}]*grid-template-columns:\s*91px\s+171px[^}]*gap:\s*140px/s
  );
  assert.match(
    appFooterCss,
    /@media\s*\(max-width:\s*900px\)[\s\S]*\.app-footer__top\s*\{[^}]*grid-template-columns:\s*1fr/s
  );
});
