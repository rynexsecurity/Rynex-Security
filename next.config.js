/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "Content-Security-Policy-Report-Only",
    value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https://ik.imagekit.io; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; connect-src 'self' https://vitals.vercel-insights.com;",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

if (process.env.ENABLE_HSTS === "true") {
  securityHeaders.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
}

module.exports = {
  poweredByHeader: false,
  allowedDevOrigins: ["169.254.211.225", "localhost"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "ik.imagekit.io" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
