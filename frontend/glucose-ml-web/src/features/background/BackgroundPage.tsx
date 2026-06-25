import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/app-shell/AppShell";
import { HOME_SUMMARY_STATS } from "../../data/home-summary-stats";
import { fetchJson } from "../../utils/fetch-json";
import BackgroundCgmChart from "./BackgroundCgmChart";
import {
  DEFAULT_VISIBLE_GROUP_KEYS,
  toggleVisibleGroup,
  type BackgroundCgmChartData,
  type BackgroundCgmGroupKey,
} from "./background-cgm-chart";
import { selectActiveAnchorHref } from "./background-scroll-navigation";
import "./background-page.css";

const anchorItems = [
  { label: "What is Diabetes", href: "#diabetes" },
  { label: "What is CGM", href: "#cgm" },
  { label: "What CGM data look like", href: "#data" },
  { label: "Common CGM metrics", href: "#glossary" },
  { label: "Why real CGM data matters", href: "#models" },
  { label: "Why dataset diversity matters", href: "#diversity" },
];
const anchorHrefs = new Set(anchorItems.map((item) => item.href));

const primaryMetricTerms = [
  {
    term: "CGM wear time",
    summary:
      "The percentage of time a user actively wore a CGM sensor over a specific period of time. Weartime of 70% or more is recommended to ensure...",
    definition:
      "The percentage of time a user actively wore a CGM sensor over a specific period of time. Weartime of 70% or more is recommended to ensure sufficient glucose data that is a reliable and representative picture of overall glucose trends.",
  },
  {
    term: "Time above range",
    summary:
      "The percentage of glucose recordings that are above the target glucose range over a specific period of time. Time above range commonly refers...",
    definition:
      "The percentage of glucose recordings that are above the target glucose range over a specific period of time. Time above range commonly refers to the percentage of glucose recordings above 180mg/dL in individuals with diabetes.",
  },
  {
    term: "Time in range",
    summary:
      "The percentage of glucose recordings that are within the target glucose range over a specific period of time. The target glucose range for...",
    definition:
      "The percentage of glucose recordings that are within the target glucose range over a specific period of time. The target glucose range for individuals with diabtes is between 70 - 180mg/dL. Greater 70% time in range is considered good glucose management for individuals with diabetes but higher is always better.",
  },
  {
    term: "Time below range",
    summary:
      "The percentage of glucose recordings that are below the target range over a specific period of time. Time below range commonly refers to the...",
    definition:
      "The percentage of glucose recordings that are below the target range over a specific period of time. Time below range commonly refers to the percentage of glucose recordings below 70mg/dL in individuals with diabetes.",
  },
];

const additionalMetricTerms = [
  {
    term: "Glycemic variability",
    definition:
      "How much and how frequently glucose fluctuates between high peaks and low dips. Low glycemic variability is indicative of more stable glucose and representative of better glucose management in individuals with diabetes.",
  },
  {
    term: "Mean glucose",
    definition:
      "The average of glucose recordings over a specific period. Mean glucose from CGM data is highly correlated with hemoglobin A1C values from clinical measurements. Higher mean glucose equates to a higher A1C level and vice versa.",
  },
  {
    term: "Sampling frequency",
    definition:
      "How frequently a CGM device records a glucose reading. Most CGM devices on the market today record one glucose reading every 1 - 15 minutes depending on the manufacturer and model.",
  },
];

const diversityTags = [
  "Diabetes type",
  "Demographics",
  "Geography",
  "Sensor Characteristics",
  "Glucose Data Distribution",
];

const groupFilters = [
  { key: "t1d", label: "Type 1", tone: "t1d", lineMark: ". . . ." },
  { key: "t2d", label: "Type 2", tone: "t2d", lineMark: "- ." },
  { key: "pred", label: "Prediabetes", tone: "pred", lineMark: "- ." },
  { key: "nd", label: "No Diabetes", tone: "nd", lineMark: "- ." },
] satisfies Array<{
  key: BackgroundCgmGroupKey;
  label: string;
  tone: BackgroundCgmGroupKey;
  lineMark: string;
}>;

const getStickyHeaderHeight = () => {
  return (
    document
      .querySelector(".background-anchor-nav-shell")
      ?.getBoundingClientRect().height ?? 0
  );
};

const getAnchorHrefFromHash = () => {
  if (typeof window === "undefined") return null;
  return anchorHrefs.has(window.location.hash) ? window.location.hash : null;
};

const getInitialAnchorHref = () => {
  return getAnchorHrefFromHash() ?? anchorItems[0].href;
};

const scrollToAnchorTarget = (
  href: string,
  behavior: ScrollBehavior = "smooth"
) => {
  const target = document.getElementById(href.slice(1));
  if (!target) return;

  window.scrollTo({
    top: target.offsetTop - getStickyHeaderHeight(),
    behavior,
  });
};

const BackgroundPage = () => {
  const [chartData, setChartData] = useState<BackgroundCgmChartData | null>(
    null
  );
  const [chartLoadFailed, setChartLoadFailed] = useState(false);
  const [visibleGroupKeys, setVisibleGroupKeys] = useState<
    BackgroundCgmGroupKey[]
  >(() => [...DEFAULT_VISIBLE_GROUP_KEYS]);
  const [activeAnchorHref, setActiveAnchorHref] = useState(getInitialAnchorHref);
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const navigationHrefRef = useRef<string | null>(null);
  const scrollSettleTimeoutIdRef = useRef<number | null>(null);

  const handleAnchorClick = (
    event: MouseEvent<HTMLButtonElement>,
    href: string
  ) => {
    event.preventDefault();
    const target = document.getElementById(href.slice(1));
    if (!target) return;

    navigationHrefRef.current = href;
    setActiveAnchorHref(href);
    window.history.pushState(null, "", href);
    scrollToAnchorTarget(href);

    if (scrollSettleTimeoutIdRef.current !== null) {
      window.clearTimeout(scrollSettleTimeoutIdRef.current);
    }
    scrollSettleTimeoutIdRef.current = window.setTimeout(() => {
      scrollSettleTimeoutIdRef.current = null;
      if (navigationHrefRef.current === href) {
        navigationHrefRef.current = null;
      }
    }, 150);
  };

  useEffect(() => {
    const controller = new AbortController();

    fetchJson<BackgroundCgmChartData>(
      "/static_data/background_cgm_chart.json",
      controller.signal
    )
      .then((data) => {
        setChartData(data);
        setChartLoadFailed(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setChartLoadFailed(true);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const syncHashAnchor = () => {
      const href = getAnchorHrefFromHash();
      navigationHrefRef.current = null;

      if (!href) {
        setActiveAnchorHref(anchorItems[0].href);
        return;
      }

      setActiveAnchorHref(href);
      requestAnimationFrame(() => scrollToAnchorTarget(href, "auto"));
    };

    syncHashAnchor();
    window.addEventListener("hashchange", syncHashAnchor);
    window.addEventListener("popstate", syncHashAnchor);

    return () => {
      window.removeEventListener("hashchange", syncHashAnchor);
      window.removeEventListener("popstate", syncHashAnchor);
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number | null = null;

    const syncActiveAnchor = () => {
      animationFrameId = null;
      const sections = anchorItems.flatMap(({ href }) => {
        const section = document.getElementById(href.slice(1));
        return section ? [{ href, offsetTop: section.offsetTop }] : [];
      });
      const href = selectActiveAnchorHref({
        sections,
        scrollY: window.scrollY,
        stickyHeaderHeight: getStickyHeaderHeight(),
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        navigationHref: navigationHrefRef.current,
      });

      if (href) {
        setActiveAnchorHref((currentHref) =>
          currentHref === href ? currentHref : href
        );
      }
    };

    const scheduleActiveAnchorSync = () => {
      if (animationFrameId !== null) return;
      animationFrameId = window.requestAnimationFrame(syncActiveAnchor);
    };

    const handleScroll = () => {
      scheduleActiveAnchorSync();

      const navigationHref = navigationHrefRef.current;
      if (!navigationHref) return;

      if (scrollSettleTimeoutIdRef.current !== null) {
        window.clearTimeout(scrollSettleTimeoutIdRef.current);
      }
      scrollSettleTimeoutIdRef.current = window.setTimeout(() => {
        scrollSettleTimeoutIdRef.current = null;
        if (navigationHrefRef.current !== navigationHref) return;

        navigationHrefRef.current = null;
        scheduleActiveAnchorSync();
      }, 150);
    };

    scheduleActiveAnchorSync();
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    window.addEventListener("resize", scheduleActiveAnchorSync);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scheduleActiveAnchorSync);
      if (scrollSettleTimeoutIdRef.current !== null) {
        window.clearTimeout(scrollSettleTimeoutIdRef.current);
      }
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <AppShell>
      <main className="background-page">
        <section className="background-hero">
          <div className="background-page__inner">
            <p className="background-eyebrow">BACKGROUND</p>
            <h1>Understanding CGM and Glucose Data</h1>
            <p className="background-hero__subtitle">
              This page provides basic background and context needed to understand
              the Glucose-ML project and mission - no prior knowledge is needed.
            </p>
          </div>
        </section>

        <div className="background-anchor-nav-shell">
          <div className="background-page__inner">
            <nav className="background-anchor-nav" aria-label="Background sections">
              {anchorItems.map((item) => {
                const isActive = activeAnchorHref === item.href;

                return (
                  <button
                    key={item.href}
                    type="button"
                    className={`background-anchor-nav__item${
                      isActive ? " background-anchor-nav__item--active" : ""
                    }`}
                    aria-pressed={isActive}
                    onClick={(event) => handleAnchorClick(event, item.href)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <section id="diabetes" className="background-section background-section--teal">
          <div className="background-page__inner">
            <h2>What is Diabetes?</h2>
            <div className="background-copy background-copy--full">
              <p>
                Diabetes is a long-lasting health condition that affects how a
                person’s body turns food into energy. When a person has diabetes
                their blood glucose (or blood sugar) can get too high. Over time,
                consistently high blood glucose can cause serious health problems,
                such as heart disease, vision loss, and kidney disease.
              </p>
              <p>There are several types of diabetes including:</p>
              <ul>
                <li>
                  Type 1 diabetes (T1D): With T1D, the body produces little or no
                  insulin, and glucose levels must be actively managed through
                  external insulin. People with T1D need to take insulin everyday
                  to stay alive.
                </li>
                <li>
                  Type 2 diabetes (T2D): With T2D, the body does not produce enough
                  insulin or does not use insulin properly. T2D is the most common
                  type of diabetes. In many cases, T2D is preventable with lifestyle
                  changes.
                </li>
                <li>
                  Gestational diabetes: This is a type of diabetes that can develop
                  during pregnancy. In most cases, this type of diabetes goes away
                  after the baby is born. However, having gestational diabetes
                  increases the chances of developing type 2 diabetes later in life.
                </li>
                <li>
                  Prediabetes: This is the stage before type 2 diabetes. With
                  prediabetes, the blood glucose levels are higher than normal but
                  not yet high enough to be diagnosed with type 2 diabetes.
                  Prediabetes is preventable and reversible with lifestyle changes.
                </li>
              </ul>
              <a
                className="background-learn-more"
                href="https://www.cdc.gov/diabetes/about/index.html"
                rel="noreferrer"
                target="_blank"
              >
                Learn more
                <img src="/figma-assets/icon-arrow-up-right.png" alt="" />
              </a>
            </div>
          </div>
        </section>

        <section id="cgm" className="background-section background-section--white">
          <div className="background-page__inner background-split">
            <div className="background-copy">
              <h2>What is a Continuous Glucose Monitor (CGM)?</h2>
              <p>
                A CGM is a wearable technology that continuously tracks glucose
                levels throughout the day and night. It measures the glucose level
                from the interstitial fluid just under the skin 24 hours a day while
                the device is being worn.
              </p>
              <p>Unlike traditional finger-prick measurements, CGMs provide:</p>
              <ul>
                <li>
                  Real-time glucose data (every ~1 - 5 minutes), predicted
                  directions, and rate of change
                </li>
                <li>Alerts when glucose levels are too high or too low</li>
                <li>
                  Insights on how lifestyle and other factors affect glucose (e.g.
                  meals and exercise)
                </li>
              </ul>
              <p>
                CGM data is especially valuable for understanding individual
                glucose patterns and variability. CGM data is also extremely useful
                for research and development of technology and interventions for
                diabetes prevention and care.
              </p>
              <a
                className="background-learn-more background-learn-more--split"
                href="https://www.cdc.gov/diabetes/about/index.html"
                rel="noreferrer"
                target="_blank"
              >
                Learn more
                <img src="/figma-assets/icon-arrow-up-right.png" alt="" />
              </a>
            </div>
            <img
              className="background-image background-image--monitor"
              src="/figma-assets/background-cgm-monitor.png"
              alt="A continuous glucose monitor sensor and phone glucose graph"
            />
          </div>
        </section>

        <section id="data" className="background-section background-section--teal background-section--data">
          <div className="background-page__inner">
            <div className="background-split background-split--top">
              <div className="background-copy">
                <h2>What does CGM data look like?</h2>
                <p>
                  CGM data displays as a continuous, wave-like signal that changes
                  over time. Each CGM recording includes a timestamp and the glucose
                  readings often reported in mg/dL or mmol/L.
                </p>
                <p>
                  <strong>Glucose spike</strong>
                  <br />
                  A glucose spike is a sharp and marked rise in the amount of glucose
                  in the bloodstreams, typically occurring after eating as the body
                  absorbs and digests food and drinks. When glucose becomes too
                  concentrated in the blood with levels rising above the target or
                  healthy range, this is referred to as a glucose spike.
                </p>
              </div>
              <img
                className="background-image background-image--spike"
                src="/figma-assets/background-glucose-spike.png"
                alt="Diagram showing a glucose spike after a meal"
              />
            </div>

            <div className="background-chart-intro">
              <p>
                Take a look at real-world CGM data from individuals with different
                types of diabetes.
              </p>
              <div className="background-filter-row">
                <span>Select groups to show:</span>
                <div
                  className="background-filter-legend"
                  role="group"
                  aria-label="CGM chart groups"
                >
                  {groupFilters.map((filter) => {
                    const isSelected = visibleGroupKeys.includes(filter.key);

                    return (
                      <button
                        key={filter.key}
                        type="button"
                        className={`background-filter-pill background-filter-pill--${
                          filter.tone
                        }${
                          isSelected
                            ? ""
                            : " background-filter-pill--unselected"
                        }`}
                        aria-pressed={isSelected}
                        onClick={() =>
                          setVisibleGroupKeys((current) =>
                            toggleVisibleGroup(current, filter.key)
                          )
                        }
                      >
                        <span className="background-filter-pill__line" aria-hidden="true">
                          {filter.lineMark}
                        </span>
                        <span className="background-filter-pill__label">
                          {filter.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="background-timeseries">
              {chartData ? (
                <BackgroundCgmChart
                  data={chartData}
                  visibleGroupKeys={visibleGroupKeys}
                />
              ) : (
                <p className="background-timeseries__status" role="status">
                  {chartLoadFailed
                    ? "CGM chart data is currently unavailable."
                    : "Loading CGM chart..."}
                </p>
              )}
            </div>
          </div>
        </section>

        <section id="glossary" className="background-section background-section--white">
          <div className="background-page__inner">
            <div className="background-glossary-heading">
              <h2>What are common CGM Metrics?</h2>
              <button
                type="button"
                className="background-glossary-toggle"
                aria-expanded={showAllMetrics}
                aria-controls="background-metric-cards"
                onClick={() => setShowAllMetrics((current) => !current)}
              >
                {showAllMetrics ? "See less" : "See more"}
                <span
                  className={`background-glossary-toggle__icon${
                    showAllMetrics
                      ? " background-glossary-toggle__icon--expanded"
                      : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
            <div id="background-metric-cards" className="background-glossary-grid">
              {primaryMetricTerms.map((term) => (
                <article className="background-glossary-card" key={term.term}>
                  <h3>{term.term}</h3>
                  <p>{showAllMetrics ? term.definition : term.summary}</p>
                </article>
              ))}
              {showAllMetrics
                ? additionalMetricTerms.map((term) => (
                    <article className="background-glossary-card" key={term.term}>
                      <h3>{term.term}</h3>
                      <p>{term.definition}</p>
                    </article>
                  ))
                : null}
            </div>
          </div>
        </section>

        <section id="models" className="background-section background-section--teal background-section--models">
          <div className="background-page__inner">
            <h2>Why real CGM data matters for research?</h2>
            <p>
              Real CGM data is transforming research because it provides realistic
              datasets for understanding glucose trends and developing
              next-generation solutions for personalized healthcare. Glucose
              dynamics are highly individual and context dependent, thus
              one-size-fits-all solutions are not effective.
            </p>
            <p>
              Real CGM data provides high temporal density (thousands of glucose
              readings per person). As a result, real CGM data is critical to enable
              development of algorithmic models for glucose forecasting, automatic
              insulin delivery, anomaly detection, risk prediction, personalized
              interventions, and more.
            </p>
          </div>
        </section>

        <section id="diversity" className="background-section background-section--white background-section--diversity">
          <div className="background-page__inner">
            <h2>Why dataset diversity is important?</h2>
            <p>
              Models trained on a small or homogeneous dataset inherits its biases.
              Today, many research publications using dataset(s) with limited
              diversity (e.g. one device type, one age group, one racial/ethnic
              group, one clinical setting, etc.). To enable development of models
              that generalize, it is important to leverage multiple datasets that
              vary across many relevant axes.
            </p>
            <div className="background-diversity-tags">
              {diversityTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="background-cta">
          <div className="background-page__inner background-cta__inner">
            <h2>Ready to explore real CGM datasets?</h2>
            <dl className="background-stat-row">
              {HOME_SUMMARY_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>
            <Link to="/" className="background-cta__button">
              Explore datasets
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
};

export default BackgroundPage;
