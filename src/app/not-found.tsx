"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AnimatedLogo from "@/components/AnimatedLogo";
import styles from "./not-found.module.css";

export default function NotFound() {
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Handle mouse tracking to position the spotlight backdrop
    const handleMouseMove = (e: MouseEvent) => {
      setSpotlightPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isVisible]);

  return (
    <div className={styles.container}>
      {/* Subtle background grid pattern */}
      <div className={styles.gridOverlay} />

      {/* Spotlight glow light that follows the cursor */}
      {isVisible && (
        <div 
          className={styles.spotlight} 
          style={{
            left: `${spotlightPos.x}px`,
            top: `${spotlightPos.y}px`,
          }}
        />
      )}

      <div className={styles.content}>
        {/* Container for standard Rynex Security floating logo animation */}
        <div className={styles.logoWrapper}>
          <AnimatedLogo />
        </div>

        {/* Vercel-style 404 message block */}
        <div className={styles.textSection}>
          <div className={styles.errorRow}>
            <span className={styles.errorCode}>404</span>
            <div className={styles.divider} />
            <span className={styles.errorMessage}>This page could not be found.</span>
          </div>
          <p className={styles.subtitle}>
            The system could not resolve the requested route. Please check the address or return back to safety.
          </p>
        </div>

        <Link href="/" className={styles.homeButton}>
          <i className="fas fa-arrow-left" aria-hidden="true" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
