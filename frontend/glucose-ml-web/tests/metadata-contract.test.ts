import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const appRoot = new URL("..", import.meta.url);
const indexHtml = readFileSync(new URL("index.html", appRoot), "utf8");
const iconUrl = new URL("public/glucose-ml-icon.svg", appRoot);

test("public title and site name use the approved Glucose-ML copy", () => {
  assert.match(
    indexHtml,
    /<title>Glucose-ML: Public CGM Datasets for Research<\/title>/
  );
  assert.match(
    indexHtml,
    /<meta property="og:site_name" content="Glucose-ML" \/>/
  );
  assert.doesNotMatch(indexHtml, /glucose-ml-web/);
});

test("the SVG favicon uses the supplied square icon", () => {
  assert.match(
    indexHtml,
    /<link rel="icon" type="image\/svg\+xml" sizes="any" href="\/glucose-ml-icon\.svg" \/>/
  );
  assert.equal(existsSync(iconUrl), true);

  const iconSvg = readFileSync(iconUrl, "utf8");
  const viewBox = iconSvg.match(
    /viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/
  );
  assert.ok(viewBox);
  assert.equal(Number(viewBox[3]), Number(viewBox[4]));
});

test("WebSite JSON-LD identifies the canonical site name and URL", () => {
  const blocks = [
    ...indexHtml.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
    ),
  ].map((match) => JSON.parse(match[1]));
  const website = blocks.find((block) => block["@type"] === "WebSite");

  assert.deepEqual(website, {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Glucose-ML",
    url: "https://www.glucose-ml-project.com/",
  });
});
