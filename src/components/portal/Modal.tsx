"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: "default" | "lg";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  size = "default",
  children,
  footer,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="portal-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-modal-title"
    >
      <div
        ref={modalRef}
        className={`portal-modal ${size === "lg" ? "portal-modal-lg" : ""}`}
      >
        <div className="portal-modal-header">
          <h2 id="portal-modal-title" className="portal-modal-title">
            {title}
          </h2>
          <button
            className="portal-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <i className="fa fa-xmark" />
          </button>
        </div>

        <div className="portal-modal-body">{children}</div>

        {footer && (
          <div className="portal-modal-footer">{footer}</div>
        )}
      </div>
    </div>
  );
}
