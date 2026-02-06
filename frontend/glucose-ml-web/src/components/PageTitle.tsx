import "./PageTitle.css";
import StatsCard from "./StatsCard";

const PageTitle = ({ title, text }: { title: string; text: string }) => {
  const stats = [
    { value: "20+", label: "datasets" },
    { value: "3200", label: "participants" },
    { value: "Y", label: "days of CGM" },
    { value: "41.4M", label: "glucose samples" },
  ];

  return (
    <div className="page-title">
      <StatsCard title={title} subtitle={text} stats={stats} />
    </div>
  );
};

export default PageTitle;
