import { Link } from "react-router-dom";
import AppShell from "../../components/app-shell/AppShell";
import "./about-page.css";

const FEEDBACK_FORM_URL = "https://forms.gle/MeYeXDQZKTGz9AbAA";
const DATASET_FORM_URL = "https://forms.gle/ni7nZpD8NnLVAh5R6";

const howItWorksItems = [
  {
    title: "Explore & Discover",
    description:
      "Explore a curated collection of high-quality continuous glucose monitoring dataset to support AI/ML research.",
    icon: "/figma-assets/about-discover.svg",
  },
  {
    title: "Visualize & Compare",
    description:
      "Visualize CGM datasets across standardized metrics and compare datasets side by side to assess fit for your task.",
    icon: "/figma-assets/about-compare.svg",
  },
  {
    title: "Access & Build",
    description:
      "Download public CGM datasets directly or request access and use our helper scripts to build and evaluate your solution faster.",
    icon: "/figma-assets/about-access.svg",
  },
];

const missionItems = [
  "Bridge the data gap that imposes barriers for novice and established data science, machine learning, and AI practitioners seeking to contribute to health-relevant research.",
  "Provide a central hub for exploring, visualizing, and comparing real-world CGM datasets to support AI/ML research for diabetes prevention and care.",
  "Facilitate dataset transparency and enable joint use of disparate high-quality datasets to develop robust, reproducible, and generalizable algorithms that support health equitably.",
];

const publications = [
  {
    id: "arxiv-2507-14077",
    title:
      "Glucose-ML: A collection of longitudinal diabetes datasets for development of robust AI solutions",
    url: "https://arxiv.org/abs/2507.14077",
  },
];

const contributors = [
  {
    name: "Temi Prioleau",
    role: "Project Lead",
    image: "/contributors/temi-prioleau.jpg",
  },
  {
    name: "Ryan Pontius",
    role: "Research Data Engineer",
    image: "/contributors/ryan-pontius.jpg",
  },
  {
    name: "Pam Pitakanonda",
    role: "UI/UX Designer",
    image: "/contributors/pam-pitakanonda.jpg",
  },
  {
    name: "Leo Ding",
    role: "Frontend Developer",
    image: "/contributors/leo-ding.jpg",
  },
  {
    name: "Diego Guzman Gonzalez",
    role: "Qualitative Researcher",
    image: "/contributors/diego-guzman-gonzalez.png",
  },
  {
    name: "Wai Yan Chan",
    role: "Research Intern",
    image: "/contributors/wai-yan-chan.jpg",
  },
  {
    name: "Zimo Li",
    role: "Research Intern",
    image: "/contributors/zimo-li.jpg",
  },
];

const AboutPage = () => {
  return (
    <AppShell>
      <main className="about-page">
        <section className="about-hero" aria-labelledby="about-title">
          <div className="about-container about-hero__content">
            <div className="about-hero__copy">
              <p className="about-eyebrow">ABOUT THE GLUCOSE ML PROJECT</p>
              <div className="about-hero__message">
                <h1 id="about-title">
                  Accelerating data-driven research for diabetes
                </h1>
                <p className="about-hero__description">
                  Glucose-ML is an evolving collection of publicly available
                  continuous glucose datasets curated, standardized, and
                  maintained to accelerate data-centric research and
                  development.
                </p>
              </div>
            </div>
            <Link className="about-primary-action" to="/">
              Explore datasets
            </Link>
          </div>
        </section>

        <section className="about-mission" aria-labelledby="about-mission-title">
          <div className="about-container about-mission__content">
            <h2 id="about-mission-title">Our mission</h2>
            <div className="about-mission__copy">
              {missionItems.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="about-how" aria-labelledby="about-how-title">
          <div className="about-container">
            <h2 id="about-how-title">How it works</h2>
            <div className="about-how__grid">
              {howItWorksItems.map((item) => (
                <article className="about-info-card" key={item.title}>
                  <img src={item.icon} alt="" />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="about-how__summary">
              We bring CGM datasets from research labs into one standardized,
              searchable database. Download directly, request access, and use
              built-in helper scripts to start working with data right away.
              (More info on standardization we do?)
            </p>
          </div>
        </section>

        <section className="about-lab" aria-labelledby="about-lab-title">
          <div className="about-container">
            <div className="about-lab__intro">
              <div className="about-lab__heading">
                <h2 id="about-lab-title">Who we are</h2>
                <a
                  className="about-inline-link about-lab__link"
                  href="https://ah-lab.t-prioleau.com/"
                  rel="noreferrer"
                  target="_blank"
                >
                  Learn more
                  <img src="/figma-assets/about-arrow-up-right.svg" alt="" />
                </a>
              </div>
              <p>
                The Glucose-ML project is developed and maintained by the
                Augmented Health Lab under the leadership of Professor
                {" "}
                <a
                  className="about-text-link"
                  href="https://www.t-prioleau.com/"
                  rel="noreferrer"
                  target="_blank"
                >
                  Temi Prioleau
                </a>
                . The project is made possible by the internal and external
                contributors across the interdisciplinary fields of computer
                science, health data science, psychology, and medicine.
              </p>
            </div>

            <div className="about-contributors">
              <h3>Current Contributors</h3>
              <div className="about-contributors__grid">
                {contributors.map((contributor) => (
                  <article className="about-contributor" key={contributor.name}>
                    <img
                      className="about-contributor__portrait"
                      src={contributor.image}
                      alt={`${contributor.name} portrait`}
                      loading="lazy"
                      decoding="async"
                      width={156}
                      height={156}
                    />
                    <div className="about-contributor__details">
                      <p>{contributor.name}</p>
                      <span>{contributor.role}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="about-past-contributors">
              <h3>Past Contributors</h3>
              <p>Kultum Lhabaik (Frontend Developer)</p>
            </div>

            <div className="about-publications">
              <h3>Publications</h3>
              <div className="about-publications__list">
                {publications.map((publication) => (
                  <div className="about-publication" key={publication.id}>
                    <span>{publication.title}</span>
                    <a
                      href={publication.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View
                      <img
                        src="/figma-assets/about-arrow-up-right.svg"
                        alt=""
                      />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="about-contact"
          aria-labelledby="about-contact-title"
        >
          <div className="about-container">
            <h2 id="about-contact-title">We’d love to hear from you</h2>
            <div className="about-contact__grid">
              <article className="about-contact-card">
                <img
                  className="about-contact-card__icon"
                  src="/figma-assets/about-feedback.svg"
                  alt=""
                />
                <div className="about-contact-card__body">
                  <div>
                    <h3>
                      Questions, comments,
                      <br /> or feedback?
                    </h3>
                    <p>Help us improve the platform.</p>
                  </div>
                  <a
                    className="about-card-link"
                    href={FEEDBACK_FORM_URL}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Share feedback
                    <img src="/figma-assets/about-arrow-right.svg" alt="" />
                  </a>
                </div>
              </article>

              <article className="about-contact-card">
                <img
                  className="about-contact-card__icon"
                  src="/figma-assets/about-submit.svg"
                  alt=""
                />
                <div className="about-contact-card__body">
                  <div>
                    <h3>Want to contribute a dataset?</h3>
                    <p>Recommend or submit a dataset.</p>
                  </div>
                  <a
                    className="about-card-link"
                    href={DATASET_FORM_URL}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Share dataset
                    <img src="/figma-assets/about-arrow-right.svg" alt="" />
                  </a>
                </div>
              </article>

              <article className="about-contact-card">
                <img
                  className="about-contact-card__icon"
                  src="/figma-assets/about-email.svg"
                  alt=""
                />
                <div className="about-contact-card__body">
                  <div>
                    <h3>Reach us directly</h3>
                    <p>
                      We&apos;re happy to connect for collaborations or
                      questions.
                    </p>
                  </div>
                  <a
                    className="about-email-link"
                    href="mailto:ah-lab@emory.edu"
                  >
                    <img src="/figma-assets/about-email.svg" alt="" />
                    ah-lab@emory.edu
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
};

export default AboutPage;
