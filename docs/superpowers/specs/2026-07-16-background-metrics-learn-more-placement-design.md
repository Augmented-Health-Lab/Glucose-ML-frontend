# Background Metrics Learn More Placement Design

## Problem

The “Learn more” link in the Background page’s “What are common CGM Metrics?” section currently appears beside the section heading. The requested hierarchy requires the link to be hidden in the collapsed state and made available only after the user selects “See more.” In the expanded state, “See less” should remain at the bottom left and “Learn more” should appear at the bottom right.

## Design

Remove the metrics “Learn more” link from the glossary heading. Add a full-width action row beneath the metric-card grid containing the existing disclosure button on the left. Conditionally render the existing “Learn more” link on the right only when `showAllMetrics` is `true`.

The disclosure button remains available in both states and retains its existing label, icon, `aria-expanded`, and `aria-controls` behavior. The external link retains its existing URL, label, icon, new-tab behavior, and relationship attributes. The action row remains a single row at all supported viewport widths, with the disclosure control aligned left and the expanded-state link aligned right, preserving disclosure-first reading and focus order.

## Interaction Flow

1. Initially, the primary metric cards and “See more” button are visible; “Learn more” is not rendered.
2. Selecting “See more” expands the metric content, changes the button to “See less,” and renders “Learn more” at the action row’s bottom-right edge.
3. Selecting “See less” collapses the content and removes “Learn more” from both the page and keyboard focus order.

## Testing

Extend the Background page contract test to require the metrics link to be conditionally rendered from `showAllMetrics` within an action row that follows the card grid and places the disclosure control before the link in source order. Run the focused contract test first to confirm the new assertion fails, then make the minimal component and CSS changes and rerun the focused test followed by lint, build, and the full test suite.

## Scope

This change is limited to the “What are common CGM Metrics?” section. It does not change metric content, expansion behavior, the external URL, other “Learn more” links, or unrelated Background page styling.
