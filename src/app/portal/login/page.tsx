'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [loggedUser, setLoggedUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      setLoggedUser(data.user);
      setShowSuccessPopup(true);

      setTimeout(() => {
        router.push('/portal/dashboard');
        router.refresh();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* SUCCESS LOGIN POPUP WITH RYNEX LOGO */}
      {showSuccessPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupCard}>
            <div className={styles.popupLogoContainer}>
              <div className={styles.logoPulseRing}></div>
              <Image
                src="/images/logo-transparent.png"
                alt="Rynex Security"
                width={80}
                height={80}
                className={styles.popupLogoImg}
                priority
              />
            </div>
            <div className={styles.accessGrantedBadge}>[ ACCESS GRANTED ]</div>
            <h2 className={styles.popupTitle}>AUTHENTICATION SUCCESSFUL</h2>
            
            {loggedUser && (
              <div className={styles.userInfoBox}>
                <div className={styles.userName}>{loggedUser.name}</div>
                <div className={styles.userRoleBadge}>{loggedUser.role} ACCESS</div>
                <div className={styles.userEmail}>{loggedUser.email}</div>
              </div>
            )}

            <div className={styles.loadingProgressContainer}>
              <div className={styles.loadingProgressBar}></div>
            </div>
            <div className={styles.popupStatusText}>
              INITIALIZING ENCRYPTED SEC-OPS TERMINAL...
            </div>
          </div>
        </div>
      )}

      <div className={styles.loginCard}>
        <div className={styles.terminalHeader}>
          <div className={styles.terminalDots}>
            <button className={styles.dotRed} title="Close"></button>
            <button className={styles.dotYellow} title="Minimize"></button>
            <button className={styles.dotGreen} title="Zoom"></button>
          </div>
          <span className={styles.terminalTitle}>rynex@sec-ops: ~ /bin/auth</span>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.logoArea}>
            <Image
              src="/images/logo-transparent.png"
              alt="Rynex Security"
              width={44}
              height={44}
              className={styles.logoImg}
            />
            <span className={styles.logoText}>Rynex Security Hub</span>
          </div>

          <div className={styles.bootSequence}>
            <div><span className={styles.bootOk}>[OK]</span> Initializing Rynex Security Kernel v4.19.0...</div>
            <div><span className={styles.bootOk}>[OK]</span> Mounting encrypted database partitions...</div>
            <div><span className={styles.bootOk}>[OK]</span> Enforcing Zero-Trust Access Protocol...</div>
            <div><span className={styles.bootHighlight}>[SYS]</span> Authentic credentials required.</div>
          </div>

          {error && <div className={styles.errorBox}>[ERROR] {error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="user@rynexsecurity.com"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••••••"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Authenticating Session...' : 'Authenticate'}
            </button>
          </form>

          <div className={styles.footer}>
            RESTRICTED ACCESS • IP ADDRESSES ARE LOGGED
          </div>
        </div>
      </div>
    </div>
  );
}
