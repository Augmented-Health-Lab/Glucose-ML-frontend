import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const backgroundPageTsx = readSource("../src/features/background/BackgroundPage.tsx");

// ---------------------------------------------------------------------------
// The event helper used on the background screen is imported from the
// barrel only, never from gtag.ts/params.ts/events.ts directly.
// ---------------------------------------------------------------------------

test("BackgroundPage imports analytics helpers only from the barrel", () => {
  assert.doesNotMatch(
    backgroundPageTsx,
    /from\s+"\.\.\/\.\.\/analytics\/gtag/,
    "BackgroundPage.tsx must not import gtag.ts directly"
  );
  assert.doesNotMatch(
    backgroundPageTsx,
    /from\s+"\.\.\/\.\.\/analytics\/(events|params)/,
    "BackgroundPage.tsx must not import events.ts/params.ts directly"
  );
  assert.doesNotMatch(backgroundPageTsx, /window\.gtag/, "BackgroundPage.tsx must never touch window.gtag");
});

// ---------------------------------------------------------------------------
// Chart load error: content_load_error fires with screen "background",
// alongside setChartLoadFailed(true), guarded by the existing aborted
// check, and the caught error is never stored in state or displayed.
// ---------------------------------------------------------------------------

test("BackgroundPage's chart-load catch receives the error, tracks content_load_error, and still sets chartLoadFailed", () => {
  const catchMatch = backgroundPageTsx.match(
    /\.catch\(\(error: unknown\) => \{([\s\S]*?)\n {6}\}\);/
  );
  assert.ok(catchMatch, "chart load .catch handler not found");
  const body = catchMatch[1] ?? "";

  assert.match(body, /if \(!controller\.signal\.aborted\) \{/);
  assert.match(body, /trackContentLoadError\(\{\s*screen:\s*"background",\s*error\s*\}\)/);
  assert.match(body, /setChartLoadFailed\(true\)/);

  const trackIndex = body.indexOf("trackContentLoadError(");
  const setStateIndex = body.indexOf("setChartLoadFailed(true)");
  assert.ok(trackIndex !== -1 && setStateIndex !== -1 && trackIndex < setStateIndex);
});

test("BackgroundPage never stores or displays the raw chart-load error", () => {
  // The only place the caught error may appear as a bare identifier is
  // inside the trackContentLoadError call itself.
  const errorUses = backgroundPageTsx.match(/\berror\b/g) ?? [];
  const trackedUses = backgroundPageTsx.match(/trackContentLoadError\(\{\s*screen:\s*"background",\s*error\s*\}\)/g) ?? [];
  // "error: unknown" (the catch param annotation) plus one use inside the
  // tracking call is the only expected occurrence count.
  assert.equal(trackedUses.length, 1);
  assert.doesNotMatch(backgroundPageTsx, /setChartData\(error/);
  assert.doesNotMatch(backgroundPageTsx, /\{error/);
  assert.doesNotMatch(backgroundPageTsx, /error\.message/);
  assert.ok(errorUses.length >= 2, "expected the catch param and the tracked use");
});

test("BackgroundPage's rendered chart-unavailable message is unchanged", () => {
  assert.match(
    backgroundPageTsx,
    /chartLoadFailed\s*\n?\s*\?\s*"CGM chart data is currently unavailable\."\s*\n?\s*:\s*"Loading CGM chart\.\.\."/
  );
});
