import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const read = (path: string) => {
  const url = new URL(path, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
};

const app = read("../src/app/App.tsx");
const shell = read("../src/components/app-shell/AppShell.tsx");
const page = read("../src/features/about/AboutPage.tsx");
const css = read("../src/features/about/about-page.css");

const contributorImagePaths = [
  "/contributors/temi-prioleau.jpg",
  "/contributors/ryan-pontius.jpg",
  "/contributors/pam-pitakanonda.jpg",
  "/contributors/leo-ding.jpg",
  "/contributors/diego-guzman-gonzalez.png",
  "/contributors/wai-yan-chan.jpg",
  "/contributors/zimo-li.jpg",
];

test("registers a dedicated About route in the shared shell", () => {
  assert.match(app, /import AboutPage/);
  assert.match(app, /path="\/about" element=\{<AboutPage \/>\}/);
  assert.match(shell, /<NavLink[\s\S]*to="\/about"[\s\S]*className=\{\(\{ isActive \}\)/);
});

test("renders the approved About sections with real contributor and publication content", () => {
  assert.match(page, /<AppShell>/);
  assert.doesNotMatch(page, /showFooter=\{false\}/);
  assert.match(page, />ABOUT</);
  assert.doesNotMatch(page, /ABOUT THE GLUCOSE ML PROJECT/);
  assert.match(page, /Accelerating data-driven research for diabetes/);
  assert.match(page, /The Glucose-ML project is an evolving collection/);
  assert.match(page, /Our mission/);
  assert.match(page, /Bridge the data gap/);
  assert.match(page, /How it works/);
  assert.match(page, /Explore & Discover/);
  assert.match(page, /Visualize & Compare/);
  assert.match(page, /Access & Build/);
  assert.match(page, /Who we are/);
  assert.doesNotMatch(page, /<h2 id="about-lab-title">Augmented Health Lab<\/h2>/);
  assert.match(page, /Professor/);
  assert.match(page, /Temi Prioleau/);
  assert.match(page, /https:\/\/www\.t-prioleau\.com\//);
  assert.match(page, /Current Contributors/);
  assert.match(page, /Temi Prioleau/);
  assert.match(page, /Project Lead/);
  assert.match(page, /Ryan Pontius/);
  assert.match(page, /Research Data Engineer/);
  assert.match(page, /Pam Pitakanonda/);
  assert.match(page, /UI\/UX Designer/);
  assert.match(page, /Leo Ding/);
  assert.match(page, /Frontend Developer/);
  assert.match(page, /Diego Guzman Gonzalez/);
  assert.match(page, /Qualitative Researcher/);
  assert.match(page, /Wai Yan Chan/);
  assert.match(page, /Research Intern/);
  assert.match(page, /Zimo Li/);
  for (const imagePath of contributorImagePaths) {
    assert.match(page, new RegExp(imagePath.replaceAll("/", "\\/").replace(".", "\\.")));
  }
  assert.match(page, /Past Contributors/);
  assert.match(page, /Kultum Lhabaik \(Frontend Developer\)/);
  assert.match(page, /Publications/);
  assert.match(
    page,
    /Prioleau, T\., Lu, B\. Cui, Y\. \(2025\)\. Glucose-ML: A collection of longitudinal diabetes datasets for development of robust AI solutions\. arXiv\. https:\/\/doi\.org\/10\.48550\/arXiv\.2507\.14077\./
  );
  assert.match(page, /url: "https:\/\/doi\.org\/10\.48550\/arXiv\.2507\.14077"/);
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
  assert.match(page, /https:\/\/www\.t-prioleau\.com\//);
});

test("loads contributor portraits efficiently with stable dimensions", () => {
  assert.match(page, /loading="lazy"/);
  assert.match(page, /decoding="async"/);
  assert.match(page, /width=\{156\}/);
  assert.match(page, /height=\{156\}/);
});

test("ships optimized contributor portrait assets", () => {
  for (const imagePath of contributorImagePaths) {
    const asset = new URL(`../public${imagePath}`, import.meta.url);
    assert.equal(existsSync(asset), true, `${imagePath} should exist`);
    assert.ok(
      statSync(asset).size <= 250 * 1024,
      `${imagePath} should stay under 250 KB`
    );
  }
});

test("defines Figma desktop grids and responsive collapse", () => {
  assert.match(
    css,
    /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/
  );
  assert.match(css, /grid-template-columns:\s*175px\s+minmax\(0,\s*954px\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(5,\s*172px\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
});

test("pins the measured Figma desktop geometry", () => {
  assert.match(page, /className="about-hero__message"/);
  assert.match(css, /\.about-hero\s*\{[^}]*height:\s*305px/s);
  assert.match(css, /\.about-hero__content\s*\{[^}]*gap:\s*9px/s);
  assert.match(css, /\.about-hero__content\s*\{[^}]*padding-block:\s*60px 24px/s);
  assert.match(css, /\.about-hero__copy\s*\{[^}]*gap:\s*8px/s);
  assert.match(css, /\.about-hero\s*\{[^}]*background:\s*#3ba7a1/s);
  assert.match(css, /\.about-hero h1\s*\{[^}]*color:\s*#fff/s);
  assert.match(css, /\.about-primary-action\s*\{[^}]*background:\s*#fff/s);
  assert.match(css, /\.about-primary-action\s*\{[^}]*color:\s*#2f8c88/s);
  assert.match(css, /\.about-mission\s*\{[^}]*min-height:\s*336px/s);
  assert.match(css, /\.about-mission\s*\{[^}]*background:\s*#fff/s);
  assert.match(page, /className="about-mission__item"/);
  assert.match(page, /className="about-mission__marker"/);
  assert.match(page, /<strong>\{item\.lead\}<\/strong>/);
  assert.match(css, /\.about-mission__copy\s*\{[^}]*gap:\s*24px/s);
  assert.match(css, /\.about-mission__marker::before\s*\{[^}]*border:\s*2px solid #3ba7a1/s);
  assert.match(css, /\.about-mission__item:not\(:last-child\)::after\s*\{[^}]*width:\s*min\(100%,\s*850px\)/s);
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
