import { Link } from "react-router-dom";
import { makeCompareUrl, MAX_COMPARE_DATASETS } from "../../utils/compare-data";
import { trackCompareStart } from "../../analytics";

type CompareBarProps = {
  selectedCards: string[];
  onRemoveSelection: (title: string) => void;
  onClearSelection: () => void;
};

const REMOVE_ICON = "/figma-assets/icon-compare-x.svg";

const CompareBar = ({
  selectedCards,
  onRemoveSelection,
  onClearSelection,
}: CompareBarProps) => {
  const hasSelections = selectedCards.length > 0;
  const canCompare = selectedCards.length >= 2;
  const emptySlotCount =
    selectedCards.length < MAX_COMPARE_DATASETS
      ? MAX_COMPARE_DATASETS - selectedCards.length
      : 0;

  if (!hasSelections) return null;

  return (
    <aside
      className="home-compare-bar"
      aria-label="Selected datasets for comparison"
    >
      <div className="home-compare-bar__inner">
        <div className="home-compare-bar__selection">
          <div className="home-compare-bar__slot-group">
            <p className="home-compare-bar__label">
              Select up to {MAX_COMPARE_DATASETS} datasets to compare:
            </p>
            <div className="home-compare-bar__slots">
              {selectedCards.map((title) => (
                <span
                  className="home-compare-bar__slot home-compare-bar__slot--selected"
                  key={title}
                >
                  <span className="home-compare-bar__slot-title">{title}</span>
                  <button
                    type="button"
                    className="home-compare-bar__remove"
                    onClick={() => onRemoveSelection(title)}
                    aria-label={`Remove ${title} from comparison`}
                  >
                    <img
                      className="home-compare-bar__remove-icon"
                      src={REMOVE_ICON}
                      alt=""
                      aria-hidden="true"
                    />
                  </button>
                </span>
              ))}
              {Array.from({ length: emptySlotCount }, (_, index) => {
                const slotIndex = selectedCards.length + index;

                return (
                  <span
                    className="home-compare-bar__slot home-compare-bar__slot--empty"
                    key={`empty-${slotIndex}`}
                    aria-hidden="true"
                  >
                    Dataset {slotIndex + 1}
                  </span>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className="home-compare-bar__clear"
            onClick={onClearSelection}
          >
            Clear selection
          </button>
        </div>
        {canCompare ? (
          <Link
            className="home-compare-bar__button"
            to={makeCompareUrl(selectedCards)}
            onClick={() =>
              trackCompareStart({
                selectionCount: selectedCards.length,
                datasetNames: selectedCards,
              })
            }
          >
            Compare datasets ({selectedCards.length} selected)
          </Link>
        ) : (
          <button
            className="home-compare-bar__button home-compare-bar__button--disabled"
            type="button"
            disabled
          >
            Compare datasets ({selectedCards.length} selected)
          </button>
        )}
      </div>
    </aside>
  );
};

export default CompareBar;
