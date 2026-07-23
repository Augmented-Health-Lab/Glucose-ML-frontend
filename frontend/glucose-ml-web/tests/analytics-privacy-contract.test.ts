import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Source-text privacy contract: scans every file in `src/analytics/` (the
 * only module allowed to talk to GA4) and asserts none of them reference
 * identifiers that would smuggle personal, health, or free-form data into an
 * analytics event, and that no file other than `gtag.ts` calls `gtag(`
 * directly.
 */

const ANALYTICS_DIR = fileURLToPath(new URL("../src/analytics/", import.meta.url));

function listAnalyticsFiles(): string[] {
  return readdirSync(ANALYTICS_DIR).filter(
    (name) => name.endsWith(".ts") || name.endsWith(".tsx")
  );
}

const FORBIDDEN_IDENTIFIERS = [
  "userId",
  "user_id",
  "participant",
  "cohort",
  "email",
  "setUserId",
  "user_properties",
  "glucose",
  "hba1c",
  "error.message",
  "err.message",
  "stack",
  "location.search",
  "window.location.href",
];

const files = listAnalyticsFiles();

/**
 * Two narrow, documented exemptions for `params.ts` (the pure-normalizer
 * module — see its own dedicated privacy tests in
 * `tests/analytics-params.test.ts` for `categorizeLoadError`, which assert
 * no substring of an input message ever escapes its return value):
 *
 * - `glucose-ml-project.com` is the app's own public production hostname
 *   literal, used by `getEnvironment`. It legitimately contains "glucose"
 *   as a domain-name substring; this is not a health value.
 * - `error.message` is read internally, inside a try/catch, purely to
 *   pattern-match it down to one of five fixed categories — the message
 *   itself is never stored, returned, or forwarded anywhere. This is the
 *   module's whole reason to exist per its own file-header comment.
 * - "stack traces" appears only in that same file-header comment, in prose
 *   describing what kind of sensitive substrings `categorizeLoadError`
 *   protects against — not a `.stack` property read anywhere in the code.
 *
 * All three are pre-existing, already-reviewed code/prose from Task 1, not
 * something this task's helpers or barrel are allowed to do — `events.ts`
 * and `index.ts` get the full, unexempted list below.
 *
 * These exemptions are bounded, not open-ended: instead of unconditionally
 * stripping every occurrence of a literal before scanning, each exemption
 * carries the exact occurrence count present in `params.ts` as of the last
 * review (`countOccurrences`, verified against the file below). If a future
 * change adds even one more occurrence of any of these literals to
 * `params.ts` — including inside a genuinely new, unreviewed function —
 * the count assertion fails the test loudly instead of the literal being
 * silently erased before the scan runs. These counts are deliberate
 * tripwires, not cosmetic bookkeeping: bump them only after re-reviewing
 * every new occurrence for a privacy leak.
 */
const PER_FILE_EXEMPTIONS: Record<string, readonly string[]> = {
  "params.ts": ["glucose-ml-project.com", "error.message", "stack traces"],
};

/**
 * Exact occurrence counts for each `params.ts` exemption literal, as of the
 * last review:
 * - "glucose-ml-project.com": 2 — `PRODUCTION_HOSTS = ["www.glucose-ml-project.com", "glucose-ml-project.com"]`
 *   (the literal also matches as a substring of the "www." variant).
 * - "error.message": 1 — the single `message = error.message` read inside
 *   `categorizeLoadError`'s try/catch.
 * - "stack traces": 1 — the file-header prose only.
 */
const PARAMS_EXEMPTION_COUNTS: Record<string, number> = {
  "glucose-ml-project.com": 2,
  "error.message": 1,
  "stack traces": 1,
};

function countOccurrences(text: string, literal: string): number {
  let count = 0;
  let index = text.indexOf(literal);
  while (index !== -1) {
    count++;
    index = text.indexOf(literal, index + literal.length);
  }
  return count;
}

function textForScanning(file: string): string {
  const raw = readFileSync(`${ANALYTICS_DIR}${file}`, "utf8");
  const exemptLiterals = PER_FILE_EXEMPTIONS[file] ?? [];
  return exemptLiterals.reduce((text, literal) => text.split(literal).join(""), raw);
}

test("params.ts exemption literals appear exactly the reviewed number of times", () => {
  const raw = readFileSync(`${ANALYTICS_DIR}params.ts`, "utf8");
  for (const [literal, expectedCount] of Object.entries(PARAMS_EXEMPTION_COUNTS)) {
    assert.equal(
      countOccurrences(raw, literal),
      expectedCount,
      `params.ts exemption literal "${literal}" occurs a different number of times than ` +
        `reviewed (expected ${expectedCount}) — a new occurrence needs privacy re-review ` +
        `and the count above updated deliberately, it must not be silently stripped`
    );
  }
});

test("src/analytics/ contains at least the expected core files", () => {
  assert.ok(files.includes("params.ts"));
  assert.ok(files.includes("gtag.ts"));
  assert.ok(files.includes("events.ts"));
  assert.ok(files.includes("index.ts"));
});

for (const file of files) {
  test(`${file} contains none of the forbidden privacy-sensitive identifiers`, () => {
    const text = textForScanning(file);
    for (const identifier of FORBIDDEN_IDENTIFIERS) {
      assert.equal(
        text.includes(identifier),
        false,
        `${file} contains forbidden identifier "${identifier}"`
      );
    }
  });
}

for (const file of files) {
  if (file === "gtag.ts") continue;
  test(`${file} does not call gtag(...) directly`, () => {
    const text = readFileSync(`${ANALYTICS_DIR}${file}`, "utf8");
    assert.equal(text.includes("gtag("), false, `${file} calls gtag( directly`);
  });
}

test("index.ts does not re-export raw senders or test-only escape hatches", () => {
  const text = readFileSync(`${ANALYTICS_DIR}index.ts`, "utf8");
  assert.equal(text.includes("sendEvent"), false, "index.ts must not export sendEvent");
  assert.equal(
    text.includes("resetAnalyticsForTests"),
    false,
    "index.ts must not export resetAnalyticsForTests"
  );
  assert.equal(
    text.includes("__setAnalyticsEnvForTests"),
    false,
    "index.ts must not export __setAnalyticsEnvForTests"
  );
});

test("events.ts helpers never spread an arbitrary parameter bag", () => {
  const text = readFileSync(`${ANALYTICS_DIR}events.ts`, "utf8");
  assert.equal(text.includes("...rest"), false);
  assert.equal(/\.\.\.\w+\s*[,)]/.test(text), false, "events.ts must not spread any object");
  assert.equal(text.includes("Record<string, unknown>"), false);
});
