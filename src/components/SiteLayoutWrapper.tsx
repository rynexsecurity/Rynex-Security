"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteLayoutWrapper({
  children,
  isPortalHost,
}: {
  children: React.ReactNode;
  isPortalHost?: boolean;
}) {
  const pathname = usePathname();

  // Hide the public header/footer if the current route is within the portal
  const isPortalPath = pathname?.startsWith("/portal") || pathname === "/login" || pathname === "/change-password";
  const isPortal = isPortalHost || isPortalPath;

  return (
    <>
      {!isPortal && <Header />}
      {children}
      {!isPortal && <Footer />}
    </>
  );
}
