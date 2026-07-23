import { useState, useRef, useEffect } from "react";
import "./multi-select.css";
import { getAccessIcon, normalizeDatasetAccess } from "../../utils/access";

const populationOptionLabels: Record<string, string> = {
  T1D: "Type 1 Diabetes",
  T2D: "Type 2 Diabetes",
  Prediabetic: "Prediabetes",
  "Non diabetic": "No diabetes",
};

const accessOptionLabels: Record<string, string> = {
  Open: "Open access",
  Controlled: "Controlled access",
};

function getOptionLabel(filterLabel: string, option: string) {
  if (filterLabel === "Population") {
    return populationOptionLabels[option] ?? option;
  }

  if (filterLabel === "Access") {
    return accessOptionLabels[option] ?? option;
  }

  return option;
}

interface MultiSelectProps {
  label: string;
  prompt: string;
  multi: boolean;
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onOptionToggle?: (option: string, action: "add" | "remove") => void;
}

const MultiSelect = ({
  label,
  prompt,
  multi,
  options,
  selected,
  onChange,
  onOptionToggle,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: string) => {
    const isSelected = selected.includes(option);
    let newSelected: string[];

    if (multi) {
      newSelected = isSelected
        ? selected.filter((item) => item !== option)
        : [...selected, option];
    } else {
      newSelected = isSelected ? [] : [option];
      setIsOpen(false);
    }

    onOptionToggle?.(option, isSelected ? "remove" : "add");
    onChange(newSelected);
  };

  const getButtonLabel = () => {
    if (selected.length === 0) {
      return label;
    }
    if (multi) {
      return selected.map((option) => getOptionLabel(label, option)).join(", ");
    }
    return getOptionLabel(label, selected[0]);
  };

  return (
    <div className="multi-select" ref={dropdownRef}>
      <button
        className={`multi-select-toggle ${
          selected.length > 0 ? "has-selection" : ""
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={toggleDropdown}
        type="button"
      >
        <span className="multi-select-toggle__label">{getButtonLabel()}</span>
        <svg
          className={`multi-select-toggle__arrow ${isOpen ? "open" : ""}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`multi-select-menu multi-select-menu--${label
            .toLowerCase()
            .replaceAll(" ", "-")}`}
        >
          <div className="multi-select-menu__prompt">{prompt}</div>
          <div className="multi-select-menu__options" role="listbox">
            {options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <button
                  type="button"
                  key={option}
                  className={`multi-select-option ${
                    isSelected ? "selected" : ""
                  }`}
                  aria-selected={isSelected}
                  onClick={() => handleOptionClick(option)}
                >
                  <div
                    className={`multi-select-option__checkbox${
                      !multi ? " single-select" : ""
                    }`}
                  >
                    {isSelected &&
                      (multi &&
                      label !== "Population" &&
                      label !== "Data Sources" ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M13.3333 4L6 11.3333L2.66667 8"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null)}
                  </div>
                  <span className="multi-select-option__label">
                    {getOptionLabel(label, option)}
                  </span>
                  {label === "Access" && (
                    <img
                      className={`multi-select-option__access-icon${
                        (normalizeDatasetAccess(option) ?? "Controlled") ===
                        "Controlled"
                          ? " multi-select-option__access-icon--controlled"
                          : ""
                      }`}
                      src={getAccessIcon(option)}
                      alt=""
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
