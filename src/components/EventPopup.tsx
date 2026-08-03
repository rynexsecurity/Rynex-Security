'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './EventPopup.module.css';

const KEY = 'rynex-popup:rynex-eclipse-2026:1';
type Action = 'acknowledge' | 'snooze';
export default function EventPopup() {
  const [visible, setVisible] = useState(false); const [ready, setReady] = useState(false); const [submitting, setSubmitting] = useState(false);
  const authenticated = useRef(false);
  useEffect(() => { let alive = true;
    const guestEligible = () => { try { const saved = JSON.parse(localStorage.getItem(KEY) || '{}'); return !saved.acknowledged && (!saved.snoozedUntil || saved.snoozedUntil <= Date.now()); } catch { return true; } };
    const load = async () => { try { const response = await fetch('/api/popup/event', { cache: 'no-store' }); const state = await response.json(); if (!alive) return; authenticated.current = !!state.authenticated; const eligible = state.authenticated ? state.eligible : guestEligible(); setReady(true); if (eligible) setTimeout(() => alive && setVisible(true), 1800); } catch { if (alive) { setReady(true); if (guestEligible()) setTimeout(() => alive && setVisible(true), 1800); } } };
    void load(); const sync = (event: StorageEvent) => { if (event.key === KEY) setVisible(false); }; window.addEventListener('storage', sync); return () => { alive = false; window.removeEventListener('storage', sync); };
  }, []);
  const dismiss = async (action: Action) => { if (submitting) return; setSubmitting(true); setVisible(false); try { if (authenticated.current) await fetch('/api/popup/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) }); else { const value = action === 'acknowledge' ? { acknowledged: true } : { snoozedUntil: Date.now() + 24 * 60 * 60 * 1000 }; localStorage.setItem(KEY, JSON.stringify(value)); window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } } finally { setSubmitting(false); } };
  if (!ready || !visible) return null;
  return <div className={styles.overlay} onClick={() => void dismiss('snooze')} role="dialog" aria-modal="true" aria-label="Upcoming event announcement"><div className={styles.card} onClick={e => e.stopPropagation()}>
    <div className={styles.glowTL} aria-hidden="true" /><div className={styles.glowBR} aria-hidden="true" />
    <button type="button" className={styles.closeBtn} onClick={() => void dismiss('snooze')} disabled={submitting} aria-label="Close popup"><i className="fas fa-times" aria-hidden="true" /></button>
    <div className={styles.badge}><span className={styles.pulseDot} aria-hidden="true" />FLAGSHIP EVENT 2026</div><div className={styles.eventName}>RYNEX ECLIPSE</div><div className={styles.subtitle}>Think Â· Capture Â· Compete</div>
    <div className={styles.statsRow}><div className={styles.stat}><i className="fas fa-location-dot" aria-hidden="true" /><span>Rahim Yar Khan, PK</span></div><div className={styles.statDivider} aria-hidden="true" /><div className={styles.stat}><i className="fas fa-flag" aria-hidden="true" /><span>Jeopardy CTF</span></div><div className={styles.statDivider} aria-hidden="true" /><div className={styles.stat}><i className="fas fa-users" aria-hidden="true" /><span>200+ Competitors</span></div><div className={styles.statDivider} aria-hidden="true" /><div className={styles.stat}><i className="fas fa-ticket" aria-hidden="true" /><span>PKR 500</span></div></div>
    <p className={styles.desc}>Pakistan's premier Capture The Flag competition. Join top students, ethical hackers, SOC analysts, and security researchers competing for cash prizes, trophies, and direct recruitment opportunities with leading cybersecurity firms.</p>
    <div className={styles.tracksGrid}>{[{ icon: 'fa-globe', label: 'Web Exploitation' }, { icon: 'fa-magnifying-glass', label: 'Digital Forensics' }, { icon: 'fa-gears', label: 'Reverse Engineering' }, { icon: 'fa-network-wired', label: 'Network Security' }].map(t => <div key={t.label} className={styles.track}><i className={`fas ${t.icon}`} aria-hidden="true" /><span>{t.label}</span></div>)}</div>
    <div className={styles.ctaRow}><Link href="/events" className={styles.primaryCta} onClick={() => void dismiss('snooze')}><i className="fas fa-flag" aria-hidden="true" />Explore Event &amp; Register</Link><button type="button" className={styles.secondaryCta} onClick={() => void dismiss('acknowledge')} disabled={submitting}>I Understand</button></div>
  </div></div>;
}
