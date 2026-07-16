import type { Metadata } from "next";
import JobsClient from "./JobsClient";
import styles from "../careers.module.css";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Open Positions | Rynex Security Careers",
  description:
    "Search and apply for open cybersecurity positions at Rynex Security. Roles in penetration testing, SOC operations, GRC, cloud security, and more.",
};

export default function JobsPage() {
  return (
    <>
      {/* ── Page Hero ─────────────────────────────────── */}
      <section className={styles.jobsHero}>
        <div className={styles.jobsHeroInner}>
          <p className={styles.sectionEyebrowLight}>
            <Button href="/careers" variant="ghost">
              ← Back to Careers
            </Button>
          </p>
          <h1 className={styles.jobsHeroTitle}>Open Positions</h1>
          <p className={styles.jobsHeroSubtitle}>
            Search across all current openings at Rynex Security. Filter by department,
            work type, or experience level to find the right fit.
          </p>
        </div>
      </section>

      {/* ── Search + Filter + Job List ─────────────────── */}
      <JobsClient />
    </>
  );
}
