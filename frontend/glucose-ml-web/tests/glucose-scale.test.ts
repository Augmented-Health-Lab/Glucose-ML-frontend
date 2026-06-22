import assert from "node:assert/strict";
import test from "node:test";

import {
  getDistributionBoundaryTicks,
  layoutDistributionBoundaryTicks,
} from "../src/utils/glucose-scale.ts";

test("distribution boundary ticks use cumulative clinical range counts", () => {
  assert.deepEqual(
    getDistributionBoundaryTicks({
      very_low: 10,
      low: 10,
      target: 50,
      high: 20,
      very_high: 10,
      total: 100,
    }),
    [
      { value: 55, label: "55", leftPct: 10, priority: 2 },
      { value: 70, label: "70", leftPct: 20, priority: 3 },
      { value: 180, label: "180", leftPct: 70, priority: 4 },
      { value: 250, label: "250", leftPct: 90, priority: 1 },
    ]
  );
});

test("distribution boundary layout keeps higher-priority labels when pixels collide", () => {
  const ticks = getDistributionBoundaryTicks({
    very_low: 1,
    low: 1,
    target: 96,
    high: 1,
    very_high: 1,
    total: 100,
  });

  assert.deepEqual(
    layoutDistributionBoundaryTicks(ticks, 354, (label) => {
      return label.endsWith("mg/dL") ? 40 : 12;
    }),
    [
      {
        value: 70,
        label: "70",
        leftPct: 2,
        priority: 3,
        labelOffsetPx: 0,
      },
      {
        value: 180,
        label: "180 mg/dL",
        leftPct: 98,
        priority: 4,
        labelOffsetPx: -12.92,
      },
    ]
  );
});

test("distribution boundary layout adds units to the rightmost visible label", () => {
  const ticks = getDistributionBoundaryTicks({
    very_low: 10,
    low: 10,
    target: 50,
    high: 20,
    very_high: 10,
    total: 100,
  });

  assert.deepEqual(
    layoutDistributionBoundaryTicks(ticks, 354, (label) => {
      return label.endsWith("mg/dL") ? 40 : 12;
    }).map(({ value, label }) => ({ value, label })),
    [
      { value: 55, label: "55" },
      { value: 70, label: "70" },
      { value: 180, label: "180" },
      { value: 250, label: "250 mg/dL" },
    ]
  );
});

test("distribution boundary layout aligns labels inward at chart edges", () => {
  const edgeTicks = getDistributionBoundaryTicks({
    very_low: 0,
    low: 20,
    target: 60,
    high: 20,
    very_high: 0,
    total: 100,
  }).filter(({ value }) => value === 55 || value === 250);

  const visible = layoutDistributionBoundaryTicks(edgeTicks, 100, (label) => {
    return label.endsWith("mg/dL") ? 40 : 12;
  });

  assert.deepEqual(
    visible.map(({ value, labelOffsetPx }) => ({ value, labelOffsetPx })),
    [
      { value: 55, labelOffsetPx: 6 },
      { value: 250, labelOffsetPx: -20 },
    ]
  );
});

test("distribution boundary ticks are empty when there are no readings", () => {
  assert.deepEqual(
    getDistributionBoundaryTicks({
      very_low: 0,
      low: 0,
      target: 0,
      high: 0,
      very_high: 0,
      total: 0,
    }),
    []
  );
});
