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

const readPngSize = (url: URL) => {
  const bytes = readFileSync(url);
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
};

test("raster favicon and Apple touch icon use exact square dimensions", () => {
  assert.match(
    indexHtml,
    /<link rel="icon" type="image\/png" sizes="48x48" href="\/favicon-48x48\.png" \/>/
  );
  assert.match(
    indexHtml,
    /<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon\.png" \/>/
  );
  assert.deepEqual(
    readPngSize(new URL("public/favicon-48x48.png", appRoot)),
    { width: 48, height: 48 }
  );
  assert.deepEqual(
    readPngSize(new URL("public/apple-touch-icon.png", appRoot)),
    { width: 180, height: 180 }
  );
});
