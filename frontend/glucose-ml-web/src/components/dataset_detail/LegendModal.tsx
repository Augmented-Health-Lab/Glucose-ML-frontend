// src/components/dataset_detail/LegendModal.tsx
import { useEffect } from "react";
import "./LegendModal.css";
import { RoundIcon } from "../DatasetCard";

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
          ×
        </button>

        <div className="legend-modal-content">
          <h2 id="legend-title" className="legend-title">
            Dataset Legend &amp; Background
          </h2>

          <div className="legend-columns">
            <div className="legend-col">
              <section className="legend-block">
                <div className="legend-block-title">Glucose value ranges</div>
                <div className="legend-block-subtitle">
                  The total range of values in which...
                </div>

                <ul className="legend-swatch-list">
                  <li>
                    <span className="swatch swatch-vhigh" aria-hidden="true" />
                    <span>Very high glucose (100+ mg/dL)</span>
                  </li>
                  <li>
                    <span className="swatch swatch-high" aria-hidden="true" />
                    <span>High glucose (80-100 mg/dL)</span>
                  </li>
                  <li>
                    <span className="swatch swatch-mod" aria-hidden="true" />
                    <span>Moderate glucose (60-80 mg/dL)</span>
                  </li>
                  <li>
                    <span className="swatch swatch-low" aria-hidden="true" />
                    <span>Low glucose (40-60 mg/dL)</span>
                  </li>
                  <li>
                    <span className="swatch swatch-vlow" aria-hidden="true" />
                    <span>Very low glucose (&lt;40 mg/dL)</span>
                  </li>
                </ul>
              </section>

              <div className="legend-divider" />

              <section className="legend-block">
                <div className="legend-block-title">Population</div>
                <div className="legend-block-subtitle">
                  Diabetes groups in a study as determined by their HbA1c lab
                  measurement.
                </div>

                <div className="population-list">
                  <div className="population-item">
                    <RoundIcon type="T1D" />
                    <div className="pop-text">
                      <div className="pop-name">Type I diabetes</div>
                      <div className="pop-desc">
                        Individuals with inability to produce insulin, causing
                        high blood sugar (glucose) levels
                      </div>
                    </div>
                  </div>

                  <div className="population-item">
                    <RoundIcon type="T2D" />
                    <div className="pop-text">
                      <div className="pop-name">Type II diabetes</div>
                      <div className="pop-desc">Individuals with...</div>
                    </div>
                  </div>

                  <div className="population-item">
                    <RoundIcon type="PreD" />
                    <div className="pop-text">
                      <div className="pop-name">Prediabetes</div>
                      <div className="pop-desc">Individuals with...</div>
                    </div>
                  </div>

                  <div className="population-item">
                    <RoundIcon type="ND" />
                    <div className="pop-text">
                      <div className="pop-name">No diabetes</div>
                      <div className="pop-desc">Individuals with...</div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="legend-col">
              <section className="legend-block">
                <div className="legend-block-title">Data collection sources</div>

                <div className="source-list">
                  <div className="source-item">
                    <span className="source-icon">c</span>
                    <div className="source-text">
                      <div className="source-title">
                        Continuous Glucose Monitoring
                      </div>
                      <div className="source-desc">Glucose.</div>
                    </div>
                  </div>

                  <div className="source-item">
                    <span className="source-icon">I</span>
                    <div className="source-text">
                      <div className="source-title">Insulin Delivery</div>
                      <div className="source-desc">
                        Insulin does Carbohydrate input.
                      </div>
                    </div>
                  </div>

                  <div className="source-item">
                    <span className="source-icon">W</span>
                    <div className="source-text">
                      <div className="source-title">Wearable Tracker</div>
                      <div className="source-desc">
                        Activity / physiological data (e.g. step count,
                        accelerometry, hear rate, life sleep metrics, skin
                        temperature, galvanic skin response, ECG, respiration).
                      </div>
                    </div>
                  </div>

                  <div className="source-item">
                    <span className="source-icon">M</span>
                    <div className="source-text">
                      <div className="source-title">Manual Logs</div>
                      <div className="source-desc">
                        User logs (e.g. meal, exercise, medication, life events, etc.).
                      </div>
                    </div>
                  </div>

                  <div className="source-item">
                    <span className="source-icon">Q</span>
                    <div className="source-text">
                      <div className="source-title">Questionnaire</div>
                      <div className="source-desc">
                        Self-disclosed data (e.g. age, sex, diabetes duration,
                        ethnicity, general health).
                      </div>
                    </div>
                  </div>

                  <div className="source-item">
                    <span className="source-icon">C</span>
                    <div className="source-text">
                      <div className="source-title">Clinical Measurement</div>
                      <div className="source-desc">
                        Lab / vital signs / imaging(e.g. oral glucose test, hemoglobin A1C, 
                        cholesterol, triglycerides, cardiac ECG, retinal imaging, etc.).
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
