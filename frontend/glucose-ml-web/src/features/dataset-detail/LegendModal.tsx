// src/features/dataset-detail/LegendModal.tsx
import { useEffect } from "react";
import "./legend-modal.css";
import {
  legendAccessTiers,
  legendDataSources,
  legendGlucoseRanges,
  legendPopulation,
} from "./legend-data";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LegendModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="legend-modal-overlay" onMouseDown={onClose}>
      <div
        className="legend-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legend-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="legend-ribbon" aria-hidden="true" />

        <button
          type="button"
          className="legend-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <img
            className="legend-modal-close__icon"
            src="/figma-assets/icon-guide-close.svg"
            alt=""
            aria-hidden="true"
          />
        </button>

        <div className="legend-modal-content">
          <h2 id="legend-title" className="legend-title">
            Guide to Exploring CGM Datasets
          </h2>
          <a className="legend-learn-link" href="/background">
            New to CGM data? See background →
          </a>

          <div className="legend-columns">
            <div className="legend-col">
              <section className="legend-block">
                <div className="legend-block-title">Glucose Distribution</div>
                <div className="legend-block-subtitle">
                  An overview of glucose data distribution across all
                  participants in a given dataset in accordance with clinical
                  targets for continuous glucose monitoring data interpretation.
                </div>

                <ul className="legend-swatch-list">
                  {legendGlucoseRanges.map((range) => (
                    <li key={range.label}>
                      <span
                        className={`legend-swatch ${range.className}`}
                        aria-hidden="true"
                      />
                      <span>{range.label}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="legend-divider" />

              <section className="legend-block">
                <div className="legend-block-title">Data Sources</div>
                <div className="legend-block-subtitle">
                  All datasets in the Glucose-ML collection include continuous
                  glucose monitoring data. Many datasets also include
                  complementary data from other sources.
                </div>

                <div className="source-list">
                  {legendDataSources.map((source) => (
                    <div className="source-item" key={source.code}>
                      <div className="source-text">
                        <div className="source-title">{source.label}</div>
                        <div className="source-desc">{source.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="legend-col">
              <section className="legend-block">
                <div className="legend-block-title">Population</div>
                <div className="legend-block-subtitle">
                  An overview of the number of participants represented in a
                  given dataset in accordance with the diabetes groups reported
                  in the original dataset reference.
                </div>

                <div className="population-list">
                  {legendPopulation.map((population) => (
                    <div className="population-item" key={population.code}>
                      <span
                        className={`legend-pop-badge ${population.className}`}
                      >
                        {population.label}
                      </span>
                      <div className="pop-desc">{population.description}</div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="legend-divider legend-divider--right" />

              <section className="legend-block">
                <div className="legend-block-title">Accessibility</div>
                <div className="legend-block-subtitle">
                  All datasets in the Glucose-ML collection are public. However,
                  datasets are released via one of the following options:
                </div>

                <div className="access-list">
                  {legendAccessTiers.map((tier) => (
                    <div className="access-item" key={tier.type}>
                      <div className="access-title">
                        <img
                          className={
                            tier.type === "Controlled"
                              ? "access-icon access-icon--controlled"
                              : "access-icon"
                          }
                          src={tier.icon}
                          alt=""
                          aria-hidden="true"
                        />
                        <span>{tier.label}</span>
                      </div>
                      <div className="access-desc">{tier.description}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
