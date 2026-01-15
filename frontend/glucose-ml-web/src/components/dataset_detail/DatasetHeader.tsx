import { IoChevronBack } from "react-icons/io5";
import "./DatasetHeader.css";

type Props = {
  dataset: {
    title: string;
    duration: string;
    dateRange: string;
    fullDescription: string;
  };
  onBack: () => void;
};

const DatasetHeader = ({ dataset, onBack }: Props) => {
  return (
    <div className="detail-header">
      <div className="container-lg">
        <button className="back-button metadata" onClick={onBack}>
          <IoChevronBack size={20} /> Back
        </button>

        <div className="detail-header-content">
          <h1 className="h1 mb-2">{dataset.title}</h1>

          <p className="metadata mb-3">
            {dataset.duration} | {dataset.dateRange}
          </p>

          <p className="body mb-4">{dataset.fullDescription}</p>

          <div className="detail-header-actions d-flex gap-2 flex-wrap justify-content-center">
            <button className="btn control-btn metadata px-4 py-2">Download dataset</button>
            <button className="btn btn-outline-secondary metadata px-4 py-2">Link to paper</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetHeader;
