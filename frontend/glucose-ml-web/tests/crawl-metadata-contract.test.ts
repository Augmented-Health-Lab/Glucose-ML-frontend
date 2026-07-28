import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  SITE_ORIGIN,
  STATIC_PATHS,
  buildSitemapXml,
  datasetPaths,
} from "../scripts/sitemap.ts";

const appRoot = new URL("..", import.meta.url);
const robotsTxt = readFileSync(new URL("public/robots.txt", appRoot), "utf8");
const cardTitles = (
  JSON.parse(
    readFileSync(
      new URL("public/static_data/dataset_card_info.json", appRoot),
      "utf8"
    )
  ) as { title: string }[]
).map((card) => card.title);

test("robots.txt lets crawlers in and points at the sitemap", () => {
  assert.match(robotsTxt, /^User-agent: \*$/m);
  assert.match(robotsTxt, /^Allow: \/$/m);
  assert.match(
    robotsTxt,
    new RegExp(`^Sitemap: ${SITE_ORIGIN}/sitemap\\.xml$`, "m")
  );
  assert.doesNotMatch(robotsTxt, /^Disallow: \/$/m);
});

test("sitemap covers the crawlable static routes", () => {
  assert.deepEqual(STATIC_PATHS, ["/", "/background", "/about"]);
  // /compare renders from client-held selection state, so it has no
  // standalone content worth indexing.
  assert.equal(STATIC_PATHS.includes("/compare"), false);
});

test("dataset paths are URL-encoded so titles with spaces resolve", () => {
  assert.deepEqual(datasetPaths(["Hall 2018", "AI-READI"]), [
    "/dataset/Hall%202018",
    "/dataset/AI-READI",
  ]);
});

test("sitemap XML lists every static route and every dataset page", () => {
  const xml = buildSitemapXml([
    ...STATIC_PATHS,
    ...datasetPaths(cardTitles),
  ]);

  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n/);
  assert.match(
    xml,
    /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/
  );

  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1]
  );
  assert.equal(locs.length, STATIC_PATHS.length + cardTitles.length);
  assert.equal(new Set(locs).size, locs.length);
  assert.ok(locs.includes(`${SITE_ORIGIN}/`));
  assert.ok(locs.includes(`${SITE_ORIGIN}/background`));

  for (const title of cardTitles) {
    assert.ok(
      locs.includes(`${SITE_ORIGIN}/dataset/${encodeURIComponent(title)}`),
      `sitemap is missing the detail page for ${title}`
    );
  }
});

test("unmatched paths fall through to a real 404 instead of the SPA shell", () => {
  const vercelConfig = JSON.parse(
    readFileSync(new URL("../../vercel.json", appRoot), "utf8")
  ) as { rewrites: { source: string; destination: string }[] };

  // A catch-all rewrite makes every bogus URL answer 200 with the app shell,
  // which Google reads as a soft 404.
  for (const rewrite of vercelConfig.rewrites) {
    assert.notEqual(rewrite.source, "/(.*)");
    assert.notEqual(rewrite.source, "/(.*)/");
  }

  // Every client route except "/" (served straight off the filesystem) needs a
  // rewrite, or a deep link would 404 on hard refresh.
  const appRoutes = [
    ...readFileSync(new URL("src/app/App.tsx", appRoot), "utf8").matchAll(
      /<Route path="([^"]+)"/g
    ),
  ].map((match) => match[1]);
  const sources = vercelConfig.rewrites.map((rewrite) => rewrite.source);

  for (const route of appRoutes) {
    if (route === "/") continue;
    const covered = sources.some((source) =>
      route.startsWith("/dataset/")
        ? source.startsWith("/dataset/")
        : source.includes(route.slice(1))
    );
    assert.ok(covered, `no rewrite covers the ${route} route`);
  }
});

test("the 404 page stands alone and keeps itself out of the index", () => {
  const notFound = readFileSync(new URL("public/404.html", appRoot), "utf8");

  assert.match(notFound, /<meta name="robots" content="noindex" \/>/);
  assert.match(notFound, /<title>Page not found — Glucose-ML<\/title>/);
  assert.match(notFound, /href="\/"/);
  // No bundle reference: the page has to render even mid-deploy, and Vite
  // only rewrites asset URLs in index.html, not files copied from public/.
  assert.doesNotMatch(notFound, /<script/);
  assert.doesNotMatch(notFound, /assets\//);
});

test("every sitemap URL is absolute and on the canonical www origin", () => {
  const xml = buildSitemapXml([...STATIC_PATHS, ...datasetPaths(cardTitles)]);

  for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    assert.ok(
      loc.startsWith("https://www.glucose-ml-project.com/"),
      `${loc} is not on the canonical origin`
    );
  }
});
