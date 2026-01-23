import PageTitle from "./PageTitle";
import FilterBar from "./FilterBar";
import CompareBar from "./CompareBar";
import DatasetGrid from "./DatasetGrid";
import { useState, useEffect } from "react";
import LegendModal from "./dataset_detail/LegendModal";

const HomePage = () => {
  const [filterSelections, setFilterSelections] = useState<{
    [key: string]: string[];
  }>({});
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);

  // load static datasets info
  useEffect(() => {
    fetch("/static_data/dataset_card_info.json")
      .then((res) => res.json())
      .then((data) => setDatasets(data));
  }, []);

  const [legendOpen, setLegendOpen] = useState(false);

  // callback for filter
  const handleFilterChange = (label: string, selected: string[]) => {
    setFilterSelections((prev) => ({ ...prev, [label]: selected }));
  };

  // callback for card
  const handleCardSelect = (title: string, checked: boolean) => {
    setSelectedCards((prev) =>
      checked ? [...prev, title] : prev.filter((t) => t !== title)
    );
  };

  const hasFilter = Object.values(filterSelections).some(
    (arr) => arr.length > 0
  );

  return (
    <div className="container-lg my-5">
      <PageTitle
        title="Explore glucose datasets used in AI research"
        text="Find CGM datasets, compare their structure, and download the right datasets for your study."
      />
      <LegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />

      <FilterBar
        filterSelections={filterSelections}
        onFilterChange={handleFilterChange}
        filterButtonEnabled={hasFilter}
        onLegendClick={() => setLegendOpen(true)}
      />
      <CompareBar compareEnabled={selectedCards.length >= 2} />
      <DatasetGrid
        datasets={datasets}
        selectedCards={selectedCards}
        onCardSelect={handleCardSelect}
      />
    </div>
  );
};

export default HomePage;
