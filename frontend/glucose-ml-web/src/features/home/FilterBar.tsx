import "./filter-bar.css";
import {
  FILTERS,
  type FilterName,
  type FilterOption,
} from "../../data/filters";
import type { FilterSelections } from "./filter-datasets";
import MultiSelect from "./MultiSelect";

interface FilterBarProps {
  filterSelections: FilterSelections;
  onFilterChange: (label: FilterName, selected: FilterOption[]) => void;
  onClearFilters: () => void;
  filterButtonEnabled: boolean;
  resultCount: number;
  totalCount: number;
}

const FilterBar = ({
  filterSelections,
  onFilterChange,
  onClearFilters,
  filterButtonEnabled,
  resultCount,
  totalCount,
}: FilterBarProps) => {
  // clear all filters
  const handleClear = () => onClearFilters();

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
              onChange={(selected) => onFilterChange(f.label, selected)}
            />
          ))}
        </div>
        <button
          className="home-filter-row__clear"
          type="button"
          disabled={!filterButtonEnabled}
          onClick={handleClear}
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
