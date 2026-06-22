import { FIGMA_COMPARE_ICONS } from "./figma-compare-icons";
import { MAX_COMPARE_DATASETS } from "../../utils/compare-data";

type Props = {
  datasetNames: string[];
  onRemoveDataset: (datasetName: string) => void;
  onAddDataset: () => void;
};

const ComparingChips = ({
  datasetNames,
  onRemoveDataset,
  onAddDataset,
}: Props) => {
  return (
    <div className="compare-chips">
      <p className="compare-chips__label">Comparing:</p>
      <div className="compare-chips__items">
        {datasetNames.map((name) => (
          <span className="glm-chip" key={name}>
            {name}
            <button
              type="button"
              className="compare-chips__remove-button"
              onClick={() => onRemoveDataset(name)}
              aria-label={`Remove ${name} from comparison`}
            >
              <img
                aria-hidden="true"
                className="compare-chips__icon compare-chips__icon--remove"
                src={FIGMA_COMPARE_ICONS.x}
                alt=""
              />
            </button>
          </span>
        ))}
        {datasetNames.length < MAX_COMPARE_DATASETS && (
          <button
            type="button"
            className="glm-chip glm-chip-dashed"
            onClick={onAddDataset}
          >
            <img
              aria-hidden="true"
              className="compare-chips__icon compare-chips__icon--add"
              src={FIGMA_COMPARE_ICONS.plus}
              alt=""
            />
            Add Dataset
          </button>
        )}
      </div>
    </div>
  );
};

export default ComparingChips;
