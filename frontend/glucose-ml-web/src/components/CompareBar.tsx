const CompareBar = ({ compareEnabled }: { compareEnabled: boolean }) => {
  return (
    <div className="d-flex align-items-center my-5 gap-2 flex-wrap">
      <div>
        <span className="body">
          Use checkboxes to compare datasets. Click a card for details.
        </span>
      </div>
      <div className="ms-auto">
        <button
          className="btn metadata control-btn px-4 py-2"
          disabled={!compareEnabled}
        >
          Compare datasets (select at least 2)
        </button>
      </div>
    </div>
  );
};

export default CompareBar;
