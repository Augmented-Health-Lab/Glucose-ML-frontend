import test from "node:test";
import assert from "node:assert/strict";
import { calculateBackgroundStats } from "../src/features/background/background-stats.ts";
import type { HomeDataset, TableDataset } from "../src/types/dataset";

test("calculateBackgroundStats derives CTA numbers from app data", () => {
  const homeRows = [
    {
      title: "A",
      participants: 2,
      days: 5,
      access: "Public",
      description: "",
      types: [],
      sources: [],
    },
    {
      title: "B",
      participants: 3,
      days: 6,
      access: "Public",
      description: "",
      types: [],
      sources: [],
    },
  ] satisfies HomeDataset[];

  const tableRows = [
    {
      name: "A",
      "year release": "2024",
      total: 12,
      male: null,
      female: null,
      "age range": "",
      Ethinicities: "",
      "CGM Device": "",
      "Total days of glucose": 100.5,
      "Glucose samples": 1000,
      "average days per participant": null,
    },
    {
      name: "B",
      "year release": "2025",
      total: 8,
      male: null,
      female: null,
      "age range": "",
      Ethinicities: "",
      "CGM Device": "",
      "Total days of glucose": "20",
      "Glucose samples": 2500,
      "average days per participant": null,
    },
  ] satisfies TableDataset[];

  assert.deepEqual(calculateBackgroundStats(homeRows, tableRows), {
    datasets: "2",
    participants: "20",
    days: "121",
    glucoseSamples: "3,500",
  });
});

test("calculateBackgroundStats formats million-scale glucose samples compactly", () => {
  const homeRows = [
    {
      title: "A",
      participants: 1,
      days: 1,
      access: "Public",
      description: "",
      types: [],
      sources: [],
    },
  ] satisfies HomeDataset[];

  const tableRows = [
    {
      name: "A",
      "year release": "2024",
      total: 1,
      male: null,
      female: null,
      "age range": "",
      Ethinicities: "",
      "CGM Device": "",
      "Total days of glucose": 1,
      "Glucose samples": 44_900_000,
      "average days per participant": null,
    },
  ] satisfies TableDataset[];

  assert.equal(calculateBackgroundStats(homeRows, tableRows).glucoseSamples, "44.9M");
});

test("calculateBackgroundStats preserves independently available stats", () => {
  const homeRows = [
    {
      title: "A",
      participants: 1,
      days: 1,
      access: "Public",
      description: "",
      types: [],
      sources: [],
    },
    {
      title: "B",
      participants: 1,
      days: 1,
      access: "Public",
      description: "",
      types: [],
      sources: [],
    },
  ] satisfies HomeDataset[];

  assert.deepEqual(calculateBackgroundStats(homeRows, null), {
    datasets: "2",
    participants: null,
    days: null,
    glucoseSamples: null,
  });
});
