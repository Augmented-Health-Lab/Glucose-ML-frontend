import { Link } from "react-router-dom";
import { makeCompareUrl, MAX_COMPARE_DATASETS } from "../../utils/compare-data";
import { canonicalDatasetName } from "../../utils/dataset-names";
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
  // `selectedCards` is parsed straight out of the `?datasets=` query string
  // (see `parseSelectedDatasets` in HomePage) with no membership check of
  // its own. Only the subset that resolves to a real, known dataset may
  // ever reach GA4 as `dataset_combination`, and only as its canonical
  // spelling — never the raw query text — so a stale/hand-edited link
  // (extra separators, whitespace, wrong casing) can't land there either
  // verbatim or under a spelling that fragments GA4's cardinality for the
  // same dataset. This is analytics-only: the rendered slots below still
  // map over the full `selectedCards`.
  const knownSelectedCardNames = selectedCards
    .map(canonicalDatasetName)
    .filter((name): name is string => name !== undefined);
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
          // `selectionCount` is deliberately the raw `selectedCards.length`,
          // not `knownSelectedCardNames.length`: it reports how many slots
          // the user actually filled (the real click they took), while
          // `datasetNames` reports only the subset GA4 is allowed to name.
          // The two can diverge — e.g. `?datasets=Foo,T1DEXI,AZT1D` reports
          // `selection_count: 3` alongside a two-name `dataset_combination`,
          // and an all-unknown selection reports a nonzero count with an
          // empty combination — which is intentional, not a bug: the count
          // is a UI-usage metric, the combination is a privacy-gated payload,
          // and conflating them (e.g. by filtering the count too) would make
          // the count under-report real usage whenever a stale/hand-edited
          // link is involved.
          <Link
            className="home-compare-bar__button"
            to={makeCompareUrl(selectedCards)}
            onClick={() =>
              trackCompareStart({
                selectionCount: selectedCards.length,
                datasetNames: knownSelectedCardNames,
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
