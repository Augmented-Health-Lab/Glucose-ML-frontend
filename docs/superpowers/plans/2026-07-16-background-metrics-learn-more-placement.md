# Background Metrics Learn More Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the Background page metrics “Learn more” link until the user expands “See more,” then align it at the bottom right opposite “See less.”

**Architecture:** Keep `showAllMetrics` as the single source of truth for the glossary disclosure. Move the existing external link from the heading into a new action row after the metric cards, conditionally render it only in the expanded state, and use flexbox to keep the toggle left and link right.

**Tech Stack:** React 19, TypeScript, plain CSS, Node.js test runner

## Global Constraints

- Keep the disclosure button visible in both collapsed and expanded states.
- Render the metrics “Learn more” link only when `showAllMetrics` is `true`.
- Keep the existing metrics URL, label, icon, `target="_blank"`, and `rel="noreferrer"` unchanged.
- Keep “See more”/“See less” first in reading and keyboard focus order and “Learn more” second.
- Keep the controls on a single row at supported viewport widths, aligned to opposite edges.
- Do not change metric content, expansion behavior, other “Learn more” links, or unrelated Background page styles.
- Do not add dependencies.

---

### Task 1: Move the metrics resource link into the expanded action row

**Files:**
- Modify: `frontend/glucose-ml-web/tests/background-page-contract.test.ts:170-195`
- Modify: `frontend/glucose-ml-web/src/features/background/BackgroundPage.tsx:509-554`
- Modify: `frontend/glucose-ml-web/src/features/background/background-page.css:329-370, 586-590`

**Interfaces:**
- Consumes: Existing `showAllMetrics: boolean` state and the `background-glossary-toggle` disclosure control.
- Produces: A `background-glossary-actions` row whose source and focus order is disclosure button followed by a conditionally rendered metrics resource link.

- [ ] **Step 1: Write the failing disclosure hierarchy contract**

Add this test after `background data and metrics learn more links use the requested sources` in `frontend/glucose-ml-web/tests/background-page-contract.test.ts`:

```ts
test("background metrics learn more is available only in the expanded action row", () => {
  const glossaryStart = backgroundPageTsx.indexOf('id="glossary"');
  const glossaryEnd = backgroundPageTsx.indexOf('id="models"');
  const glossarySection = backgroundPageTsx.slice(glossaryStart, glossaryEnd);
  const actionsIndex = glossarySection.indexOf(
    'className="background-glossary-actions"'
  );
  const toggleIndex = glossarySection.indexOf(
    'className="background-glossary-toggle"',
    actionsIndex
  );
  const conditionalIndex = glossarySection.indexOf(
    "{showAllMetrics ? (",
    toggleIndex
  );
  const learnMoreIndex = glossarySection.indexOf(
    'href="https://diabetesjournals.org/care/article/42/8/1593/36184/Clinical-Targets-for-Continuous-Glucose-Monitoring"',
    conditionalIndex
  );

  assert.ok(glossaryStart !== -1);
  assert.ok(glossaryEnd !== -1);
  assert.ok(actionsIndex !== -1);
  assert.ok(toggleIndex > actionsIndex);
  assert.ok(conditionalIndex > toggleIndex);
  assert.ok(learnMoreIndex > conditionalIndex);
  assert.match(
    backgroundPageCss,
    /\.background-glossary-actions\s*\{[^}]*display:\s*flex[^}]*justify-content:\s*space-between[^}]*flex-wrap:\s*nowrap/s
  );
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run from `frontend/glucose-ml-web`:

```bash
node --test --test-name-pattern="background metrics learn more" tests/background-page-contract.test.ts
```

Expected: FAIL in `background metrics learn more is available only in the expanded action row` because `background-glossary-actions` does not exist and the metrics link is still in the heading.

- [ ] **Step 3: Move the link and make its rendering conditional**

In `frontend/glucose-ml-web/src/features/background/BackgroundPage.tsx`, replace the glossary heading wrapper and its link with the heading alone:

```tsx
<h2>What are common CGM Metrics?</h2>
```

Then wrap the existing disclosure button in an action row and render the unchanged link after the button only when expanded:

```tsx
<div className="background-glossary-actions">
  <button
    type="button"
    className="background-glossary-toggle"
    aria-expanded={showAllMetrics}
    aria-controls="background-metric-cards"
    onClick={() => setShowAllMetrics((current) => !current)}
  >
    {showAllMetrics ? "See less" : "See more"}
    <span
      className={`background-glossary-toggle__icon${
        showAllMetrics
          ? " background-glossary-toggle__icon--expanded"
          : ""
      }`}
      aria-hidden="true"
    />
  </button>
  {showAllMetrics ? (
    <a
      className="background-learn-more background-learn-more--inline"
      href="https://diabetesjournals.org/care/article/42/8/1593/36184/Clinical-Targets-for-Continuous-Glucose-Monitoring"
      rel="noreferrer"
      target="_blank"
    >
      Learn more
      <img src="/figma-assets/icon-arrow-up-right.png" alt="" />
    </a>
  ) : null}
</div>
```

The action row must remain after `background-metric-cards`, so the additional cards precede both controls in document order.

- [ ] **Step 4: Add the action-row layout and remove obsolete heading layout**

In `frontend/glucose-ml-web/src/features/background/background-page.css`, remove the `.background-glossary-heading` rule and replace it with:

```css
.background-glossary-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 24px;
  margin-top: 10px;
}
```

In `.background-glossary-toggle`, change:

```css
margin-top: 10px;
```

to:

```css
margin-top: 0;
```

In the narrow-screen media rule, change:

```css
.background-heading-row,
.background-glossary-heading {
```

to:

```css
.background-heading-row {
```

Do not change `.background-learn-more--inline`; it already keeps the link statically positioned with no narrow-screen top margin.

- [ ] **Step 5: Run the focused contract test to verify it passes**

Run from `frontend/glucose-ml-web`:

```bash
node --test --test-name-pattern="background metrics learn more" tests/background-page-contract.test.ts
```

Expected: the focused test passes with zero failures.

- [ ] **Step 6: Run the full Background page contract tests**

Run from `frontend/glucose-ml-web`:

```bash
node --test tests/background-page-contract.test.ts
```

Expected: every Background page contract test passes with zero failures, including the existing source URL and disclosure assertions.

- [ ] **Step 7: Run broader project verification**

Run from `frontend/glucose-ml-web`:

```bash
npm run lint
npm run build
node --test tests/*.test.ts
```

Expected: lint and build exit with status 0, and the full Node test suite reports zero failures.

- [ ] **Step 8: Review and commit the implementation**

Run from the repository root:

```bash
git diff --check
git diff -- frontend/glucose-ml-web/tests/background-page-contract.test.ts frontend/glucose-ml-web/src/features/background/BackgroundPage.tsx frontend/glucose-ml-web/src/features/background/background-page.css
git add frontend/glucose-ml-web/tests/background-page-contract.test.ts frontend/glucose-ml-web/src/features/background/BackgroundPage.tsx frontend/glucose-ml-web/src/features/background/background-page.css
git commit -m "fix: move metrics learn more link below expansion"
```

Expected: the diff contains only the focused regression contract, the conditional action-row markup, and its layout styles, and the commit succeeds.
