import "./PageTitle.css";
import StatsCard from "./StatsCard";

const PageTitle = ({ title, text }: { title: string; text: string }) => {
  const stats = [
    { value: "20+", label: "Datasets" },
    { value: "4393", label: "Participants" },
    { value: "337984", label: "Days of CGM" },
    { value: "44.9M", label: "Glucose samples" },
  ];

  return (
    <div className="page-title">
      <StatsCard title={title} subtitle={text} stats={stats} />
    </div>
  );
};

export default PageTitle;
