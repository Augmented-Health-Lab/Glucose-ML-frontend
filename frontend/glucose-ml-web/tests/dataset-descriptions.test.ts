import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type DatasetCard = {
  title: string;
  description: string;
};

const normalizeDatasetName = (name: string) =>
  name.replace(/[\s_-]+/g, "").toLowerCase();

test("public dataset cards have unique, publication-ready descriptions", () => {
  const cards = JSON.parse(
    readFileSync(
      new URL("../public/static_data/dataset_card_info.json", import.meta.url),
      "utf8"
    )
  ) as DatasetCard[];

  assert.ok(cards.length > 0);
  assert.equal(
    new Set(cards.map(({ title }) => normalizeDatasetName(title))).size,
    cards.length
  );

  for (const card of cards) {
    assert.ok(card.title.trim(), "Dataset title must not be blank");
    assert.ok(
      card.description.trim().length >= 80,
      `Description is too short for ${card.title}`
    );
    assert.doesNotMatch(
      card.description,
      /^(?:description\s+)?(?:tbd|todo)|placeholder/i,
      `Description is not publication-ready for ${card.title}`
    );
  }
});
