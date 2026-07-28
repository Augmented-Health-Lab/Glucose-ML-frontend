export const SITE_ORIGIN = "https://www.glucose-ml-project.com";

// /compare renders from client-held selection state and /dataset/:id is
// expanded from the card list below, so only these are hardcoded.
export const STATIC_PATHS = ["/", "/background", "/about"];

export function datasetPaths(titles: string[]): string[] {
  // DatasetCard navigates to `/dataset/${title}` with the raw title, and
  // useParams hands the decoded value back, so titles containing spaces
  // ("Hall 2018") only resolve when the sitemap encodes them.
  return titles.map((title) => `/dataset/${encodeURIComponent(title)}`);
}

export function buildSitemapXml(paths: string[]): string {
  // encodeURIComponent already escapes the characters XML would need
  // escaped, and the origin is a literal, so no further escaping is needed.
  const urls = paths
    .map((path) => `  <url>\n    <loc>${SITE_ORIGIN}${path}</loc>\n  </url>`)
    .join("\n");

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls}\n` +
    "</urlset>\n"
  );
}
