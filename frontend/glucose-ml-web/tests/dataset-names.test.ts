import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  KNOWN_DATASET_NAMES,
  NAME_ALIASES,
  canonicalDatasetName,
  normalizeDatasetName,
} from "../src/utils/dataset-names.ts";

type HomeDataset = { title: string };

const homepageRows = JSON.parse(
  readFileSync(new URL("../public/static_data/homepage_data.json", import.meta.url), "utf8")
) as HomeDataset[];

const timeInRangesByType = JSON.parse(
  readFileSync(new URL("../public/static_data/time_in_ranges_by_type.json", import.meta.url), "utf8")
) as Record<string, unknown>;

// ---------------------------------------------------------------------------
// Finding 2: KNOWN_DATASET_NAMES is hand-copied from homepage_data.json's
// `title` field. Nothing previously enforced that the copy stays correct —
// a 22nd dataset added to the JSON (the normal way this app grows) would
// silently vanish from every GA4 event with tests and build still green.
// This test fails loudly the moment the two lists diverge.
// ---------------------------------------------------------------------------

test("KNOWN_DATASET_NAMES is exactly the set of titles in homepage_data.json", () => {
  const jsonTitles = new Set(homepageRows.map((row) => row.title));
  const constantNames = new Set(KNOWN_DATASET_NAMES);

  assert.ok(jsonTitles.size > 0, "homepage_data.json must not be empty");

  const missingFromConstant = [...jsonTitles].filter((title) => !constantNames.has(title));
  const extraInConstant = [...constantNames].filter((name) => !jsonTitles.has(name));

  assert.deepEqual(
    missingFromConstant,
    [],
    "homepage_data.json has titles KNOWN_DATASET_NAMES is missing — " +
      "these datasets will silently disappear from every GA4 event " +
      "(no dataset_name, excluded from dataset_combination, no dataset_open) " +
      "until KNOWN_DATASET_NAMES is updated to match"
  );
  assert.deepEqual(
    extraInConstant,
    [],
    "KNOWN_DATASET_NAMES has entries no longer present in homepage_data.json"
  );

  // No duplicate entries (would silently no-op in KNOWN_DATASET_NAMES but
  // signal a copy/paste mistake worth catching).
  assert.equal(KNOWN_DATASET_NAMES.length, constantNames.size);
});

// ---------------------------------------------------------------------------
// Finding 2 (alias coverage): time_in_ranges_by_type.json uses different
// separator conventions (underscores/hyphens) than homepage_data.json's
// space-separated titles for some datasets. canonicalDatasetName must still
// resolve those keys to the same canonical name compare-data.ts matches them
// against, or a real dataset's time-in-range data silently stops being
// associated with its GA4 identity.
// ---------------------------------------------------------------------------

test("every key in time_in_ranges_by_type.json canonicalizes to a known dataset name", () => {
  const missing = Object.keys(timeInRangesByType).filter(
    (key) => canonicalDatasetName(key) === undefined
  );
  assert.deepEqual(missing, []);
});

test("underscore/hyphen variants used in time_in_ranges_by_type.json resolve to their canonical spelling", () => {
  assert.equal(canonicalDatasetName("Park_2025"), "Park 2025");
  assert.equal(canonicalDatasetName("Hall_2018"), "Hall 2018");
  assert.equal(canonicalDatasetName("Bris-T1D_Open"), "Bris-T1D Open");
  assert.equal(canonicalDatasetName("Colas_2019"), "Colas 2019");
  assert.equal(canonicalDatasetName("CGMacros_Dexcom"), "CGMacros Dexcom");
  assert.equal(canonicalDatasetName("CGMacros_Libre"), "CGMacros Libre");
});

// ---------------------------------------------------------------------------
// Finding 3: isKnownDatasetName/normalizeDatasetName/canonicalDatasetName
// are the privacy gate every track* call site relies on, but had zero
// behavioral unit coverage — only source-text regex assertions elsewhere,
// which would still pass with a no-op guard. These tests call the real
// functions and assert on the returned value, not just truthiness.
// ---------------------------------------------------------------------------

test("every real dataset name canonicalizes to itself", () => {
  for (const name of KNOWN_DATASET_NAMES) {
    assert.equal(canonicalDatasetName(name), name);
  }
});

test("documented aliases canonicalize to their real dataset name", () => {
  for (const [alias, canonical] of Object.entries(NAME_ALIASES)) {
    assert.equal(
      canonicalDatasetName(alias),
      canonical,
      `alias "${alias}" must canonicalize to "${canonical}"`
    );
  }
});

test("an unrecognized dataset name canonicalizes to undefined", () => {
  assert.equal(canonicalDatasetName("Not A Real Dataset"), undefined);
  assert.equal(canonicalDatasetName(""), undefined);
  assert.equal(canonicalDatasetName("<script>alert(1)</script>"), undefined);
});

test("whitespace/separator-variant attack strings never come back verbatim", () => {
  // Each of these is a real dataset name mangled with unbounded separator
  // runs, tabs, or newlines — crafted to still pass a fuzzy membership
  // check while carrying attacker-positioned text. canonicalDatasetName
  // must either reject them outright or replace them with the real,
  // canonical spelling; it must never hand back the mangled input itself.
  const attackStrings: ReadonlyArray<{ input: string; expectedCanonical: string }> = [
    { input: "_____h_a_l_l_____2_0_1_8_____", expectedCanonical: "Hall 2018" },
    { input: "t1-d_e x i", expectedCanonical: "T1DEXI" },
    { input: "T\n1\tD E X I", expectedCanonical: "T1DEXI" },
  ];

  for (const { input, expectedCanonical } of attackStrings) {
    const result = canonicalDatasetName(input);
    assert.notEqual(
      result,
      input,
      `canonicalDatasetName(${JSON.stringify(input)}) must not return the raw input verbatim`
    );
    assert.equal(
      result,
      expectedCanonical,
      `canonicalDatasetName(${JSON.stringify(input)}) must resolve to the real dataset name, not pass the mangled text through`
    );
  }
});

test("normalizeDatasetName resolves NAME_ALIASES before stripping separators/casing", () => {
  for (const [alias, canonical] of Object.entries(NAME_ALIASES)) {
    assert.equal(normalizeDatasetName(alias), normalizeDatasetName(canonical));
  }
});

test("normalizeDatasetName strips whitespace/underscore/hyphen runs and lowercases", () => {
  assert.equal(normalizeDatasetName("T1DEXI"), "t1dexi");
  assert.equal(normalizeDatasetName("T1D-UOM"), "t1duom");
  assert.equal(normalizeDatasetName("Bris-T1D Open"), "brist1dopen");
});
