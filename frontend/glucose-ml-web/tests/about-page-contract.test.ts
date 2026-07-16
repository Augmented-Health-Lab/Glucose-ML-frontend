import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => {
  const url = new URL(path, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
};

const app = read("../src/app/App.tsx");
const shell = read("../src/components/app-shell/AppShell.tsx");
const page = read("../src/features/about/AboutPage.tsx");
const css = read("../src/features/about/about-page.css");

test("registers a dedicated About route in the shared shell", () => {
  assert.match(app, /import AboutPage/);
  assert.match(app, /path="\/about" element=\{<AboutPage \/>\}/);
  assert.match(shell, /<NavLink[\s\S]*to="\/about"[\s\S]*className=\{\(\{ isActive \}\)/);
});

test("renders the approved About sections with real contributor and publication content", () => {
  assert.match(page, /<AppShell>/);
  assert.doesNotMatch(page, /showFooter=\{false\}/);
  assert.match(page, /ABOUT THE GLUCOSE ML PROJECT/);
  assert.match(page, /Accelerating data-driven research for diabetes/);
  assert.match(page, /Glucose-ML is an evolving collection/);
  assert.match(page, /Our mission/);
  assert.match(page, /Bridge the data gap/);
  assert.match(page, /How it works/);
  assert.match(page, /Explore & Discover/);
  assert.match(page, /Visualize & Compare/);
  assert.match(page, /Access & Build/);
  assert.match(page, /Who we are/);
  assert.doesNotMatch(page, /<h2 id="about-lab-title">Augmented Health Lab<\/h2>/);
  assert.match(page, /Past Contributors/);
  assert.match(page, /Kultum Lhabaik \(Frontend Developer\)/);
  assert.match(page, /Publications/);
  assert.match(
    page,
    /Glucose-ML: A collection of longitudinal diabetes datasets for development of robust AI solutions/
  );
  assert.match(page, /https:\/\/arxiv\.org\/abs\/2507\.14077/);
  assert.doesNotMatch(page, /title: "Publication name details"/);
  assert.doesNotMatch(page, /placeholder-publication/);
  assert.doesNotMatch(page, /Firstname Lastname/);
  assert.doesNotMatch(page, /placeholder-contributor/);
  assert.doesNotMatch(page, /Placeholder contributor portrait/);
  assert.doesNotMatch(css, /\.about-lab\s*\{[^}]*min-height:\s*1103px/s);
});

test("uses the supplied forms and direct contact destinations", () => {
  assert.match(page, /https:\/\/forms\.gle\/MeYeXDQZKTGz9AbAA/);
  assert.match(page, /https:\/\/forms\.gle\/ni7nZpD8NnLVAh5R6/);
  assert.match(page, /mailto:ah-lab@emory\.edu/);
  assert.match(page, /https:\/\/ah-lab\.t-prioleau\.com\//);
});

test("defines Figma desktop grids and responsive collapse", () => {
  assert.match(
    css,
    /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/
  );
  assert.match(css, /grid-template-columns:\s*175px\s+minmax\(0,\s*882px\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(5,\s*172px\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
});

test("pins the measured Figma desktop geometry", () => {
  assert.match(page, /className="about-hero__message"/);
  assert.match(css, /\.about-hero\s*\{[^}]*min-height:\s*325px/s);
  assert.match(css, /\.about-hero\s*\{[^}]*background:\s*#3ba7a1/s);
  assert.match(css, /\.about-hero h1\s*\{[^}]*color:\s*#fff/s);
  assert.match(css, /\.about-primary-action\s*\{[^}]*background:\s*#fff/s);
  assert.match(css, /\.about-primary-action\s*\{[^}]*color:\s*#2f8c88/s);
  assert.match(css, /\.about-mission\s*\{[^}]*min-height:\s*288px/s);
  assert.match(css, /\.about-mission\s*\{[^}]*background:\s*#fff/s);
  assert.match(css, /\.about-hero__message\s*\{[^}]*gap:\s*8px/s);
  assert.match(css, /\.about-how\s*\{[^}]*min-height:\s*418px/s);
  assert.match(css, /\.about-info-card\s*\{[^}]*height:\s*162px/s);
  assert.match(css, /\.about-contributor\s*\{[^}]*min-height:\s*216px/s);
  assert.match(css, /\.about-contact\s*\{[^}]*min-height:\s*377px/s);
  assert.match(css, /\.about-contact__grid\s*\{[^}]*height:\s*209px/s);
  assert.match(css, /\.about-contact-card\s*\{[^}]*height:\s*207px/s);
  assert.match(css, /\.about-page\s*\{[^}]*padding-bottom:\s*34px/s);
  assert.match(css, /\.about-page\s*\{[^}]*font-optical-sizing:\s*none/s);
});
