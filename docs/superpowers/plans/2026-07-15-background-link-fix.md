# Background Link Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make “New to CGM data? See background” navigate in the same tab from the guide modal to the existing `/background` route.

**Architecture:** Replace the modal's non-interactive paragraph with React Router's semantic `Link`, following the internal-navigation pattern already used by the app shell and footer. Preserve the current copy and layout while restoring visible link styling, and protect the behavior with the existing source-contract test.

**Tech Stack:** React 19, React Router 7, TypeScript, CSS, Node.js test runner

## Global Constraints

- The destination is the existing `/background` route.
- Navigation remains in the same browser tab and does not trigger a full page reload.
- Keep the exact copy “New to CGM data? See background”.
- Do not change modal behavior, the background route, or other navigation.

---

### Task 1: Restore the guide modal background link

**Files:**
- Modify: `frontend/glucose-ml-web/tests/legend-data.test.ts:100`
- Modify: `frontend/glucose-ml-web/src/features/dataset-detail/LegendModal.tsx:2,65`
- Modify: `frontend/glucose-ml-web/src/features/dataset-detail/legend-modal.css:81,319`

**Interfaces:**
- Consumes: React Router `Link` with `to: string` and the existing `/background` route.
- Produces: A semantic link with class `legend-learn-link` and destination `/background`.

- [ ] **Step 1: Write the failing regression test**

Replace the assertion that requires the link to be absent with this assertion:

```ts
assert.match(
  legendModalTsx,
  /<Link\s+className="legend-learn-link"\s+to="\/background">\s*New to CGM data\? See background\s*<\/Link>/s
);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd frontend/glucose-ml-web
node --test tests/legend-data.test.ts
```

Expected: FAIL because `LegendModal.tsx` still renders `legend-learn-text` as a paragraph instead of a `Link` to `/background`.

- [ ] **Step 3: Implement the minimal internal link**

Add the React Router import to `LegendModal.tsx`:

```tsx
import { Link } from "react-router-dom";
```

Replace the plain paragraph with:

```tsx
<Link className="legend-learn-link" to="/background">
  New to CGM data? See background
</Link>
```

Rename `.legend-learn-text` to `.legend-learn-link` in both the base rule and responsive selector in `legend-modal.css`, and add underlining while retaining the current layout:

```css
.legend-learn-link {
  display: block;
  width: 860px;
  margin: 8px 0 0;
  color: var(--glm-color-brand-dark);
  font-size: 14px;
  font-weight: 400;
  line-height: normal;
  text-decoration: underline;
}
```

```css
.legend-learn-link,
.legend-divider,
.legend-divider--right,
.pop-desc,
.source-desc {
  width: 100%;
}
```

- [ ] **Step 4: Run focused and project verification**

Run:

```bash
cd frontend/glucose-ml-web
node --test tests/legend-data.test.ts
npm run lint
npm run build
```

Expected: the focused test, lint, and production build all complete successfully without errors.

- [ ] **Step 5: Commit the implementation**

```bash
git add frontend/glucose-ml-web/tests/legend-data.test.ts \
  frontend/glucose-ml-web/src/features/dataset-detail/LegendModal.tsx \
  frontend/glucose-ml-web/src/features/dataset-detail/legend-modal.css
git commit -m "fix: restore guide background link"
```
