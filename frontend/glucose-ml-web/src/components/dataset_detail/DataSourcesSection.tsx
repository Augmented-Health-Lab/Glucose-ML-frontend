import type React from "react";
import "./DataSourcesSection.css";

type Props = {
  dataSources: { icon: string; name: string; detail: string }[];
  RoundIcon: ({ type }: { type: string }) => React.ReactElement;
};

const DataSourcesSection = ({ dataSources, RoundIcon }: Props) => {
  return (
    <div className="detail-card">
      <h2 className="h2 mb-3">Data sources</h2>
      {dataSources.map((source) => (
        <div key={source.icon} className="source-row">
          <RoundIcon type={source.icon} />
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between">
              <span className="body">{source.name}</span>
              <span className="body text-end">{source.detail}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DataSourcesSection;



