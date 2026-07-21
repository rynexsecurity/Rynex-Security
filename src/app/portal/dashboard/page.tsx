'use client';

import React, { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import TerminalTaskModal, { TerminalTask } from '@/components/portal/TerminalTaskModal';

interface DashboardStats {
  totalProjects: number;
  activeTasks: number;
  totalReports: number;
  totalUsers: number;
  recentTasks: any[];
  recentReports: any[];
  systemAlerts: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeTasks: 0,
    totalReports: 0,
    totalUsers: 0,
    recentTasks: [],
    recentReports: [],
    systemAlerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TerminalTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const statsRes = await fetch('/api/portal/dashboard/stats');
        if (statsRes.ok) {
          const data = await statsRes.json();
          if (data.stats) {
            setStats(data.stats);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleTaskClick = (task: any) => {
    setSelectedTask({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      project: task.project,
      assignedTo: task.assignedTo,
      createdAt: task.createdAt,
    });
    setIsModalOpen(true);
  };

  const handleStatusUpdate = async (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    setStats((prev) => ({
      ...prev,
      recentTasks: prev.recentTasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ),
    }));
  };

  if (loading) {
    return <div className={styles.loading}>Loading operations telemetry...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.welcomeBanner}>
        <div>
          <h1 className={styles.welcomeTitle}>Security Operations Center</h1>
          <p className={styles.welcomeSubtitle}>
            System Overview &amp; Real-Time Database Metrics
          </p>
        </div>
        <div className={styles.timeBadge}>
          <i className="far fa-clock" aria-hidden="true"></i>{' '}
          {new Date().toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* --- STATISTICS WIDGETS --- */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#00E5FF', background: 'rgba(0, 229, 255, 0.1)' }}>
            <i className="fas fa-folder-open" aria-hidden="true"></i>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Active Projects</span>
            <span className={styles.statValue}>{stats.totalProjects}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#FF9100', background: 'rgba(255, 145, 0, 0.1)' }}>
            <i className="fas fa-list-check" aria-hidden="true"></i>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Active Tasks</span>
            <span className={styles.statValue}>{stats.activeTasks}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#00FF99', background: 'rgba(0, 255, 153, 0.1)' }}>
            <i className="fas fa-file-shield" aria-hidden="true"></i>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>VAPT &amp; SOC Reports</span>
            <span className={styles.statValue}>{stats.totalReports}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#B388FF', background: 'rgba(179, 136, 255, 0.1)' }}>
            <i className="fas fa-users" aria-hidden="true"></i>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Active Personnel</span>
            <span className={styles.statValue}>{stats.totalUsers}</span>
          </div>
        </div>
      </div>

      {/* --- RECENT OPERATIONS FEED --- */}
      <div className={styles.contentGrid}>
        <div className={styles.feedCard}>
          <h3 className={styles.cardTitle}>Recent Operations Tasks</h3>
          
          <div className={styles.feedList}>
            {stats.recentTasks && stats.recentTasks.length > 0 ? (
              stats.recentTasks.map((task) => (
                <div
                  key={task.id}
                  className={styles.feedItem}
                  onClick={() => handleTaskClick(task)}
                >
                  <span
                    className={styles.feedDot}
                    style={{
                      backgroundColor:
                        task.status === 'DONE'
                          ? '#00FF99'
                          : task.status === 'IN_PROGRESS'
                          ? '#00E5FF'
                          : '#FF9100',
                    }}
                  ></span>
                  <div className={styles.feedDetails}>
                    <p className={styles.feedText}>
                      <strong>{task.title}</strong> — <em>{task.project?.title || 'System'}</em>
                    </p>
                    <span className={styles.feedTime}>
                      Status: [{task.status}] • Assigned to: {task.assignedTo?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748B', fontSize: '13px' }}>
                No active tasks found in database. Create tasks from the Tasks tab.
              </p>
            )}
          </div>
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.cardTitle}>Quick Actions</h3>
          <div className={styles.quickLinks}>
            <a href="/portal/projects" className={styles.linkButton}>
              <i className="fas fa-folder-open" aria-hidden="true"></i>
              <span>View Projects</span>
            </a>
            <a href="/portal/tasks" className={styles.linkButton}>
              <i className="fas fa-list-check" aria-hidden="true"></i>
              <span>Task Board</span>
            </a>
            <a href="/portal/reports" className={styles.linkButton}>
              <i className="fas fa-file-upload" aria-hidden="true"></i>
              <span>Upload Report</span>
            </a>
            <a href="/portal/users" className={styles.linkButton}>
              <i className="fas fa-user-gear" aria-hidden="true"></i>
              <span>Personnel List</span>
            </a>
          </div>
        </div>

        {/* System Alerts Feed */}
        {stats.systemAlerts && stats.systemAlerts.length > 0 && (
          <div className={styles.feedCard}>
            <h3 className={styles.cardTitle}>System Alerts &amp; Audit Log</h3>
            
            <div className={styles.feedList}>
              {stats.systemAlerts.map((alert) => (
                <div key={alert.id} className={styles.feedItem}>
                  <span
                    className={styles.feedDot}
                    style={{ backgroundColor: '#B388FF' }}
                  ></span>
                  <div className={styles.feedDetails}>
                    <p className={styles.feedText}>
                      <strong>{alert.user?.name || 'System'}:</strong> {alert.details || alert.action}
                    </p>
                    <span className={styles.feedTime}>
                      {new Date(alert.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Terminal CLI Modal */}
      <TerminalTaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
