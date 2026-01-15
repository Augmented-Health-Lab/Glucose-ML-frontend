import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DATASET_DETAILS_MAP } from "../MockData";
import "./DatasetDetail.css";
import "./DatasetHeader.css";
import "./PopulationSection.css";
import "./DataSourcesSection.css";
import "./CGMDataSection.css";
import "./GlucoseRangeChart.css";

import DatasetHeader from "./DatasetHeader.tsx";
import PopulationSection from "./PopulationSection.tsx";
import DataSourcesSection from "./DataSourcesSection.tsx";
import CGMDataSection from "./CGMDataSection.tsx";

// REUSABLE COMPONENTS FROM DATASETCARD
const type_color_map = {
  T2D: "var(--light-orange)",
  PreD: "var(--light-yellow)",
  ND: "var(--light-green)",
  T1D: "var(--light-red)",
};

type IconType = keyof typeof type_color_map;

function getColor(type: string): string {
  if (type in type_color_map) {
    return type_color_map[type as IconType];
  }
  return "var(--light-blue)";
}

const RoundIcon = ({ type }: { type: string }) => {
  const color = getColor(type);
  return (
    <span className="round-icon" style={{ backgroundColor: color }}>
      {type}
    </span>
  );
};

const DatasetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [showByGroup, setShowByGroup] = useState(false);

  const dataset = id ? DATASET_DETAILS_MAP[id] : null;

  if (!dataset) {
    return (
      <div className="container-lg my-5 text-center">
        <h2 className="h2 mb-3">Dataset not found</h2>
        <button onClick={() => navigate("/")} className="btn control-btn metadata">
          Back to datasets
        </button>
      </div>
    );
  }

  return (
    <div className="dataset-detail-page">
      <DatasetHeader dataset={dataset} onBack={() => navigate("/")} />

      <div className="container-lg my-5">
        <div className="row g-4">
          {/* Left column slightly narrower */}
          <div className="col-md-5 col-lg-4 dataset-left-col">
            <PopulationSection population={dataset.population} RoundIcon={RoundIcon} />
            <DataSourcesSection dataSources={dataset.dataSources} RoundIcon={RoundIcon} />
          </div>

          {/* Right column slightly wider */}
          <div className="col-md-7 col-lg-8 dataset-right-col">
            <CGMDataSection
              cgmData={dataset.cgmData}
              glucoseRanges={dataset.glucoseRanges}
              showByGroup={showByGroup}
              setShowByGroup={setShowByGroup}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetDetail;
