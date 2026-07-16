"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import styles from "../careers.module.css";
import { jobs, type Job } from "../data";
import Button from "@/components/Button";

const DEPARTMENTS = ["All Departments", "Red Team", "Blue Team", "GRC", "Engineering", "Operations"] as const;
const TYPES = ["All Types", "Remote", "Onsite", "Hybrid"] as const;
const EXPERIENCES = ["All Levels", "Junior", "Mid-Level", "Senior"] as const;

export default function JobsClient() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All Departments");
  const [type, setType] = useState("All Types");
  const [experience, setExperience] = useState("All Levels");

  const filtered = useMemo(() => {
    return jobs.filter((job: Job) => {
      if (!job.isOpen) return false;
      
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.department.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        job.tags.some((t) => t.toLowerCase().includes(q));

      const matchesDept = department === "All Departments" || job.department === department;
      const matchesType = type === "All Types" || job.type === type;
      const matchesExp = experience === "All Levels" || job.experience === experience;

      return matchesQuery && matchesDept && matchesType && matchesExp;
    });
  }, [query, department, type, experience]);

  return (
    <>
      {/* ── Search & Filter Bar ─────────────────────── */}
      <div className={styles.searchBar}>
        <div className={styles.searchBarInner}>
          <div className={styles.searchInputWrap}>
            <i className="fas fa-search" aria-hidden="true" />
            <input
              id="job-search"
              type="search"
              className={styles.searchInput}
              placeholder="Search by role, keyword, or skill…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search jobs"
            />
          </div>

          <select
            id="filter-department"
            className={styles.filterSelect}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Filter by department"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            id="filter-type"
            className={styles.filterSelect}
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Filter by work type"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            id="filter-experience"
            className={styles.filterSelect}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            aria-label="Filter by experience level"
          >
            {EXPERIENCES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          <span className={styles.resultsCount} aria-live="polite">
            {filtered.length} position{filtered.length !== 1 ? "s" : ""} found
          </span>
        </div>
      </div>

      {/* ── Jobs List ───────────────────────────────── */}
      <section className={styles.jobsSection}>
        <div className={styles.jobsListInner}>
          {filtered.length > 0 ? (
            <div className={styles.jobsList} role="list">
              {filtered.map((job) => (
                <article key={job.id} className={styles.jobCard} role="listitem">
                  <div className={styles.jobCardLeft}>
                    <div className={styles.jobCardMeta}>
                      <span className={styles.jobTag}>{job.department}</span>
                      <span className={styles.jobTagType}>{job.type}</span>
                      <span className={styles.jobTagType}>{job.experience}</span>
                    </div>
                    <h2 className={styles.jobCardTitle}>{job.title}</h2>
                    <p className={styles.jobLocation}>
                      <i className="fas fa-location-dot" aria-hidden="true" />
                      {job.location}
                    </p>
                    <p className={styles.jobCardDesc}>{job.description}</p>
                    <div className={styles.jobCardTags}>
                      {job.tags.map((tag) => (
                        <span key={tag} className={styles.skillTag}>{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.jobCardRight}>
                    <Link
                      href="/contact"
                      className={styles.jobArrow}
                      aria-label={`Apply for ${job.title}`}
                    >
                      Apply <i className="fas fa-arrow-right" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.noResults}>
              <div className={styles.noResultsIcon}>
                <i className="fas fa-search" aria-hidden="true" />
              </div>
              <h2 className={styles.noResultsTitle}>No positions found</h2>
              <p className={styles.noResultsText}>
                Try adjusting your search terms or clearing the filters.
              </p>
            </div>
          )}

          {/* CTA at bottom of jobs list */}
          <div style={{ textAlign: "center", paddingTop: "var(--sp-06)" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--gray-60)", marginBottom: "var(--sp-05)" }}>
              Don&apos;t see a perfect match? We&apos;re always interested in great talent.
            </p>
            <Button href="/contact">Get in touch</Button>
          </div>
        </div>
      </section>
    </>
  );
}
