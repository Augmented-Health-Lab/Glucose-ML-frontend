import "./FilterBar.css";
import { LuInfo } from "react-icons/lu";
import { FILTERS } from "./MockData";
import MultiSelect from "./MultiSelect";

interface FilterBarProps {
  filterSelections: { [key: string]: string[] };
  onFilterChange: (label: string, selected: string[]) => void;
  filterButtonEnabled: boolean;
  onLegendClick?: () => void;
}

const FilterBar = ({
  filterSelections,
  onFilterChange,
  filterButtonEnabled,
  onLegendClick,
}: FilterBarProps) => {
  // clear all filters
  const handleClear = () => {
    Object.keys(filterSelections).forEach((label) => onFilterChange(label, []));
  };

  return (
    <div className="d-flex my-5 align-items-end flex-wrap">
      <div className="d-flex gap-2 flex-wrap metadata">
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
          className="btn d-flex align-items-center gap-2 legend-btn"
          type="button"
          onClick={onLegendClick}
        >
          <LuInfo />
          <span className="metadata legend-btn">Legend & info</span>
        </button>
      </div>
      <div className="ms-auto">
        <button
          disabled={!filterButtonEnabled}
          className="btn metadata control-btn"
          onClick={handleClear}
        >
          Clear all filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
