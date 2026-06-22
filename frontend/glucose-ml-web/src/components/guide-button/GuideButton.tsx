import "./guide-button.css";

type Props = {
  onClick: () => void;
  className?: string;
};

export default function GuideButton({ onClick, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`guide-button ${className}`.trim()}
    >
      <span className="guide-button__icon" aria-hidden="true">
        i
      </span>
      Guide
    </button>
  );
}
