import "./DatasetGrid.css";
import DatasetCard, { type DatasetCardProps } from "./DatasetCard";

interface Props {
  datasets: DatasetCardProps[];
  selectedCards: string[];
  onCardSelect: (title: string, checked: boolean) => void;
}

const DatasetGrid = ({ datasets, selectedCards, onCardSelect }: Props) => {
  if (datasets.length === 0) {
    return (
      <div className="dataset-grid">
        <p className="subtitle">No results match your filters.</p>
      </div>
    );
  }

  return (
    <div className="dataset-grid">
      {datasets.map((dataset) => (
        <DatasetCard
          key={dataset.title}
          {...dataset}
          selected={selectedCards.includes(dataset.title)}
          onSelect={(checked) => onCardSelect(dataset.title, checked)}
        />
      ))}
    </div>
  );
};

export default DatasetGrid;
