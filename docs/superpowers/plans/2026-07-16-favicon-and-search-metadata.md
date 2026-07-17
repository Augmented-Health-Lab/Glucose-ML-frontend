# Favicon and Search Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public browser/search favicon with the supplied square Glucose-ML icon and publish the approved page title and Google site-name metadata.

**Architecture:** Keep all public metadata in the Vite HTML entry point and all icon files in Vite's `public/` directory so the existing build copies them unchanged. Protect the behavior with source-level Node contract tests, then verify the generated `dist/` output. Narrowly update the repository-release contract to allow only Superpowers Markdown plans/specs under the newly required root `docs/` directory.

**Tech Stack:** Vite 7, React 19, static HTML metadata, SVG/PNG assets, Node 24 test runner, macOS `sips`, ESLint, Vercel static deployment.

## Global Constraints

- Production home page: `https://www.glucose-ml-project.com/`.
- Browser tab and preferred title link: `Glucose-ML: Public CGM Datasets for Research`.
- Preferred Google site name and `og:site_name`: `Glucose-ML`.
- Use `.superset/attachments/Glucose_ML_Logo__1_.svg` as the sole source artwork for all new icon assets.
- Do not change `AppShell`, `AppFooter`, their logo assets, `frontend/glucose-ml-web/package.json`, `vercel.json`, or Vercel project settings.
- Do not add a sitemap, robots file, organization schema, social preview artwork, or broader SEO changes.

---

## File Structure

- Modify `frontend/glucose-ml-web/index.html`: favicon links, public title, Open Graph site name, and `WebSite` JSON-LD.
- Create `frontend/glucose-ml-web/public/glucose-ml-icon.svg`: exact supplied square source artwork.
- Create `frontend/glucose-ml-web/public/favicon-48x48.png`: 48x48 raster derivative of the supplied icon.
- Create `frontend/glucose-ml-web/public/apple-touch-icon.png`: 180x180 raster derivative of the supplied icon.
- Create `frontend/glucose-ml-web/tests/metadata-contract.test.ts`: source metadata, icon reference, structured-data, and image-dimension contracts.
- Modify `frontend/glucose-ml-web/tests/public-release-contract.test.ts`: continue excluding private/root documentation while allowing only `docs/superpowers/plans/*.md` and `docs/superpowers/specs/*.md` process files.

### Task 1: Preserve the public-release contract with scoped process docs

**Files:**
- Modify: `frontend/glucose-ml-web/tests/public-release-contract.test.ts:62-78`
- Test: `frontend/glucose-ml-web/tests/public-release-contract.test.ts`

**Interfaces:**
- Consumes: root `docs/superpowers/plans/*.md` and `docs/superpowers/specs/*.md` files required by the approved workflow.
- Produces: a repository contract that still rejects all other files under root `docs/`.

- [ ] **Step 1: Run the existing release contract and verify the new docs directory causes the expected failure**

Run:

```bash
cd frontend/glucose-ml-web
node --test tests/public-release-contract.test.ts
```

Expected: FAIL in `public repository excludes private and research-source directories` because root `docs` now exists.

- [ ] **Step 2: Narrow the forbidden-root list and add an explicit process-doc allowlist test**

Remove only the `"docs",` entry from the array in `public repository excludes private and research-source directories`. Immediately after that test, add:

```ts
test("root docs contain only Superpowers plans and specs", () => {
  const docsRoot = path.join(repositoryRoot, "docs");
  const unexpected = readdirSync(docsRoot, {
    recursive: true,
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(docsRoot, path.join(entry.parentPath, entry.name))
    )
    .filter(
      (filename) =>
        !/^superpowers\/(?:plans|specs)\/[a-z0-9-]+\.md$/.test(filename)
    );

  assert.deepEqual(unexpected, []);
});
```

- [ ] **Step 3: Run the release contract and verify it passes**

Run:

```bash
cd frontend/glucose-ml-web
node --test tests/public-release-contract.test.ts
```

Expected: all tests in the file PASS, including the new scoped-docs contract.

- [ ] **Step 4: Commit the repository-contract adjustment**

```bash
git add frontend/glucose-ml-web/tests/public-release-contract.test.ts
git commit -m "test: allow scoped implementation docs"
```

### Task 2: Add the square SVG favicon and public search metadata

**Files:**
- Create: `frontend/glucose-ml-web/tests/metadata-contract.test.ts`
- Create: `frontend/glucose-ml-web/public/glucose-ml-icon.svg`
- Modify: `frontend/glucose-ml-web/index.html:4-14`

**Interfaces:**
- Consumes: `.superset/attachments/Glucose_ML_Logo__1_.svg` and the production URL/title constants in Global Constraints.
- Produces: `/glucose-ml-icon.svg`, the public document title, `og:site_name`, and one `WebSite` JSON-LD node.

- [ ] **Step 1: Write the failing metadata contract**

Create `frontend/glucose-ml-web/tests/metadata-contract.test.ts` with:

```ts
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
  const blocks = [...indexHtml.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  )].map((match) => JSON.parse(match[1]));
  const website = blocks.find((block) => block["@type"] === "WebSite");

  assert.deepEqual(website, {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Glucose-ML",
    url: "https://www.glucose-ml-project.com/",
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails for the old metadata and missing icon**

Run:

```bash
cd frontend/glucose-ml-web
node --test tests/metadata-contract.test.ts
```

Expected: FAIL because the old title is `glucose-ml-web`, the favicon still references the wide wordmark, and `public/glucose-ml-icon.svg` does not exist.

- [ ] **Step 3: Copy the approved source icon without altering it**

Run from the repository root:

```bash
cp .superset/attachments/Glucose_ML_Logo__1_.svg frontend/glucose-ml-web/public/glucose-ml-icon.svg
cmp .superset/attachments/Glucose_ML_Logo__1_.svg frontend/glucose-ml-web/public/glucose-ml-icon.svg
```

Expected: `cmp` exits 0 with no output.

- [ ] **Step 4: Replace the favicon link and add the approved metadata**

Replace the current favicon/title portion of `frontend/glucose-ml-web/index.html` so the `<head>` begins:

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" sizes="any" href="/glucose-ml-icon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta property="og:site_name" content="Glucose-ML" />
  <title>Glucose-ML: Public CGM Datasets for Research</title>
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Glucose-ML",
      "url": "https://www.glucose-ml-project.com/"
    }
  </script>
```

Keep the existing Google Fonts links after this block.

- [ ] **Step 5: Run the focused metadata contract and verify it passes**

Run:

```bash
cd frontend/glucose-ml-web
node --test tests/metadata-contract.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 6: Commit the core favicon and search metadata**

```bash
git add frontend/glucose-ml-web/index.html frontend/glucose-ml-web/public/glucose-ml-icon.svg frontend/glucose-ml-web/tests/metadata-contract.test.ts
git commit -m "feat: add Glucose-ML search metadata"
```

### Task 3: Add raster favicon and Apple touch-icon coverage

**Files:**
- Modify: `frontend/glucose-ml-web/tests/metadata-contract.test.ts`
- Create: `frontend/glucose-ml-web/public/favicon-48x48.png`
- Create: `frontend/glucose-ml-web/public/apple-touch-icon.png`
- Modify: `frontend/glucose-ml-web/index.html:5-9`

**Interfaces:**
- Consumes: `.superset/attachments/Glucose_ML_Logo__1_.svg`.
- Produces: `/favicon-48x48.png` at exactly 48x48 pixels and `/apple-touch-icon.png` at exactly 180x180 pixels, referenced from the HTML head.

- [ ] **Step 1: Extend the metadata contract with failing raster-link and PNG-dimension checks**

Append to `frontend/glucose-ml-web/tests/metadata-contract.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the focused test and verify the new case fails**

Run:

```bash
cd frontend/glucose-ml-web
node --test tests/metadata-contract.test.ts
```

Expected: the 3 existing tests PASS and `raster favicon and Apple touch icon use exact square dimensions` FAILS because its links and files do not exist.

- [ ] **Step 3: Render the exact PNG derivatives with macOS `sips`**

Run from the repository root:

```bash
sips -s format png --resampleHeightWidth 48 48 .superset/attachments/Glucose_ML_Logo__1_.svg --out frontend/glucose-ml-web/public/favicon-48x48.png
sips -s format png --resampleHeightWidth 180 180 .superset/attachments/Glucose_ML_Logo__1_.svg --out frontend/glucose-ml-web/public/apple-touch-icon.png
sips -g pixelWidth -g pixelHeight frontend/glucose-ml-web/public/favicon-48x48.png frontend/glucose-ml-web/public/apple-touch-icon.png
```

Expected: the first file reports 48x48 pixels and the second reports 180x180 pixels.

- [ ] **Step 4: Add the raster favicon and touch-icon links**

Place these immediately after the SVG favicon link in `frontend/glucose-ml-web/index.html`:

```html
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

- [ ] **Step 5: Run the focused metadata contract and verify all cases pass**

Run:

```bash
cd frontend/glucose-ml-web
node --test tests/metadata-contract.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 6: Commit the compatibility assets**

```bash
git add frontend/glucose-ml-web/index.html frontend/glucose-ml-web/public/favicon-48x48.png frontend/glucose-ml-web/public/apple-touch-icon.png frontend/glucose-ml-web/tests/metadata-contract.test.ts
git commit -m "feat: add favicon compatibility assets"
```

### Task 4: Verify the complete production artifact

**Files:**
- Verify: `frontend/glucose-ml-web/dist/index.html`
- Verify: `frontend/glucose-ml-web/dist/glucose-ml-icon.svg`
- Verify: `frontend/glucose-ml-web/dist/favicon-48x48.png`
- Verify: `frontend/glucose-ml-web/dist/apple-touch-icon.png`

**Interfaces:**
- Consumes: completed Tasks 1-3.
- Produces: evidence that tests, lint, build, and Vite output satisfy the approved design.

- [ ] **Step 1: Run the entire Node test suite**

Run:

```bash
cd frontend/glucose-ml-web
node --test tests/*.test.ts
```

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Run ESLint**

Run:

```bash
cd frontend/glucose-ml-web
npm run lint
```

Expected: exit 0 with no ESLint errors.

- [ ] **Step 3: Build the production bundle**

Run:

```bash
cd frontend/glucose-ml-web
npm run build
```

Expected: TypeScript and Vite exit 0 and create `dist/`.

- [ ] **Step 4: Inspect the emitted metadata and assets**

Run:

```bash
cd frontend/glucose-ml-web
rg -n "Glucose-ML: Public CGM Datasets for Research|og:site_name|application/ld\+json|glucose-ml-icon|favicon-48x48|apple-touch-icon" dist/index.html
cmp public/glucose-ml-icon.svg dist/glucose-ml-icon.svg
sips -g pixelWidth -g pixelHeight dist/favicon-48x48.png dist/apple-touch-icon.png
```

Expected: `rg` finds every metadata/icon reference; `cmp` exits 0; emitted PNGs report 48x48 and 180x180 pixels.

- [ ] **Step 5: Confirm the implementation stayed within scope**

Run from the repository root:

```bash
git status --short
git diff origin/main...HEAD -- frontend/glucose-ml-web/src frontend/glucose-ml-web/package.json vercel.json
```

Expected: the source/component, package, and Vercel diff is empty. `.superset/attachments/` remains untracked and is not committed.

No manual Vercel configuration is required. After the completed commits are merged to the Vercel-connected `main` branch and deployed, a maintainer may request a home-page recrawl in Google Search Console; Google may take several days or weeks to update the displayed favicon, title, and site name.
