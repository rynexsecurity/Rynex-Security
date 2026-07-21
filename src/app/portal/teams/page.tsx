'use client';

import React, { useState, useEffect } from 'react';
import styles from './teams.module.css';
import { DEPARTMENT_LABELS } from '@/lib/portal/permissions';

interface TeamData {
  id: string;
  name: string;
  department?: string | null;
  head: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    members: number;
    projects: number;
  };
  createdAt: string;
}

interface UserData {
  id: string;
  name: string;
  role: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [department, setDepartment] = useState('TECHNICAL');
  const [headId, setHeadId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const teamsRes = await fetch('/api/teams');
      const teamsData = await teamsRes.json();
      if (!teamsRes.ok) throw new Error(teamsData.error || 'Failed to fetch teams');
      setTeams(teamsData.teams || []);

      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      if (usersRes.ok) {
        setUsers(usersData.users || []);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitLoading(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          department,
          headId: headId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team');

      await fetchData();
      setShowCreateModal(false);
      setTeamName('');
      setDepartment('TECHNICAL');
      setHeadId('');
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const eligibleHeads = users.filter((u) =>
    ['CEO', 'ADMIN', 'DEVELOPER', 'HEAD', 'DIRECTOR'].includes(u.role)
  );

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Department Teams</h1>
          <p className={styles.pageSubtitle}>Organize Red Team, Blue Team, Technical &amp; GRC operations rosters.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className={styles.createBtn}
        >
          <i className="fas fa-folder-plus" aria-hidden="true"></i>
          <span>Create Department Team</span>
        </button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loadingArea}>Retrieving department rosters...</div>
      ) : (
        <div className={styles.grid}>
          {teams.map((team) => {
            const deptKey = team.department || 'TECHNICAL';
            return (
              <div key={team.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.teamName}>{team.name}</h3>
                    <span className={`${styles.departmentBadge} ${styles[deptKey.toLowerCase()]}`}>
                      {DEPARTMENT_LABELS[deptKey] || deptKey}
                    </span>
                  </div>
                  <span className={styles.date}>Since {new Date(team.createdAt).toLocaleDateString()}</span>
                </div>

                <div className={styles.details}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Team Lead:</span>
                    <span className={styles.value}>
                      {team.head ? team.head.name : <span className={styles.unassigned}>Unassigned</span>}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Active Personnel:</span>
                    <span className={styles.value}>{team._count.members}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Assigned Projects:</span>
                    <span className={styles.value}>{team._count.projects}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {teams.length === 0 && (
            <div className={styles.empty}>No department teams found. Create a team to get started.</div>
          )}
        </div>
      )}

      {/* --- CREATE TEAM MODAL --- */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3>Create Department Team</h3>
              <button onClick={() => { setShowCreateModal(false); setSubmitError(''); }} className={styles.closeBtn}>
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
            
            {submitError && <div className={styles.modalError}>{submitError}</div>}

            <form onSubmit={handleCreateTeam} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.modalLabel}>Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className={styles.modalInput}
                  placeholder="e.g. Red Team Alpha, Blue Team SOC, Technical Eng"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.modalLabel}>Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={styles.modalSelect}
                >
                  <option value="RED_TEAM">🔴 Red Team (Offensive)</option>
                  <option value="BLUE_TEAM">🔵 Blue Team (Defensive)</option>
                  <option value="TECHNICAL">🟢 Technical (Engineering)</option>
                  <option value="GRC">🟣 GRC (Compliance)</option>
                  <option value="OPERATIONS">🟡 Operations</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.modalLabel}>Assign Team Head</label>
                <select
                  value={headId}
                  onChange={(e) => setHeadId(e.target.value)}
                  className={styles.modalSelect}
                >
                  <option value="">Leave Unassigned</option>
                  {eligibleHeads.map((h) => (
                    <option key={h.id} value={h.id}>{h.name} [{h.role}]</option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setSubmitError(''); }}
                  className={styles.cancelBtn}
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
