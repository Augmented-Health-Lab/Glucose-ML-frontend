import "./PageTitle.css";
const PageTitle = ({ title, text }: { title: string; text: string }) => {
  return (
    <div className="text-center page-title">
      <h1 className="h1">{title}</h1>
      <p className="subtitle">{text}</p>
    </div>
  );
};

export default PageTitle;
