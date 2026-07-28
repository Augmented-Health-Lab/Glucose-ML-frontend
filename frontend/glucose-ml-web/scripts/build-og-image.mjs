import { readFileSync, writeFileSync } from "node:fs";

// Regenerating the OG image (only needed when the branding or copy changes):
//
//   node scripts/build-og-image.mjs /tmp/og.html
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
//     --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
//     --window-size=1200,630 --virtual-time-budget=8000 \
//     --screenshot=public/og-image.png /tmp/og.html
//
// Chrome needs network access to pull Inter from Google Fonts.
const root = new URL("../", import.meta.url);
const { series } = JSON.parse(
  readFileSync(new URL("public/static_data/background_cgm_chart.json", root), "utf8")
);

const W = 1200;
const H = 630;
const PLOT_TOP = 322;
const PLOT_BOTTOM = 556;
const G_MIN = 40;
const G_MAX = 350;

const x = (hour) => (hour / 24) * W;
const y = (g) =>
  PLOT_BOTTOM - ((g - G_MIN) / (G_MAX - G_MIN)) * (PLOT_BOTTOM - PLOT_TOP);

function path(key, step) {
  const s = series.find((item) => item.key === key);
  const pts = s.points.filter((_, i) => i % step === 0);
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.hour).toFixed(1)},${y(p.glucose).toFixed(1)}`)
    .join(" ");
}

const t1d = path("t1d", 1);
const nd = path("nd", 5);
const bandTop = y(180);
const bandBottom = y(70);

const logo = readFileSync(new URL("public/glucose-ml-logo.svg", root), "utf8");
const logoData = `data:image/svg+xml;base64,${Buffer.from(logo).toString("base64")}`;

// Paper-filled chip so the axis label stays readable where a trace crosses it.
const tick = (label, unit, yPos) => `
    <g>
      <rect x="1044" y="${yPos - 15}" width="${unit ? 112 : 62}" height="26" rx="6" fill="#f6f7f7" opacity="0.92"/>
      <text class="tick" x="1056" y="${yPos + 4}">${label}<tspan class="tick-unit" dx="7">${unit}</tspan></text>
    </g>`;

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900&display=block" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; background: #f6f7f7; overflow: hidden; position: relative;
         font-family: Inter, system-ui, sans-serif; font-optical-sizing: none; }
  .chart { position: absolute; inset: 0; }
  .copy { position: absolute; left: 72px; top: 66px; }
  .logo { height: 54px; display: block; margin-bottom: 40px; }
  h1 { font-size: 60px; line-height: 1.09; font-weight: 700; letter-spacing: -0.025em; color: #1e1f22; }
  .meta { margin-top: 26px;
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          font-size: 17px; letter-spacing: 0.01em; color: #59636e; }
  .tick { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 15px; fill: #59636e; }
  .tick-unit { font-size: 13px; fill: #8b959e; }
  .key { position: absolute; left: 72px; top: 583px; display: flex; align-items: center; gap: 28px;
         font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 15px; color: #1e1f22; }
  .key span { display: flex; align-items: center; gap: 9px; }
  .swatch { width: 22px; height: 3px; border-radius: 2px; display: block; }
  .key .note { color: #8b959e; }
</style>
</head>
<body>
  <svg class="chart" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <clipPath id="plot"><rect x="0" y="${PLOT_TOP}" width="${W}" height="${PLOT_BOTTOM - PLOT_TOP}"/></clipPath>
    </defs>
    <rect x="0" y="${bandTop}" width="${W}" height="${bandBottom - bandTop}" fill="#3ba7a1" opacity="0.11"/>
    <line x1="0" y1="${bandTop}" x2="${W}" y2="${bandTop}" stroke="#3ba7a1" stroke-width="1" opacity="0.5"/>
    <line x1="0" y1="${bandBottom}" x2="${W}" y2="${bandBottom}" stroke="#3ba7a1" stroke-width="1" opacity="0.5"/>
    <g clip-path="url(#plot)">
      <path d="${nd}" fill="none" stroke="#2f8c88" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${t1d}" fill="none" stroke="#7826eb" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
    </g>
    <line x1="0" y1="${PLOT_BOTTOM}" x2="${W}" y2="${PLOT_BOTTOM}" stroke="#e1e8e7" stroke-width="1"/>
    ${tick("180", "mg/dL", bandTop)}
    ${tick("70", "", bandBottom)}
  </svg>
  <div class="copy">
    <img class="logo" src="${logoData}">
    <h1>Public CGM datasets,<br>ready for research</h1>
    <div class="meta">21 open datasets &middot; glucose-ml-project.com</div>
  </div>
  <div class="key">
    <span><i class="swatch" style="background:#7826eb"></i>Type 1 diabetes</span>
    <span><i class="swatch" style="background:#2f8c88"></i>Non-diabetic</span>
    <span class="note">24 h continuous glucose, shaded target range</span>
  </div>
</body>
</html>`;

writeFileSync(process.argv[2], html);
console.log("wrote", process.argv[2]);
