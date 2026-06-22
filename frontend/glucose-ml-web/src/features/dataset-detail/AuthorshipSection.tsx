import type { PublicationReference } from "../../types/dataset";

type Props = {
  references?: PublicationReference[];
};

const NOT_REPORTED = "Not reported";

export default function AuthorshipSection({ references = [] }: Props) {
  return (
    <section className="dataset-detail-page__authorship glm-card">
      <h2 className="glm-section-title">Authorship</h2>
      <div className="dataset-detail-page__reference-body">
        <p className="dataset-detail-page__reference-label">
          Publication references
        </p>
        {references.length > 0 ? (
          <ul className="dataset-detail-page__reference-list">
            {references.map((reference, index) => (
              <li
                className="dataset-detail-page__reference-item"
                key={`${reference.citation}:${reference.url ?? ""}:${index}`}
              >
                <div className="dataset-detail-page__reference-copy">
                  <span>{reference.citation}</span>
                  {reference.url ? (
                    <>
                      {" "}
                      <a
                        href={reference.url}
                        aria-label={`${reference.url} (opens in a new tab)`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {reference.url}
                      </a>
                    </>
                  ) : null}
                </div>
                {reference.url ? (
                  <a
                    className="dataset-detail-page__reference-view"
                    href={reference.url}
                    aria-label={`View publication reference (opens in a new tab)`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>View</span>
                    <img src="/figma-assets/icon-arrow-up-right.png" alt="" />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="dataset-detail-page__reference-empty">
            {NOT_REPORTED}
          </p>
        )}
      </div>
    </section>
  );
}
