import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { findPublicationReferences } from "../src/features/dataset-detail/publication-reference-data.ts";

type PublicationReference = {
  citation: string;
  url?: string;
};

type PublicationReferencesByDataset = Record<string, PublicationReference[]>;

const publicationReferences = JSON.parse(
  readFileSync(
    new URL(
      "../public/static_data/publication_references.json",
      import.meta.url
    ),
    "utf8"
  )
) as PublicationReferencesByDataset;

const datasetDetailTsx = readFileSync(
  new URL(
    "../src/features/dataset-detail/DatasetDetail.tsx",
    import.meta.url
  ),
  "utf8"
);
const authorshipSectionUrl = new URL(
  "../src/features/dataset-detail/AuthorshipSection.tsx",
  import.meta.url
);
const authorshipSectionTsx = existsSync(authorshipSectionUrl)
  ? readFileSync(authorshipSectionUrl, "utf8")
  : "";
const datasetDetailCss = readFileSync(
  new URL(
    "../src/features/dataset-detail/dataset-detail.css",
    import.meta.url
  ),
  "utf8"
);

test("Colas 2019 publication reference has the expected citation and DOI", () => {
  assert.deepEqual(publicationReferences["Colas 2019"], [
    {
      citation:
        "Colás, A., Vigil, L., Vargas, B., Cuesta-Frau, D., & Varela, M. (2019). Detrended Fluctuation Analysis in the prediction of type 2 diabetes mellitus in patients at risk: Model optimization and comparison with other metrics. PloS one, 14(12), e0225817.",
      url: "https://doi.org/10.1371/journal.pone.0225817",
    },
  ]);
});

test("publication references resolve normalized dataset aliases", () => {
  const references = findPublicationReferences(publicationReferences, [
    "CGMacros_Dexcom",
  ]);

  assert.deepEqual(references, publicationReferences["CGMacros Dexcom"]);
});

test("publication reference lookup preserves candidate order across normalized and exact matches", () => {
  const firstCandidateReferences = [{ citation: "First candidate" }];
  const secondCandidateReferences = [{ citation: "Second candidate" }];
  const referencesByDataset = {
    "First Candidate": firstCandidateReferences,
    SecondCandidate: secondCandidateReferences,
  };

  const references = findPublicationReferences(referencesByDataset, [
    "First_Candidate",
    "SecondCandidate",
  ]);

  assert.deepEqual(references, firstCandidateReferences);
});

test("missing publication reference lookup returns an empty array", () => {
  assert.deepEqual(
    findPublicationReferences(publicationReferences, ["Missing Dataset"]),
    []
  );
});

test("DatasetDetail loads and resolves publication references into constructed detail data", () => {
  assert.match(
    datasetDetailTsx,
    /fetchJson<PublicationReferencesByDataset>\(\s*"static_data\/publication_references\.json",\s*ac\.signal\s*\)/
  );
  assert.match(
    datasetDetailTsx,
    /findPublicationReferences\(\s*publicationReferencesByDataset,\s*datasetKeyCandidates\s*\)/
  );
  assert.match(
    datasetDetailTsx,
    /buildDetailFromStatic\(\s*card,\s*matchedTable1Data,\s*matchedAccessInfo,\s*matchedHistogramData,\s*barsFromTir,\s*publicationReferences,/
  );
  assert.match(
    datasetDetailTsx,
    /return\s*\{[\s\S]*?publicationReferences,[\s\S]*?participantsTotal,/
  );
});

test("DatasetDetail rethrows publication reference fetch aborts while preserving ordinary fallback", () => {
  assert.match(
    datasetDetailTsx,
    /\.catch\(\(error\) => \{[\s\S]*?ac\.signal\.aborted[\s\S]*?error\.name === "AbortError"/
  );
  assert.match(
    datasetDetailTsx,
    /error\.name === "AbortError"[\s\S]*?\{\s*throw error;\s*\}/
  );
  assert.match(
    datasetDetailTsx,
    /throw error;\s*\}\s*return \{\};\s*\}\)/
  );
});

test("AuthorshipSection renders publication references as semantic linked citations", () => {
  assert.match(authorshipSectionTsx, /Publication references/);
  assert.match(
    authorshipSectionTsx,
    /<ul className="dataset-detail-page__reference-list">/
  );
  assert.match(
    authorshipSectionTsx,
    /references\.map\(\(reference,\s*index\) =>/
  );
  assert.match(
    authorshipSectionTsx,
    /<span>\{reference\.citation\}<\/span>/
  );
  assert.match(authorshipSectionTsx, /target="_blank"/);
  assert.match(authorshipSectionTsx, /rel="noopener noreferrer"/);
  assert.doesNotMatch(authorshipSectionTsx, /Original dataset/);
});

test("AuthorshipSection disambiguates duplicate publication reference keys", () => {
  assert.match(
    authorshipSectionTsx,
    /references\.map\(\(reference,\s*index\) =>/
  );
  assert.match(
    authorshipSectionTsx,
    /key=\{`\$\{reference\.citation\}:\$\{reference\.url \?\? ""\}:\$\{index\}`\}/
  );
});

test("AuthorshipSection announces that external links open in a new tab", () => {
  assert.match(
    authorshipSectionTsx,
    /aria-label=\{`\$\{reference\.url\} \(opens in a new tab\)`\}/
  );
});

test("AuthorshipSection adds the Figma View action for linked references", () => {
  assert.match(
    authorshipSectionTsx,
    /className="dataset-detail-page__reference-view"/
  );
  assert.match(authorshipSectionTsx, />\s*View\s*<\/span>/);
  assert.match(authorshipSectionTsx, /icon-arrow-up-right\.png/);
});

test("AuthorshipSection renders the approved fallback without an empty bullet", () => {
  assert.match(
    authorshipSectionTsx,
    /const NOT_REPORTED = "Not reported";/
  );
  assert.match(
    authorshipSectionTsx,
    /references\?\s*:\s*PublicationReference\[\][\s\S]*?=\s*\[\]/
  );
  assert.match(
    authorshipSectionTsx,
    /references\.length > 0\s*\?/
  );
  assert.match(
    authorshipSectionTsx,
    /<p className="dataset-detail-page__reference-empty">\s*\{NOT_REPORTED\}\s*<\/p>/
  );
  assert.doesNotMatch(
    authorshipSectionTsx,
    /<li[^>]*>\s*\{NOT_REPORTED\}\s*<\/li>/
  );
});

test("DatasetDetail delegates Authorship rendering to AuthorshipSection", () => {
  assert.match(
    datasetDetailTsx,
    /import AuthorshipSection from "\.\/AuthorshipSection";/
  );
  assert.match(
    datasetDetailTsx,
    /<AuthorshipSection references=\{dataset\.publicationReferences\} \/>/
  );
  assert.doesNotMatch(datasetDetailTsx, /Original dataset/);
  assert.doesNotMatch(
    datasetDetailTsx,
    /<section className="dataset-detail-page__authorship glm-card">/
  );
});

test("Authorship publication reference styles match the approved visual contract", () => {
  assert.match(
    datasetDetailCss,
    /\.dataset-detail-page__reference-body\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column[^}]*gap:\s*16px[^}]*margin-top:\s*20px[^}]*color:\s*var\(--glm-color-text\)[^}]*font-size:\s*14px[^}]*line-height:\s*normal/s
  );
  assert.match(
    datasetDetailCss,
    /\.dataset-detail-page__reference-label,\s*\.dataset-detail-page__reference-empty\s*\{[^}]*margin:\s*0/s
  );
  assert.match(
    datasetDetailCss,
    /\.dataset-detail-page__reference-list\s*\{[^}]*margin:\s*0[^}]*padding-left:\s*21px/s
  );
  assert.match(
    datasetDetailCss,
    /\.dataset-detail-page__reference-item\s*\{[^}]*padding-left:\s*0[^}]*overflow-wrap:\s*anywhere/s
  );
  assert.match(
    datasetDetailCss,
    /\.dataset-detail-page__reference-item \+ \.dataset-detail-page__reference-item\s*\{[^}]*margin-top:\s*12px/s
  );
  assert.match(
    datasetDetailCss,
    /\.dataset-detail-page__reference-item a\s*\{[^}]*color:\s*inherit[^}]*text-decoration:\s*underline[^}]*text-underline-position:\s*from-font[^}]*overflow-wrap:\s*anywhere/s
  );
  assert.doesNotMatch(
    datasetDetailCss,
    /\.dataset-detail-page__authorship \.glm-body/
  );
  assert.doesNotMatch(
    datasetDetailCss,
    /\.dataset-detail-page__authorship a/
  );
});
