'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const isRole = (roles: string[]) => roles.includes(user.role);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/portal/dashboard',
      icon: 'fas fa-chart-line',
      visible: true,
    },
    {
      name: 'Users',
      href: '/portal/users',
      icon: 'fas fa-users-cog',
      visible: isRole(['CEO', 'ADMIN', 'DEVELOPER', 'HEAD']),
    },
    {
      name: 'Teams',
      href: '/portal/teams',
      icon: 'fas fa-sitemap',
      visible: isRole(['CEO', 'ADMIN', 'DEVELOPER', 'HEAD']),
    },
    {
      name: 'Projects',
      href: '/portal/projects',
      icon: 'fas fa-project-diagram',
      visible: true,
    },
    {
      name: 'Reports',
      href: '/portal/reports',
      icon: 'fas fa-file-shield',
      visible: isRole(['CEO', 'ADMIN', 'DEVELOPER', 'HEAD', 'INTERN']),
    },
    {
      name: 'Settings',
      href: '/portal/settings',
      icon: 'fas fa-cog',
      visible: true,
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logoCircle}></div>
        <div className={styles.brandText}>
          <span className={styles.companyName}>Rynex Security</span>
          <span className={styles.subtext}>Security Hub</span>
        </div>
      </div>

      <div className={styles.userCard}>
        <div className={styles.avatar}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user.name}</div>
          <span className={`${styles.roleBadge} ${styles[user.role.toLowerCase()]}`}>
            {user.role}
          </span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                <i className={`${item.icon} ${styles.icon}`} aria-hidden="true"></i>
                <span>{item.name}</span>
              </Link>
            );
          })}
      </nav>

      <div className={styles.footer}>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
}
