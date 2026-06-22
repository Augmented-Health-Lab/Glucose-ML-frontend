import assert from "node:assert/strict";
import test from "node:test";
import { selectActiveAnchorHref } from "../src/features/background/background-scroll-navigation.ts";

const sections = [
  { href: "#diabetes", offsetTop: 300 },
  { href: "#cgm", offsetTop: 900 },
  { href: "#data", offsetTop: 1500 },
  { href: "#glossary", offsetTop: 2600 },
  { href: "#models", offsetTop: 3400 },
  { href: "#diversity", offsetTop: 3900 },
];

test("selectActiveAnchorHref advances when a section reaches the sticky header", () => {
  assert.equal(
    selectActiveAnchorHref({
      sections,
      scrollY: 599,
      stickyHeaderHeight: 300,
      viewportHeight: 800,
      documentHeight: 5000,
    }),
    "#diabetes"
  );

  assert.equal(
    selectActiveAnchorHref({
      sections,
      scrollY: 600,
      stickyHeaderHeight: 300,
      viewportHeight: 800,
      documentHeight: 5000,
    }),
    "#cgm"
  );
});

test("selectActiveAnchorHref selects the final section at the document bottom", () => {
  assert.equal(
    selectActiveAnchorHref({
      sections,
      scrollY: 4200,
      stickyHeaderHeight: 300,
      viewportHeight: 800,
      documentHeight: 5000,
    }),
    "#diversity"
  );
});

test("selectActiveAnchorHref defaults to the first section before its boundary", () => {
  assert.equal(
    selectActiveAnchorHref({
      sections,
      scrollY: 0,
      stickyHeaderHeight: 200,
      viewportHeight: 800,
      documentHeight: 5000,
    }),
    "#diabetes"
  );
});

test("selectActiveAnchorHref keeps a clicked destination active during smooth scrolling", () => {
  assert.equal(
    selectActiveAnchorHref({
      sections,
      scrollY: 600,
      stickyHeaderHeight: 300,
      viewportHeight: 800,
      documentHeight: 5000,
      navigationHref: "#models",
    }),
    "#models"
  );
});
