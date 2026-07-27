import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { COUNTRIES, getDatasetCountry } from "../src/utils/dataset-country.ts";

type DatasetCard = { title: string; description: string };

const cards = JSON.parse(
  readFileSync(
    new URL("../public/static_data/dataset_card_info.json", import.meta.url),
    "utf8"
  )
) as DatasetCard[];

// Country names as they appear in the dataset descriptions ("collected in the
// US", "collected in Spain") mapped to the label shown in the detail header.
const DESCRIPTION_COUNTRY_LABELS: Record<string, string> = {
  US: "United States",
  USA: "United States",
  "United States": "United States",
  UK: "United Kingdom",
  "United Kingdom": "United Kingdom",
  Spain: "Spain",
  China: "China",
  Chile: "Chile",
  Switzerland: "Switzerland",
};

function countryFromDescription(description: string): string {
  const match = description.match(/collected in (?:the )?([^.,]+)/);
  assert.ok(match, `Description does not state where data was collected: ${description}`);
  const stated = match[1].trim();
  const label = DESCRIPTION_COUNTRY_LABELS[stated];
  assert.ok(
    label,
    `Unrecognized country "${stated}" in description; add it to DESCRIPTION_COUNTRY_LABELS and to COUNTRIES in src/utils/dataset-country.ts`
  );
  return label;
}

test("detail header country matches the country stated in each dataset description", () => {
  assert.ok(cards.length > 0);

  for (const card of cards) {
    assert.equal(
      getDatasetCountry(card.title).label,
      countryFromDescription(card.description),
      `Country shown for ${card.title} disagrees with its description`
    );
  }
});

test("every dataset country flag icon exists", () => {
  for (const card of cards) {
    const { icon } = getDatasetCountry(card.title);
    const iconPath = fileURLToPath(new URL(`../public${icon}`, import.meta.url));
    assert.ok(existsSync(iconPath), `Missing flag icon ${icon} for ${card.title}`);
  }
});

test("title normalization tolerates spacing and separator differences", () => {
  assert.equal(getDatasetCountry("HUPA-UCM").label, "Spain");
  assert.equal(getDatasetCountry("HUPA UCM").label, "Spain");
  assert.equal(getDatasetCountry("hupa_ucm").label, "Spain");
  // Unmapped datasets fall back to the US, which the first test guards.
  assert.equal(getDatasetCountry("Some New Dataset"), COUNTRIES.us);
});
