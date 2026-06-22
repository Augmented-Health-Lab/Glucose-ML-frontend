import assert from "node:assert/strict";
import test from "node:test";

import {
  formatAccessLabel,
  getAccessIcon,
  resolveDatasetAccess,
} from "../src/utils/access.ts";

test("detail pages use the homepage/backend access value as source of truth", () => {
  assert.equal(resolveDatasetAccess({ access: "Open" }, "Controlled"), "Open");
  assert.equal(resolveDatasetAccess({ access: "Controlled" }, "Open"), "Controlled");
});

test("access labels match Figma capitalization by surface", () => {
  assert.equal(formatAccessLabel("Open", "card"), "Open access");
  assert.equal(formatAccessLabel("Open", "detail"), "Open Access");
  assert.equal(formatAccessLabel("Controlled", "card"), "Controlled access");
  assert.equal(formatAccessLabel("Controlled", "detail"), "Controlled Access");
});

test("access icons switch with the resolved access type", () => {
  assert.equal(getAccessIcon("Open"), "/figma-assets/icon-public.png");
  assert.equal(getAccessIcon("Controlled"), "/figma-assets/icon-key-controlled.png");
});
