# Favicon and Search Metadata Design

## Goal

Update the browser-tab and Google Search presentation for the production site at `https://www.glucose-ml-project.com/` without changing any visible header or footer branding.

## User-facing result

- Use the supplied square Glucose-ML icon for the browser favicon and the favicon Google may show beside organic search results.
- Set the document title and preferred Google title link to `Glucose-ML: Public CGM Datasets for Research`.
- Identify the concise site name as `Glucose-ML` for Google's separate site-name field.
- Leave the visible header and footer logos unchanged.

## Implementation design

### Icon assets

Copy the supplied square SVG into `frontend/glucose-ml-web/public/` as `glucose-ml-icon.svg` and preserve the source artwork. Derive `favicon-48x48.png` for raster favicon coverage and `apple-touch-icon.png` at 180x180 pixels for Apple devices. All three assets must depict the same supplied icon and remain square.

Update `frontend/glucose-ml-web/index.html` to reference the SVG favicon, the 48x48 PNG favicon, and the Apple touch icon. The current wide `glucose-ml-logo.svg` remains available for the visible application header and is no longer used as the favicon.

### Page and search metadata

In `frontend/glucose-ml-web/index.html`:

- Replace the current `glucose-ml-web` title with `Glucose-ML: Public CGM Datasets for Research`.
- Add `WebSite` JSON-LD with `name` set to `Glucose-ML` and `url` set to the canonical production home page.
- Add `<meta property="og:site_name" content="Glucose-ML" />` so the site name is consistent across machine-readable metadata, without adding unrelated social-card or organization-schema work.

The internal npm package name remains `glucose-ml-web`; it is a development identifier and does not control the browser tab or Google result title.

## Scope boundaries

- Do not change `AppShell`, `AppFooter`, or their logo assets.
- Do not add a sitemap, robots file, organization schema, social preview artwork, or broad SEO rewrite.
- Do not modify `vercel.json` or Vercel project settings.

## Testing and verification

Add a focused metadata contract test that verifies:

- the exact document title;
- the favicon and touch-icon links point to the new square icon assets with the correct types and sizes;
- the `WebSite` structured data contains the preferred name and production URL;
- the public metadata no longer contains `glucose-ml-web`.

Run the repository's Node tests, lint check, and production build. Inspect the built `dist/index.html` and emitted icon assets to confirm Vite includes the metadata and files unchanged.

## Deployment and Google refresh

The root Vercel configuration already builds `frontend/glucose-ml-web` and deploys its `dist` directory. Merging the implementation to the Vercel-connected `main` branch is sufficient; no Vercel setting change is required.

After production deployment, Google must recrawl the home page before the favicon, title, or site name changes appear. A maintainer may request reindexing through Google Search Console. Google's display remains algorithmic and is not guaranteed to update immediately.
