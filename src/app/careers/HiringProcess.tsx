"use client";

import { useState } from "react";
import styles from "./careers.module.css";
import { hiringSteps } from "./data";

export default function HiringProcess() {
  const [activeStep, setActiveStep] = useState(0);
  const step = hiringSteps[activeStep];

  return (
    <div>
      {/* Tab Navigation */}
      <div className={styles.processNav} role="tablist" aria-label="Hiring process steps">
        {hiringSteps.map((s, i) => (
          <button
            key={s.number}
            type="button"
            role="tab"
            aria-selected={i === activeStep}
            aria-controls={`process-panel-${i}`}
            id={`process-tab-${i}`}
            className={`${styles.processTab} ${i === activeStep ? styles.processTabActive : ""}`}
            onClick={() => setActiveStep(i)}
          >
            <i className={`fas ${s.icon} ${styles.processTabIcon}`} aria-hidden="true" />
            <span className={styles.processTabNumber}>{s.number}</span>
            <span className={styles.processTabTitle}>{s.shortTitle}</span>
          </button>
        ))}
      </div>

      {/* Content Panel */}
      <div
        key={activeStep}
        className={styles.processContent}
        role="tabpanel"
        id={`process-panel-${activeStep}`}
        aria-labelledby={`process-tab-${activeStep}`}
      >
        <div className={styles.processContentInner}>
          <div>
            <div className={styles.processStepNumber} aria-hidden="true">
              {step.number}
            </div>
            <h3 className={styles.processStepTitle}>{step.title}</h3>
            <p className={styles.processStepDesc}>{step.detail}</p>
          </div>
          <div className={styles.processStepIllustration} aria-hidden="true">
            <i className={`fas ${step.icon}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
