import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getRouteScrollTop,
  rememberHomeScrollTop,
} from "../src/app/route-scroll.ts";

const routeScrollManagerTsx = readFileSync(
  new URL("../src/app/RouteScrollManager.tsx", import.meta.url),
  "utf8"
);

test("only the home route restores its saved scroll position", () => {
  assert.equal(getRouteScrollTop("/", 720), 720);
  assert.equal(getRouteScrollTop("/compare", 720), 0);
  assert.equal(getRouteScrollTop("/dataset/CGMacros", 720), 0);
  assert.equal(getRouteScrollTop("/background", 720), 0);
});

test("only scrolling the home route updates its saved scroll position", () => {
  assert.equal(rememberHomeScrollTop("/", 720, 140), 720);
  assert.equal(rememberHomeScrollTop("/compare", 980, 720), 720);
  assert.equal(rememberHomeScrollTop("/dataset/CGMacros", 440, 720), 720);
});

test("home scroll is recorded before navigation can shrink the document", () => {
  assert.match(
    routeScrollManagerTsx,
    /window\.addEventListener\("scroll",\s*rememberHomePosition,\s*\{\s*passive:\s*true,?\s*\}\)/
  );
  assert.match(
    routeScrollManagerTsx,
    /window\.removeEventListener\("scroll",\s*rememberHomePosition\)/
  );
  assert.match(
    routeScrollManagerTsx,
    /rememberHomeScrollTop\(\s*window\.location\.pathname,\s*window\.scrollY/
  );
  assert.doesNotMatch(
    routeScrollManagerTsx,
    /return\s*\(\)\s*=>\s*\{\s*homeScrollTop\s*=\s*rememberHomeScrollTop\([\s\S]*window\.scrollY/
  );
});

test("home restoration retries when async content increases document height", () => {
  assert.match(
    routeScrollManagerTsx,
    /new ResizeObserver\(restoreHomePosition\)/
  );
  assert.match(
    routeScrollManagerTsx,
    /restoreObserver\.observe\(document\.body\)/
  );
  assert.match(
    routeScrollManagerTsx,
    /window\.scrollY\s*===\s*targetScrollTop[\s\S]*startTrackingHomeScroll\(\)/
  );
});
