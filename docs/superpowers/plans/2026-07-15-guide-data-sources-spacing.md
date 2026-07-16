# Guide Data Sources Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match Figma frame 36789 by retaining 24 px below the Data Sources description and using 16 px between Data Sources list items.

**Architecture:** Keep the existing `LegendModal` markup and CSS flex layout. Extend the existing source-level contract test to lock both spacing values, then make the single minimal CSS change required for the contract to pass.

**Tech Stack:** React 19, TypeScript, plain CSS, Node.js test runner

## Global Constraints

- Keep 24 px between the Data Sources description and its list.
- Use 16 px between each Data Sources item.
- Do not change Guide content, typography, modal dimensions, responsive behavior, or other Guide sections.
- Do not add dependencies.

---

### Task 1: Correct Data Sources spacing

**Files:**
- Modify: `frontend/glucose-ml-web/tests/legend-data.test.ts`
- Modify: `frontend/glucose-ml-web/src/features/dataset-detail/legend-modal.css`

**Interfaces:**
- Consumes: Existing `.legend-block-subtitle` and `.source-list` selectors from `legend-modal.css`.
- Produces: A CSS contract requiring a 24 px subtitle bottom margin and a 16 px Data Sources list gap.

- [ ] **Step 1: Write the failing spacing contract test**

Append this test to `frontend/glucose-ml-web/tests/legend-data.test.ts`:

```ts
test("guide modal uses Figma spacing for the Data Sources section", () => {
  assert.match(
    legendModalCss,
    /\.legend-block-subtitle\s*\{[^}]*margin-bottom:\s*24px/s
  );
  assert.match(
    legendModalCss,
    /\.source-list\s*\{[^}]*gap:\s*16px/s
  );
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run from `frontend/glucose-ml-web`:

```bash
node --test tests/legend-data.test.ts
```

Expected: FAIL in `guide modal uses Figma spacing for the Data Sources section` because `.source-list` currently declares `gap: 24px`.

- [ ] **Step 3: Implement the minimal CSS change**

In `frontend/glucose-ml-web/src/features/dataset-detail/legend-modal.css`, update `.source-list`:

```css
.source-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 0;
}
```

Do not change `.legend-block-subtitle`; its existing `margin-bottom: 24px` supplies the required space below the Data Sources description.

- [ ] **Step 4: Run the focused test to verify it passes**

Run from `frontend/glucose-ml-web`:

```bash
node --test tests/legend-data.test.ts
```

Expected: all tests in `legend-data.test.ts` pass with zero failures.

- [ ] **Step 5: Run broader project verification**

Run from `frontend/glucose-ml-web`:

```bash
npm run lint
npm run build
node --test tests/*.test.ts
```

Expected: lint and build exit with status 0, and the full Node test suite reports zero failures.

- [ ] **Step 6: Review and commit the implementation**

Run from the repository root:

```bash
git diff --check
git diff -- frontend/glucose-ml-web/tests/legend-data.test.ts frontend/glucose-ml-web/src/features/dataset-detail/legend-modal.css
git add frontend/glucose-ml-web/tests/legend-data.test.ts frontend/glucose-ml-web/src/features/dataset-detail/legend-modal.css
git commit -m "fix: update guide data sources spacing"
```

Expected: the diff contains only the focused regression test and the `24px` to `16px` source-list gap change, and the commit succeeds.
