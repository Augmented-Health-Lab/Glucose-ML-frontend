# Dataset Helper Links Design

## Problem

The AI-READI detail page still directs “Request access” to Fairhub dataset version 2. Every dataset detail page also directs “Helper scripts” to the shared `2_Harmonize-cgm-datasets` directory instead of the subfolder containing the two scripts for that dataset.

## Design

Update AI-READI’s `Link to dataset` value in `table1_detail_data.json` to `https://fairhub.io/datasets/3`.

Add a helper-link utility with the shared GitHub directory as its base and an explicit mapping from each current dataset title to its upstream folder name. `DatasetHeader` will resolve the link from `dataset.title`, so every detail page opens the folder containing both the extraction and metadata scripts for that dataset. Explicit mappings handle display-name differences such as `CGMacros Dexcom` mapping to `CGMacros_Dexcom` without relying on fragile title transformations.

If a future dataset has no mapping, retain the existing shared-directory URL as a safe fallback rather than producing a broken dataset-specific link.

## Testing

Write regression tests first that require AI-READI’s new Fairhub URL and require every dataset in `table1_detail_data.json` to resolve to its exact dataset-specific helper folder. Confirm the tests fail against the current shared-folder implementation, make the minimal data and component changes, and rerun the focused tests followed by the full project checks.

## Scope

This change only updates the AI-READI access target and Helper scripts destinations. It does not change link labels, styling, target-window behavior, dataset download links, or upstream helper scripts.
