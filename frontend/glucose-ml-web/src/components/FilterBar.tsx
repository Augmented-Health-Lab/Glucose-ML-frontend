import "./FilterBar.css";
import { LuInfo } from "react-icons/lu";
import { FILTERS } from "./MockData";
import MultiSelect from "./MultiSelect";

interface FilterBarProps {
  filterSelections: { [key: string]: string[] };
  onFilterChange: (label: string, selected: string[]) => void;
  onClear: () => void;
  filterButtonEnabled: boolean;
  onLegendClick?: () => void;
}

const FilterBar = ({
  filterSelections,
  onFilterChange,
  onClear,
  filterButtonEnabled,
  onLegendClick,
}: FilterBarProps) => {
  return (
  <div className="filter-bar d-flex align-items-center flex-wrap">
    <div className="d-flex gap-2 flex-wrap align-items-center">
      {FILTERS.map((f) => (
        <MultiSelect
          key={f.label}
          label={f.label}
          prompt={f.prompt}
          multi={f.multi}
          options={f.options}
          selected={filterSelections[f.label] || []}
          onChange={(selected: string[]) => onFilterChange(f.label, selected)}
        />
      ))}
      <button
        type="button"
        disabled={!filterButtonEnabled}
        className="clear-filters-btn metadata"
        onClick={onClear}
      >
        Clear all filters
      </button>
    </div>
    <div className="ms-auto">
      <button
        className="btn d-flex align-items-center gap-2 legend-btn"
        type="button"
        onClick={onLegendClick}
      >
        <LuInfo />
        <span className="metadata legend-btn">Legend & info</span>
      </button>
    </div>
  </div>
  );
};

export default FilterBar;