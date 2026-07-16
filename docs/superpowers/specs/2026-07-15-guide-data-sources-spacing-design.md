# Guide Data Sources Spacing Design

## Problem

The Guide modal's Data Sources list currently places 24 px between each data-source item. Figma frame 36789 and the requested layout require 16 px between items while retaining 24 px between the Data Sources description and the list.

## Design

Keep the current Guide modal markup and shared 24 px subtitle spacing. Change only the `.source-list` flex gap from 24 px to 16 px. This targets the Data Sources list without affecting Population, Accessibility, or Glucose Distribution spacing.

## Testing

Add a focused CSS contract assertion requiring `.legend-block-subtitle` to retain a 24 px bottom margin and `.source-list` to use a 16 px gap. Run the focused test first to confirm it fails because the source list still uses 24 px, apply the CSS change, then rerun the focused test and broader project checks.

## Scope

This change is limited to Data Sources spacing and its regression coverage. It does not alter content, typography, modal dimensions, responsive behavior, or other Guide sections.
