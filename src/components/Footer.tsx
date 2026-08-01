"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";
import { contactInfo } from "@/lib/site-data";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Left Side: Only Logo & Headline */}
        <div className={styles.leftSection}>
          <div className={styles.brand}>
            <Image
              src="/images/logo-transparent.png"
              alt="Rynex Security Logo"
              width={32}
              height={32}
              className="logoAnimated"
            />
            <span className={styles.brandTitle}>Rynex Security</span>
          </div>
          <h2 className={styles.headline}>
            Detect, Exploit, and Secure with the Best in the Industry.
          </h2>
          <p className={styles.tagline}>
            Leading the way in practical cybersecurity training and professional security services.
          </p>
        </div>

        {/* Right Side: Quick Links (2 columns), Contact Info, Social Info */}
        <div className={styles.rightSection}>
          {/* Quick Links with 2 columns */}
          <div className={styles.colGroup}>
            <h4 className={styles.colTitle}>Quick Links</h4>
            <div className={styles.quickLinksColumns}>
              <ul className={styles.linksList}>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/services">Our Services</Link></li>
                <li><Link href="/events">Events &amp; CTF</Link></li>
              </ul>
              <ul className={styles.linksList}>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/careers">Careers</Link></li>
                <li><Link href="/internship">Internship</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
                <li><Link href="/policies">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div className={styles.colGroup}>
            <h4 className={styles.colTitle}>Contact Info</h4>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <i className="fas fa-envelope" aria-hidden="true" />
                <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
              </div>
              <div className={styles.contactItem}>
                <i className="fas fa-phone" aria-hidden="true" />
                <a href={`tel:+92${contactInfo.phone}`}>{contactInfo.phoneDisplay}</a>
              </div>
            </div>
          </div>

          {/* Social Info */}
          <div className={styles.colGroup}>
            <h4 className={styles.colTitle}>Social Info</h4>
            <div className={styles.socialList}>
              <a
                href={contactInfo.discordFooter}
                aria-label="Discord"
                target="_blank"
                rel="noreferrer"
                className={styles.socialCard}
              >
                <i className="fab fa-discord" aria-hidden="true" />
                <span>Discord</span>
              </a>
              <a
                href={contactInfo.linkedin}
                aria-label="LinkedIn"
                target="_blank"
                rel="noreferrer"
                className={styles.socialCard}
              >
                <i className="fab fa-linkedin-in" aria-hidden="true" />
                <span>LinkedIn</span>
              </a>
              <a
                href={contactInfo.instagram}
                aria-label="Instagram"
                target="_blank"
                rel="noreferrer"
                className={styles.socialCard}
              >
                <i className="fab fa-instagram" aria-hidden="true" />
                <span>Instagram</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomContainer}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} Rynex Security. All Rights Reserved. | Designed for Excellence.
          </p>
          <div className={styles.bottomPolicy}>
            <Link href="/policies" className={styles.policyLink}>
              Privacy Policy &amp; Governance
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
