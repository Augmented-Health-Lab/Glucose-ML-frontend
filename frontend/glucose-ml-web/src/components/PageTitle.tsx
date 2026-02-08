import "./PageTitle.css";
import StatsCard from "./StatsCard";

const PageTitle = ({ title, text }: { title: string; text: string }) => {
  const stats = [
    { value: "20+", label: "datasets" },
    { value: "4393", label: "participants" },
    { value: "337984", label: "days of CGM" },
    { value: "44.9M", label: "glucose samples" },
  ];

  return (
    <div className="page-title">
      <StatsCard title={title} subtitle={text} stats={stats} />
    </div>
  );
};

export default PageTitle;
