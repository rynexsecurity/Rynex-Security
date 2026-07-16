import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { services } from "@/lib/site-data";
import styles from "../services.module.css";

type ServicePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/**
 * Generates one static route for every service slug.
 */
export function generateStaticParams() {
  return services.map((service) => ({
    slug: service.slug,
  }));
}

/**
 * Generates metadata only.
 *
 * Do not put JSX, overview rendering, or highlights rendering
 * inside this function.
 */
export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;

  const service = services.find(
    (item) => item.slug === slug,
  );

  if (!service) {
    return {
      title: "Service Not Found | Rynex Security",
      description:
        "The requested Rynex Security service could not be found.",
    };
  }

  return {
    title: `${service.title} | Rynex Security`,
    description: service.description,
  };
}

/**
 * Renders the individual service page.
 */
export default async function ServiceDetailPage({
  params,
}: ServicePageProps) {
  const { slug } = await params;

  const service = services.find(
    (item) => item.slug === slug,
  );

  if (!service) {
    notFound();
  }

  /*
   * These variables must be declared inside this component,
   * after the service has been found.
   */
  const overview =
    service.overview?.trim() ||
    service.description;

  const highlights =
    service.highlights ?? [];

  return (
    <>
      <section className={styles.detailHero}>
        <div className={styles.detailHeroInner}>
          <Link
            href="/services"
            className={styles.backLink}
          >
            <i
              className="fas fa-arrow-left"
              aria-hidden="true"
            />

            All services
          </Link>

          <i
            className={`fas ${service.icon} ${styles.detailIcon}`}
            aria-hidden="true"
          />

          <h1 className={styles.detailTitle}>
            {service.title}
          </h1>

          <p className={styles.detailLead}>
            {service.description}
          </p>
        </div>
      </section>

      <section className={styles.detailSection}>
        <div className={styles.detailContent}>
          <p className={styles.sectionEyebrow}>
            Rynex Security Service
          </p>

          <h2 className={styles.detailSectionTitle}>
            {service.title}
          </h2>

          <p className={styles.detailText}>
            {overview}
          </p>

          {highlights.length > 0 && (
            <div className={styles.detailHighlights}>
              {highlights.map((highlight) => (
                <article
                  key={highlight.title}
                  className={styles.highlightCard}
                >
                  <i
                    className={`fas ${highlight.icon}`}
                    aria-hidden="true"
                  />

                  <h3>{highlight.title}</h3>

                  <p>{highlight.description}</p>
                </article>
              ))}
            </div>
          )}

          <div className={styles.detailActions}>
            <Link
              href={`/contact?service=${encodeURIComponent(
                service.slug,
              )}`}
              className={styles.primaryAction}
            >
              Request a consultation

              <i
                className="fas fa-arrow-right"
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/services"
              className={styles.secondaryAction}
            >
              Back to all services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}