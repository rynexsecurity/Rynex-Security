"use client";

import { useState } from "react";

interface PortalHeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  notificationCount?: number;
}

export default function PortalHeader({
  title,
  subtitle,
  onMenuToggle,
  notificationCount = 0,
}: PortalHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="portal-header">
      {/* Mobile menu toggle */}
      <button
        id="portal-sidebar-toggle"
        className="sidebar-toggle"
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
      >
        <i className="fa fa-bars" />
      </button>

      {/* Title */}
      <div className="portal-header-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="portal-header-actions">
        {/* Notifications */}
        <button
          id="portal-notifications-btn"
          className="header-icon-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <i className="fa fa-bell" />
          {notificationCount > 0 && <span className="header-notif-dot" />}
        </button>

        {/* Help */}
        <button
          id="portal-help-btn"
          className="header-icon-btn"
          aria-label="Help"
          title="Help"
        >
          <i className="fa fa-circle-question" />
        </button>
      </div>
    </header>
  );
}
