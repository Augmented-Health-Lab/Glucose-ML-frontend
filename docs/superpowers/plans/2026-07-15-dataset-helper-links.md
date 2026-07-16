# Dataset Helper Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update AI-READI’s access target and route every dataset detail page to the GitHub folder containing both helper scripts for that dataset.

**Architecture:** Keep dataset access URLs in the existing static dataset metadata. Add one focused utility that maps UI dataset titles to upstream helper-folder names, builds links from one shared GitHub base URL, and falls back to the shared directory for unknown future titles. `DatasetHeader` will consume that utility using the current dataset title.

**Tech Stack:** TypeScript, React 19, Node test runner, JSON static data

## Global Constraints

- AI-READI’s “Request access” destination must be exactly `https://fairhub.io/datasets/3`.
- Each current dataset’s “Helper scripts” destination must be its dataset-specific folder under `2_Harmonize-cgm-datasets`, where both helper scripts are available.
- Preserve link labels, styling, new-tab behavior, dataset download links, and upstream scripts.
- Unknown future dataset titles must fall back to the shared helper directory.

---

### Task 1: Update AI-READI’s Fairhub target

**Files:**
- Modify: `frontend/glucose-ml-web/tests/dataset-links.test.ts`
- Modify: `frontend/glucose-ml-web/public/static_data/table1_detail_data.json`

**Interfaces:**
- Consumes: the existing `rowFor(name: string): TableDetailRow` test helper and `Link to dataset` JSON field.
- Produces: AI-READI’s dataset detail data with `Link to dataset` set to Fairhub dataset 3.

- [ ] **Step 1: Write the failing regression test**

Add this test to `frontend/glucose-ml-web/tests/dataset-links.test.ts`:

```ts
test("AI-READI request access links to Fairhub dataset 3", () => {
  const aiReadi = rowFor("AI-READI");

  assert.equal(aiReadi["Link to dataset"], "https://fairhub.io/datasets/3");
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run from `frontend/glucose-ml-web`:

```bash
node --test tests/dataset-links.test.ts
```

Expected: FAIL because the actual AI-READI link ends in `/datasets/2`.

- [ ] **Step 3: Make the minimal data change**

In the AI-READI object in `frontend/glucose-ml-web/public/static_data/table1_detail_data.json`, set:

```json
"Link to dataset": "https://fairhub.io/datasets/3"
```

- [ ] **Step 4: Rerun the focused test**

Run:

```bash
node --test tests/dataset-links.test.ts
```

Expected: all tests in `dataset-links.test.ts` PASS.

- [ ] **Step 5: Commit the access-link change**

```bash
git add frontend/glucose-ml-web/tests/dataset-links.test.ts frontend/glucose-ml-web/public/static_data/table1_detail_data.json
git commit -m "fix: update AI-READI access link"
```

---

### Task 2: Route Helper scripts to each dataset folder

**Files:**
- Create: `frontend/glucose-ml-web/src/utils/helper-scripts.ts`
- Create: `frontend/glucose-ml-web/tests/helper-scripts.test.ts`
- Modify: `frontend/glucose-ml-web/src/features/dataset-detail/DatasetHeader.tsx`
- Modify: `frontend/glucose-ml-web/tests/detail-visual-contract.test.ts`

**Interfaces:**
- Consumes: `dataset.title: string` from `DatasetHeader` and current dataset titles from `table1_detail_data.json`.
- Produces: `getHelperScriptsUrl(datasetTitle: string): string`, returning a dataset-folder URL or the shared-folder fallback.

- [ ] **Step 1: Write failing utility and component contract tests**

Create `frontend/glucose-ml-web/tests/helper-scripts.test.ts`:

```ts
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

type TableDetailRow = { name: string };

const moduleUrl = new URL("../src/utils/helper-scripts.ts", import.meta.url);
const expectedFolders: Record<string, string> = {
  "Hall 2018": "Hall_2018",
  D1NAMO: "D1NAMO",
  "Colas 2019": "Colas_2019",
  OhioT1DM: "OhioT1DM",
  T1DEXI: "T1DEXI",
  T1DEXIP: "T1DEXIP",
  BIGIDEAs: "BIGIDEAs",
  DiaTrend: "DiaTrend",
  ShanghaiT1DM: "ShanghaiT1DM",
  ShanghaiT2DM: "ShanghaiT2DM",
  T1DiabetesGranada: "T1DiabetesGranada",
  "AI-READI": "AI-READI",
  UCHTT1DM: "UCHTT1DM",
  "HUPA-UCM": "HUPA-UCM",
  "CGMacros Dexcom": "CGMacros_Dexcom",
  "CGMacros Libre": "CGMacros_Libre",
  "T1D-UOM": "T1D-UOM",
  "Bris-T1D Open": "Bris-T1D_Open",
  AZT1D: "AZT1D",
  "Park 2025": "Park_2025",
  PhysioCGM: "PhysioCGM",
};

test("every current dataset resolves to its helper scripts folder", async () => {
  assert.ok(existsSync(fileURLToPath(moduleUrl)), "Expected helper scripts utility");
  const { getHelperScriptsUrl } = await import(moduleUrl.href);
  const rows = JSON.parse(
    readFileSync(
      new URL("../public/static_data/table1_detail_data.json", import.meta.url),
      "utf8"
    )
  ) as TableDetailRow[];

  assert.deepEqual(
    rows.map(({ name }) => name).toSorted(),
    Object.keys(expectedFolders).toSorted()
  );

  for (const [datasetTitle, folder] of Object.entries(expectedFolders)) {
    assert.equal(
      getHelperScriptsUrl(datasetTitle),
      `https://github.com/Augmented-Health-Lab/Glucose-ML-Project/tree/main/2_Harmonize-cgm-datasets/${folder}`
    );
  }
});

test("unknown datasets fall back to the shared helper scripts folder", async () => {
  assert.ok(existsSync(fileURLToPath(moduleUrl)), "Expected helper scripts utility");
  const { getHelperScriptsUrl } = await import(moduleUrl.href);

  assert.equal(
    getHelperScriptsUrl("Future Dataset"),
    "https://github.com/Augmented-Health-Lab/Glucose-ML-Project/tree/main/2_Harmonize-cgm-datasets"
  );
});
```

In the action-set test in `frontend/glucose-ml-web/tests/detail-visual-contract.test.ts`, replace the assertion for the local `HELPER_SCRIPTS_URL` constant with:

```ts
assert.match(
  headerTsx,
  /import \{ getHelperScriptsUrl \} from "\.\.\/\.\.\/utils\/helper-scripts";/
);
assert.match(headerTsx, /const helperScriptsUrl = getHelperScriptsUrl\(dataset\.title\)/);
assert.match(headerTsx, /href=\{helperScriptsUrl\}/);
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run from `frontend/glucose-ml-web`:

```bash
node --test tests/helper-scripts.test.ts tests/detail-visual-contract.test.ts
```

Expected: FAIL with `Expected helper scripts utility` and failed component contract assertions because the utility and dataset-specific resolution do not exist yet.

- [ ] **Step 3: Implement the helper-link utility**

Create `frontend/glucose-ml-web/src/utils/helper-scripts.ts`:

```ts
const HELPER_SCRIPTS_BASE_URL =
  "https://github.com/Augmented-Health-Lab/Glucose-ML-Project/tree/main/2_Harmonize-cgm-datasets";

const DATASET_HELPER_FOLDERS: Record<string, string> = {
  "Hall 2018": "Hall_2018",
  D1NAMO: "D1NAMO",
  "Colas 2019": "Colas_2019",
  OhioT1DM: "OhioT1DM",
  T1DEXI: "T1DEXI",
  T1DEXIP: "T1DEXIP",
  BIGIDEAs: "BIGIDEAs",
  DiaTrend: "DiaTrend",
  ShanghaiT1DM: "ShanghaiT1DM",
  ShanghaiT2DM: "ShanghaiT2DM",
  T1DiabetesGranada: "T1DiabetesGranada",
  "AI-READI": "AI-READI",
  UCHTT1DM: "UCHTT1DM",
  "HUPA-UCM": "HUPA-UCM",
  "CGMacros Dexcom": "CGMacros_Dexcom",
  "CGMacros Libre": "CGMacros_Libre",
  "T1D-UOM": "T1D-UOM",
  "Bris-T1D Open": "Bris-T1D_Open",
  AZT1D: "AZT1D",
  "Park 2025": "Park_2025",
  PhysioCGM: "PhysioCGM",
};

export function getHelperScriptsUrl(datasetTitle: string): string {
  const folder = DATASET_HELPER_FOLDERS[datasetTitle];
  return folder ? `${HELPER_SCRIPTS_BASE_URL}/${folder}` : HELPER_SCRIPTS_BASE_URL;
}
```

- [ ] **Step 4: Connect `DatasetHeader` to the utility**

In `frontend/glucose-ml-web/src/features/dataset-detail/DatasetHeader.tsx`, import the resolver:

```ts
import { getHelperScriptsUrl } from "../../utils/helper-scripts";
```

Remove the local `HELPER_SCRIPTS_URL` constant. Within `DatasetHeader`, add:

```ts
const helperScriptsUrl = getHelperScriptsUrl(dataset.title);
```

Change the helper anchor to:

```tsx
href={helperScriptsUrl}
```

- [ ] **Step 5: Rerun the focused tests**

Run:

```bash
node --test tests/helper-scripts.test.ts tests/detail-visual-contract.test.ts
```

Expected: all tests in both files PASS.

- [ ] **Step 6: Run project verification**

Run from `frontend/glucose-ml-web`:

```bash
node --test tests/*.test.ts
npm run lint
npm run build
```

Expected: all tests PASS, ESLint exits successfully, and the TypeScript/Vite production build completes successfully.

- [ ] **Step 7: Commit the helper-link change**

```bash
git add frontend/glucose-ml-web/src/utils/helper-scripts.ts frontend/glucose-ml-web/tests/helper-scripts.test.ts frontend/glucose-ml-web/src/features/dataset-detail/DatasetHeader.tsx frontend/glucose-ml-web/tests/detail-visual-contract.test.ts
git commit -m "fix: link datasets to their helper scripts"
```

---

### Task 3: Review and publish

**Files:**
- Review: all files changed by Tasks 1 and 2

**Interfaces:**
- Consumes: the verified commits from Tasks 1 and 2.
- Produces: a reviewed branch pushed to the remote and a pull request targeting `main`.

- [ ] **Step 1: Review the complete branch diff**

Run:

```bash
git diff origin/main...HEAD --check
git diff --stat origin/main...HEAD
git status --short
```

Expected: no whitespace errors, only the planned files are changed, and the worktree is clean.

- [ ] **Step 2: Push the branch and create the pull request**

After using the required finishing workflow, push `Helper-script-link-update` and create a PR with `main` as the base. The PR summary must mention the Fairhub version update, per-dataset helper folders, and regression coverage.
