"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./careers.module.css";
import Button from "@/components/Button";

const OPPORTUNITIES = [
  "Red Team / VAPT",
  "Blue Team / SOC",
  "Governance, Risk & Compliance",
  "Engineering & Operations",
];

const ACTIONS = [
  { label: "Check open jobs", value: "jobs" },
  { label: "Learn about the application process", value: "process" },
  { label: "Join talent network", value: "contact" },
];

export default function NextSteps() {
  const router = useRouter();
  const [opportunity, setOpportunity] = useState("");
  const [action, setAction] = useState("");

  const handleActionSelect = (val: string) => {
    setAction(val);

    // Automatically route when they pick an action, or just show a button?
    // Let's show the button.
  };

  const getHref = () => {
    if (action === "jobs") return "/careers/jobs";
    if (action === "process") return "/careers#process";
    if (action === "contact") return "/contact";
    return "";
  };

  return (
    <section className={styles.nextStepsSection}>
      <div className={styles.sectionInner}>
        <div className={styles.nextStepsGrid}>
          {/* Left Column */}
          <div className={styles.nextStepsLeft}>
            <h2 className={styles.nextStepsTitle}>Let&apos;s find your next steps</h2>
            <p className={styles.nextStepsText}>
              Further discover our careers page or get a personalized list of jobs based on
              your interests, then filter by location, experience, or skills.
            </p>
            <Link href="/careers/jobs" className={styles.jobArrow}>
              <i className="fas fa-layer-group" aria-hidden="true" style={{ marginRight: "6px" }} />
              Explore all roles <i className="fas fa-arrow-right" aria-hidden="true" style={{ marginLeft: "4px" }} />
            </Link>
          </div>

          {/* Right Column - Interactive Form */}
          <div className={styles.nextStepsRight}>
            <div className={styles.stepBlock}>
              <label htmlFor="ns-opp" className={styles.stepLabel}>Step 1: Select opportunity</label>
              <div className={styles.selectWrapper}>
                <select
                  id="ns-opp"
                  className={styles.nextStepsSelect}
                  value={opportunity}
                  onChange={(e) => setOpportunity(e.target.value)}
                >
                  <option value="" disabled>Select your interest</option>
                  {OPPORTUNITIES.map((opp) => (
                    <option key={opp} value={opp}>{opp}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down" aria-hidden="true" />
              </div>
            </div>

            <div className={styles.stepBlock}>
              <label htmlFor="ns-action" className={styles.stepLabel}>Step 2: Choose an option</label>
              <div className={styles.selectWrapper}>
                <select
                  id="ns-action"
                  className={styles.nextStepsSelect}
                  value={action}
                  onChange={(e) => handleActionSelect(e.target.value)}
                  disabled={!opportunity}
                >
                  <option value="" disabled>Select an action</option>
                  {ACTIONS.map((act) => (
                    <option key={act.value} value={act.value}>{act.label}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down" aria-hidden="true" />
              </div>
            </div>

            {/* CTA Appears when both are selected */}
            <div className={`${styles.nextStepsCTA} ${action ? styles.nextStepsCTAVisible : ""}`}>
              {action && (
                <Button href={getHref()} variant="primary">
                  Continue <i className="arrow-right" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
