import "./filter-bar.css";
import { FILTERS } from "../../data/filters";
import MultiSelect from "./MultiSelect";
import type { FilterAction, FilterCategory, FilterOption } from "../../analytics";

interface FilterBarProps {
  filterSelections: { [key: string]: string[] };
  onFilterChange: (label: string, selected: string[]) => void;
  onFilterOptionToggle: (
    category: FilterCategory,
    option: FilterOption,
    action: FilterAction
  ) => void;
  onClearFilters: () => void;
  filterButtonEnabled: boolean;
  resultCount: number;
  totalCount: number;
}

// A verified (not asserted) narrowing: `option` always comes from the very
// `options` list passed to a given filter's MultiSelect, so checking
// membership in that list is a genuine runtime proof that `option` is a
// `FilterOption` — not an unchecked cast.
function isFilterOption(options: readonly string[], value: string): value is FilterOption {
  return options.includes(value);
}

const FilterBar = ({
  filterSelections,
  onFilterChange,
  onFilterOptionToggle,
  onClearFilters,
  filterButtonEnabled,
  resultCount,
  totalCount,
}: FilterBarProps) => {
  return (
    <section className="home-filter-row" aria-label="Dataset filters">
      <div className="home-filter-row__left">
        <div className="home-filter-row__filters">
          {FILTERS.map((f) => (
            <MultiSelect
              key={f.label}
              label={f.label}
              prompt={f.prompt}
              multi={f.multi}
              options={f.options}
              selected={filterSelections[f.label] || []}
              onChange={(selected: string[]) =>
                onFilterChange(f.label, selected)
              }
              onOptionToggle={(option, action) => {
                if (isFilterOption(f.options, option)) {
                  onFilterOptionToggle(f.label, option, action);
                }
              }}
            />
          ))}
        </div>
        <button
          className="home-filter-row__clear"
          type="button"
          disabled={!filterButtonEnabled}
          onClick={onClearFilters}
        >
          Clear all filters
        </button>
      </div>
      <p className="home-filter-row__count">
        {resultCount} of {totalCount} results
      </p>
    </section>
  );
};

export default FilterBar;
