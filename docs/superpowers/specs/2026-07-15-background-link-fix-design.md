# Background Link Fix Design

## Problem

The guide modal displays “New to CGM data? See background” as plain text, so users cannot navigate from it to the existing background page. A prior change replaced the original anchor with a paragraph and added a contract test that requires the link to be absent.

## Design

Render the full text as a React Router `Link` targeting `/background`. This keeps navigation in the same browser tab, avoids a full page reload, and follows the internal-navigation pattern already used by the application shell and footer.

Keep the current wording and layout. Restore link-specific styling so the text is visibly interactive and remains responsive at narrow viewport widths. Navigating to `/background` will naturally unmount the dataset detail page and its open guide modal.

## Testing

Update the guide modal contract test first so it requires a React Router `Link` with the `/background` destination and no longer requires the link to be absent. Run the test to confirm it fails against the current paragraph, implement the minimal component and style changes, then rerun the focused test followed by the broader project checks.

## Scope

This change is limited to the guide modal link, its styles, and its regression test. It does not change the background route, modal behavior, or other navigation.
