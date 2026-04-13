import "./DatasetGrid.css";
import DatasetCard, { type DatasetCardProps } from "./DatasetCard";

interface Props {
  datasets: DatasetCardProps[];
  totalDatasets: number;
  isFiltered: boolean;
  filterKey: string;
  selectedCards: string[];
  onCardSelect: (title: string, checked: boolean) => void;
}

const DatasetGrid = ({ datasets, totalDatasets, isFiltered, filterKey, selectedCards, onCardSelect }: Props) => {
  return (
    <div>
      {isFiltered && (
        <p className="results-count">
          Showing <strong>{datasets.length}</strong> of <strong>{totalDatasets}</strong> datasets
        </p>
      )}

      {datasets.length === 0 ? (
        <div className="dataset-grid">
          <p className="subtitle">No results match your filters.</p>
        </div>
      ) : (
        <div className="dataset-grid" key={filterKey}>
          {datasets.map((dataset) => (
            <DatasetCard
              key={dataset.title}
              {...dataset}
              selected={selectedCards.includes(dataset.title)}
              onSelect={(checked) => onCardSelect(dataset.title, checked)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DatasetGrid;