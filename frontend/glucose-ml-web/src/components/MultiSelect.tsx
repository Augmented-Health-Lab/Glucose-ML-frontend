// claude.ai helped

import { useState, useRef, useEffect } from "react";
import "./MultiSelect.css";
import { RoundIcon } from "./DatasetCard";

const type_short_code_map = {
  T1D: "T1D",
  T2D: "T2D",
  Prediabetic: "PreD",
  "Non diabetic": "ND",
};

type TypeKey = keyof typeof type_short_code_map;

interface MultiSelectProps {
  label: string;
  prompt: string;
  multi: boolean;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelect = ({
  label,
  prompt,
  multi,
  options,
  selected,
  onChange,
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
    let newSelected: string[];

    if (multi) {
      if (selected.includes(option)) {
        newSelected = selected.filter((item) => item !== option);
      } else {
        newSelected = [...selected, option];
      }
    } else {
      if (selected.includes(option)) {
        newSelected = [];
      } else {
        newSelected = [option];
      }
      setIsOpen(false);
    }

    onChange(newSelected);
  };

  const getButtonLabel = () => {
    if (selected.length === 0) {
      return label;
    }
    if (multi) {
      return selected.join(", ");
    }
    return selected[0];
  };

  return (
    <div className="multiselect-wrapper" ref={dropdownRef}>
      <button
        className={`multiselect-button ${
          selected.length > 0 ? "has-selection" : ""
        }`}
        onClick={toggleDropdown}
        type="button"
      >
        <span className="multiselect-label">{getButtonLabel()}</span>
        <svg
          className={`multiselect-arrow ${isOpen ? "open" : ""}`}
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
        <div className="multiselect-dropdown">
          <div className="multiselect-prompt">{prompt}</div>
          <div className="multiselect-options">
            {options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <div
                  key={option}
                  className={`multiselect-option ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => handleOptionClick(option)}
                >
                  <div
                    className={`multiselect-checkbox${
                      !multi ? " single-select" : ""
                    }`}
                  >
                    {isSelected &&
                      (multi ? (
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
                  <span className="multiselect-option-label">{option}</span>
                  {label === "Data types" && (
                    <RoundIcon
                      type={option.charAt(0).toUpperCase()}
                    ></RoundIcon>
                  )}
                  {label === "Population" && (
                    <RoundIcon
                      type={type_short_code_map[option as TypeKey]}
                    ></RoundIcon>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
