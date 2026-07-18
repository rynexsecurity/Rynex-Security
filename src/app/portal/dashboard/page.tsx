'use client';

import React, { useState, useEffect } from 'react';
import styles from './dashboard.module.css';

interface UserSession {
  name: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [stats, setStats] = useState({
    projectsCount: 0,
    activeTasks: 0,
    pendingReports: 0,
    usersCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch session details from cookies/headers on client side or mock it from a JWT
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/users'); // Handled by API middleware to check session
        if (res.ok) {
          // Parse session information from a custom API or decode the login response
          // For prototyping dashboard content, we can fetch session info or decode cookies
        }
      } catch (e) {
        console.error(e);
      }
    };

    // Standard local fetch to get session info
    const getSession = async () => {
      try {
        // Fetch current session info
        const res = await fetch('/api/users');
        if (res.ok) {
          // Set session placeholder for UI demonstration based on our seeded admin
          setSession({
            name: 'CEO Admin',
            email: 'ceo@rynexsecurity.com',
            role: 'CEO',
          });
          setStats({
            projectsCount: 3,
            activeTasks: 8,
            pendingReports: 2,
            usersCount: 12,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading operations database...</div>;
  }

  if (!session) {
    return <div className={styles.loading}>Loading operations database...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.welcomeBanner}>
        <div>
          <h1 className={styles.welcomeTitle}>Welcome back, {session.name}</h1>
          <p className={styles.welcomeSubtitle}>
            Role: <span className={styles.roleBadge}>{session.role}</span> | Operations status: ACTIVE
          </p>
        </div>
        <div className={styles.timeBadge}>
          <i className="far fa-clock" aria-hidden="true"></i> {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* --- STATISTICS WIDGETS --- */}
      {['CEO', 'ADMIN', 'DEVELOPER'].includes(session.role) && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: '#0089ab', backgroundColor: '#e0faff' }}>
              <i className="fas fa-project-diagram" aria-hidden="true"></i>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Active Projects</span>
              <span className={styles.statValue}>{stats.projectsCount}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: '#d97706', backgroundColor: '#fef3c7' }}>
              <i className="fas fa-tasks" aria-hidden="true"></i>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Pending Tasks</span>
              <span className={styles.statValue}>{stats.activeTasks}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: '#dc2626', backgroundColor: '#fee2e2' }}>
              <i className="fas fa-file-shield" aria-hidden="true"></i>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Unreviewed Reports</span>
              <span className={styles.statValue}>{stats.pendingReports}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: '#16a34a', backgroundColor: '#dcfce7' }}>
              <i className="fas fa-users" aria-hidden="true"></i>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Team Accounts</span>
              <span className={styles.statValue}>{stats.usersCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* --- RECENT OPERATIONS FEED --- */}
      <div className={styles.contentGrid}>
        <div className={styles.feedCard}>
          <h3 className={styles.cardTitle}>Recent Operations Activities</h3>
          <div className={styles.feedList}>
            <div className={styles.feedItem}>
              <span className={styles.feedDot} style={{ backgroundColor: '#16a34a' }}></span>
              <div className={styles.feedDetails}>
                <p className={styles.feedText}>
                  <strong>VAPT Report</strong> submitted for project <em>Rynex Redesign</em>
                </p>
                <span className={styles.feedTime}>2 hours ago • by Intern Alex</span>
              </div>
            </div>

            <div className={styles.feedItem}>
              <span className={styles.feedDot} style={{ backgroundColor: '#0089ab' }}></span>
              <div className={styles.feedDetails}>
                <p className={styles.feedText}>
                  New user account created: <strong>Developer John</strong>
                </p>
                <span className={styles.feedTime}>5 hours ago • by CEO Admin</span>
              </div>
            </div>

            <div className={styles.feedItem}>
              <span className={styles.feedDot} style={{ backgroundColor: '#d97706' }}></span>
              <div className={styles.feedDetails}>
                <p className={styles.feedText}>
                  Project contract status updated to <em>IN_PROGRESS</em>: <strong>Client Corp SOC Audit</strong>
                </p>
                <span className={styles.feedTime}>Yesterday • by Admin Sarah</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.cardTitle}>Quick Links & Controls</h3>
          <div className={styles.quickLinks}>
            {['CEO', 'ADMIN', 'DEVELOPER'].includes(session.role) && (
              <a href="/portal/users" className={styles.linkButton}>
                <i className="fas fa-user-plus" aria-hidden="true"></i>
                <span>Add Intern / Client</span>
              </a>
            )}
            <a href="/portal/projects" className={styles.linkButton}>
              <i className="fas fa-folder-open" aria-hidden="true"></i>
              <span>View Projects</span>
            </a>
            {session.role !== 'CLIENT' && (
              <a href="/portal/reports" className={styles.linkButton}>
                <i className="fas fa-file-upload" aria-hidden="true"></i>
                <span>Upload Report</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
