"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./test.module.css";

interface LogLine {
  text: string;
  type: "info" | "success" | "warning" | "error";
  time: string;
}

interface Vulnerability {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  description: string;
}

const mockScanLogs: Record<string, string[]> = {
  vulnerability: [
    "Initializing Rynex Vulnerability Scanner v4.1.2...",
    "Configuring network adapters and resolver modules...",
    "Resolving host target domain and auditing DNS records...",
    "Target host IP resolved to 104.21.78.204 (Cloudflare edge proxy)...",
    "Sending initial HTTP probe requests to establish baseline...",
    "Detected Server header: cloudflare (Obfuscated)...",
    "Running SSL/TLS Cipher Suite audit...",
    "Warning: Target supports TLS 1.0/1.1 legacy cipher suites (Weak security).",
    "Initiating SQL injection heuristics scan on 12 public entrypoints...",
    "SQLi Probe: Testing query param 'id' on path '/api/v1/resource'...",
    "Checking endpoint parameters against typical blind SQLi patterns...",
    "Scanning for Cross-Site Scripting (XSS) input reflection points...",
    "Reflection found in search query parameters without proper sanitization.",
    "Auditing HTTP security headers (HSTS, CSP, X-Frame-Options)...",
    "Missing HTTP Header: Content-Security-Policy is not configured.",
    "Missing HTTP Header: Strict-Transport-Security is not enforced.",
    "Vulnerability check completed. Consolidating findings...",
  ],
  ports: [
    "Initializing Rynex Port Scanner...",
    "Preparing SYN packet generator queue...",
    "Scanning top 1000 standard ports...",
    "Port 21 (FTP): CLOSED",
    "Port 22 (SSH): FILTERED (Possible rate-limiting active)",
    "Port 80 (HTTP): OPEN (Redirecting to HTTPS)",
    "Port 443 (HTTPS): OPEN (Certificate valid)",
    "Port 3306 (MySQL): CLOSED",
    "Port 8080 (HTTP-Alt): CLOSED",
    "Scanning complete. 2 open ports detected.",
  ],
  subdomain: [
    "Initializing Subdomain Enumerator...",
    "Loading dictionary (5000 common record names)...",
    "Performing DNS resolver queries...",
    "Found: www.target.com -> CNAME target.cdn.cloudflare.net",
    "Found: api.target.com -> A 104.21.78.205",
    "Found: dev.target.com -> A 192.168.10.42 (Internal leakage detected)",
    "Found: mail.target.com -> MX mx.target.com",
    "Found: staging.target.com -> CNAME staging-target.herokuapp.com (Subdomain takeover vulnerable)",
    "Subdomain scan finished. 5 active records identified.",
  ],
  ssl: [
    "Initializing SSL/TLS Audit Engine...",
    "Connecting to TLS socket on port 443...",
    "Negotiating handshake (Supported protocols: SSLv3 to TLSv1.3)...",
    "Cipher Suite negotiated: TLS_AES_256_GCM_SHA384",
    "Evaluating Certificate Chain validity...",
    "Issuer: Let's Encrypt Authority X3",
    "Expiration date: In 48 days (Within warning threshold)",
    "Auditing renegotiation settings...",
    "Secure renegotiation: Supported",
    "Checking for SSL vulnerabilities (Heartbleed, POODLE, ROBOT)...",
    "Heartbleed check: SECURE",
    "POODLE check: SECURE",
    "BEAST check: SECURE",
    "TLS Audit complete.",
  ],
};

const mockFindings: Record<string, Vulnerability[]> = {
  vulnerability: [
    {
      id: "VULN-001",
      title: "Blind SQL Injection in Parameter 'id'",
      severity: "high",
      description: "Database queries are constructed using unsanitized user inputs, allowing attackers to read internal DB records.",
    },
    {
      id: "VULN-002",
      title: "Missing Content-Security-Policy (CSP) Header",
      severity: "medium",
      description: "CSP header is not set. A robust CSP is required to mitigate XSS (Cross-Site Scripting) and clickjacking attacks.",
    },
    {
      id: "VULN-003",
      title: "TLS 1.1 Support Enabled",
      severity: "low",
      description: "Legacy protocol TLS 1.1 is supported. Secure configurations should restrict connections to TLS 1.2 and TLS 1.3.",
    },
  ],
  ports: [
    {
      id: "PORT-001",
      title: "Insecure Port 80 Open without redirection forced",
      severity: "medium",
      description: "HTTP protocol allows data transmission in plaintext. Redirection to port 443 (HTTPS) must be strictly enforced.",
    },
  ],
  subdomain: [
    {
      id: "SUB-001",
      title: "Internal IP Exposure in DNS Records",
      severity: "high",
      description: "DNS resolution reveals RFC 1918 private network addresses (e.g. 192.168.x.x), exposing internal network topology.",
    },
    {
      id: "SUB-002",
      title: "Dangly CNAME Record / Subdomain Takeover",
      severity: "high",
      description: "CNAME points to an expired/unregistered service name on Heroku, allowing adversaries to claim the staging subdomain.",
    },
  ],
  ssl: [
    {
      id: "SSL-001",
      title: "Short Certificate Lifetime Warning",
      severity: "low",
      description: "SSL Certificate expires in less than 60 days. Auto-renewals should be monitored to prevent downtime.",
    },
  ],
};

export default function TestPage() {
  const [target, setTarget] = useState("https://test-target.rynexsecurity.com");
  const [scanType, setScanType] = useState("vulnerability");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [findings, setFindings] = useState<Vulnerability[]>([]);
  const [scanDone, setScanDone] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleStartScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim() || isScanning) return;

    setIsScanning(true);
    setProgress(0);
    setLogs([]);
    setFindings([]);
    setScanDone(false);

    const scanLines = mockScanLogs[scanType] || [];
    const totalLines = scanLines.length;

    // Simulate logs output and progress increments
    let currentLineIndex = 0;

    const interval = setInterval(() => {
      if (currentLineIndex < totalLines) {
        const time = new Date().toLocaleTimeString();
        const nextLine = scanLines[currentLineIndex];
        
        let type: LogLine["type"] = "info";
        if (nextLine.toLowerCase().includes("warning:")) type = "warning";
        else if (nextLine.toLowerCase().includes("found:") || nextLine.toLowerCase().includes("open")) type = "success";
        else if (nextLine.toLowerCase().includes("vulnerable") || nextLine.toLowerCase().includes("leakage")) type = "error";

        setLogs((prev) => [...prev, { text: nextLine, type, time }]);
        setProgress(Math.min(Math.round(((currentLineIndex + 1) / totalLines) * 100), 99));
        currentLineIndex++;
      } else {
        clearInterval(interval);
        // Scan completed
        setProgress(100);
        setIsScanning(false);
        setScanDone(true);
        setFindings(mockFindings[scanType] || []);
        
        const finishTime = new Date().toLocaleTimeString();
        setLogs((prev) => [
          ...prev,
          { text: "=== SCAN COMPLETE ===", type: "success", time: finishTime },
        ]);
      }
    }, 700);
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <span className={styles.eyebrow}>Cyber Sandbox</span>
        <h1 className={styles.title}>Simulated Pentest Diagnostics</h1>
        <p className={styles.subtitle}>
          Execute automated scanning diagnostics in our virtual cyber-range environment. Use this tool to evaluate target parameters and verify defensive alignments.
        </p>
      </header>

      <div className={styles.dashboardLayout}>
        {/* Control Card */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <i className={`fas fa-sliders-h ${styles.cardIcon}`} aria-hidden="true" />
            Scanner Control Panel
          </h2>

          <form onSubmit={handleStartScan}>
            <div className={styles.formGroup}>
              <label htmlFor="target-input" className={styles.label}>
                Target Host / URL
              </label>
              <input
                id="target-input"
                type="text"
                className={styles.input}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. https://target-host.com"
                disabled={isScanning}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="scan-type-select" className={styles.label}>
                Diagnostic Mode
              </label>
              <select
                id="scan-type-select"
                className={styles.select}
                value={scanType}
                onChange={(e) => setScanType(e.target.value)}
                disabled={isScanning}
              >
                <option value="vulnerability">Full Vulnerability Assessment</option>
                <option value="ports">TCP Port Scan (Top 1000)</option>
                <option value="subdomain">Subdomain Reconnaissance</option>
                <option value="ssl">SSL/TLS Configuration Audit</option>
              </select>
            </div>

            <button
              type="submit"
              className={styles.scanButton}
              disabled={isScanning || !target}
            >
              {isScanning ? (
                <>
                  <i className="fas fa-spinner fa-spin" aria-hidden="true" />
                  Analyzing Target...
                </>
              ) : (
                <>
                  <i className="fas fa-terminal" aria-hidden="true" />
                  Initiate Scan
                </>
              )}
            </button>
          </form>

          {/* Progress bar container */}
          {(isScanning || progress > 0) && (
            <div className={styles.scanProgress}>
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className={styles.progressText}>
                <span>STATUS: {progress === 100 ? "COMPLETED" : "RUNNING"}</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {/* Results Summary */}
          {scanDone && (
            <div className={styles.resultsSection}>
              <h3 className={styles.cardTitle}>
                <i className="fas fa-bug" aria-hidden="true" />
                Vulnerability Report ({findings.length})
              </h3>
              {findings.length === 0 ? (
                <p style={{ color: "var(--support-success)", fontSize: "0.9rem" }}>
                  <i className="fas fa-check-circle" aria-hidden="true" /> No high/medium vulnerabilities found for this diagnostic mode.
                </p>
              ) : (
                <div className={styles.vulnerabilityList}>
                  {findings.map((vuln) => (
                    <div
                      key={vuln.id}
                      className={`${styles.vulnCard} ${
                        vuln.severity === "high"
                          ? styles.vulnHigh
                          : vuln.severity === "medium"
                          ? styles.vulnMedium
                          : styles.vulnLow
                      }`}
                    >
                      <div className={styles.vulnTitle}>
                        <span>{vuln.title}</span>
                        <span
                          className={`${styles.vulnSeverity} ${
                            vuln.severity === "high"
                              ? styles.sevHigh
                              : vuln.severity === "medium"
                              ? styles.sevMedium
                              : styles.sevLow
                          }`}
                        >
                          {vuln.severity}
                        </span>
                      </div>
                      <p className={styles.vulnDesc}>{vuln.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Terminal/Log Window */}
        <section className={styles.terminalContainer}>
          <div className={styles.terminalHeader}>
            <div className={styles.terminalDots}>
              <span className={`${styles.dot} ${styles.dotRed}`} />
              <span className={`${styles.dot} ${styles.dotYellow}`} />
              <span className={`${styles.dot} ${styles.dotGreen}`} />
            </div>
            <div className={styles.terminalTitle}>diagnostics@rynex-shell:~</div>
            <div style={{ width: "38px" }} />
          </div>

          <div className={styles.terminalBody}>
            {logs.length === 0 ? (
              <div className={styles.terminalLine}>
                <span className={styles.terminalPrompt}>rynex-sec$</span> Ready. Propose a target to launch diagnostics...
              </div>
            ) : (
              logs.map((line, idx) => (
                <div
                  key={idx}
                  className={styles.terminalLine}
                  style={{
                    color:
                      line.type === "error"
                        ? "var(--support-error)"
                        : line.type === "warning"
                        ? "#f59e0b"
                        : line.type === "success"
                        ? "var(--ibm-blue-60)"
                        : undefined,
                  }}
                >
                  <span style={{ color: "var(--gray-60)", marginRight: "8px" }}>
                    [{line.time}]
                  </span>
                  {line.text}
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </section>
      </div>
    </div>
  );
}
