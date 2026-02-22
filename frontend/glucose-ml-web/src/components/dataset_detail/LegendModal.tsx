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
                <div className="legend-block-title">Continuous glucose data ranges</div>
                <div className="legend-block-subtitle">
                  Clinical targets for continuous glucose monitoring data
                </div>

                <ul className="legend-swatch-list">
                  <li>
                    <span className="swatch swatch-vlow" aria-hidden="true" />
                    <span>Very low glucose &lt; 54 mg/dL</span>
                  </li>
                  <li>
                    <span className="swatch swatch-low" aria-hidden="true" />
                    <span>Low glucose [54-69) mg/dL</span>
                  </li>
                  <li>
                    <span className="swatch swatch-target" aria-hidden="true" />
                    <span>Target glucose [70-180) mg/dL</span>
                  </li>
                  <li>
                    <span className="swatch swatch-high" aria-hidden="true" />
                    <span>High glucose [180-250) mg/dL</span>
                  </li>
                  <li>
                    <span className="swatch swatch-vhigh" aria-hidden="true" />
                    <span>Very high glucose ≥ 250 mg/dL</span>
                  </li>
                </ul>
              </section>

              <div className="legend-divider" />

              <section className="legend-block">
                <div className="legend-block-title">Population</div>
                <div className="legend-block-subtitle">
                  Population groups included in Glucose-ML
                </div>

                <div className="population-list">
                  <div className="population-item">
                    <RoundIcon type="T1D" />
                    <div className="pop-text">
                      <div className="pop-name">Type 1 diabetes</div>
                      <div className="pop-desc">
                        Dataset includes participants with type 1 Diabetes.
                      </div>
                    </div>
                  </div>

                  <div className="population-item">
                    <RoundIcon type="T2D" />
                    <div className="pop-text">
                      <div className="pop-name">Type 2 diabetes</div>
                      <div className="pop-desc">Dataset includes participants with type 2 Diabetes.</div>
                    </div>
                  </div>

                  <div className="population-item">
                    <RoundIcon type="PreD" />
                    <div className="pop-text">
                      <div className="pop-name">Pre-Diabetes</div>
                      <div className="pop-desc">Dataset includes participants with prediabetes.</div>
                    </div>
                  </div>

                  <div className="population-item">
                    <RoundIcon type="ND" />
                    <div className="pop-text">
                      <div className="pop-name">No Diabetes</div>
                      <div className="pop-desc">Dataset includes participants without diabetes.</div>
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
                    <span className="source-icon">G</span>
                    <div className="source-text">
                      <div className="source-title">
                        Glucose Monitoring via a CGM
                      </div>
                      <div className="source-desc">CGMs are wearable devices that measure real-time glucose readings through a minimally-invasive sensor in the interstitial fluid</div>
                    </div>
                  </div>

                  <div className="source-item">
                    <span className="source-icon">I</span>
                    <div className="source-text">
                      <div className="source-title">Insulin Delivery System</div>
                      <div className="source-desc">
                        Insulin delivery systems include insulin pumps or devices used for multiple daily injections of insulin
                      </div>
                    </div>
                  </div>

                  <div className="source-item">
                    <span className="source-icon">W</span>
                    <div className="source-text">
                      <div className="source-title">Wearable Tracker</div>
                      <div className="source-desc">
                        Wearable trackers include physiological and activity trackers for continuous sensing of factors such as steps, accelerometry, heart rate, sleep, skin temperature, galvanic skin response, respiration, and more.

                      </div>
                    </div>
                  </div>

                  <div className="source-item">
                    <span className="source-icon">M</span>
                    <div className="source-text">
                      <div className="source-title">Manual Logs</div>
                      <div className="source-desc">
                        User logs through mobile applications or other means for tracking factors such as meals, exercise, medication use, life events, and more. 
                      </div>
                    </div>
                  </div>

                  <div className="source-item">
                    <span className="source-icon">Q</span>
                    <div className="source-text">
                      <div className="source-title">Questionnaire</div>
                      <div className="source-desc">
                        Questionnaire refers to data collected via surveys or interviews about self-disclosed information such as age, sex, race/ethnicity, general health reporting, and more.
                      </div>
                    </div>
                  </div>

                  <div className="source-item">
                    <span className="source-icon">C</span>
                    <div className="source-text">
                      <div className="source-title">Clinical Measurements</div>
                      <div className="source-desc">
                        Clinical measurements refers to any data collections from labs, measurement of vital signs, imaging, electronic health records and more. Examples include oral glucose test, glycated hemoglobin (HbA1C), cholesterol, cardiac EGC, retinal imaging, and more. 
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
