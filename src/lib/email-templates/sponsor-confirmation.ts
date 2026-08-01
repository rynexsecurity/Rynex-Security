export function buildSponsorConfirmationEmail(data: {
  companyName: string;
  contactName: string;
  tier: string;
}) {
  const { companyName, contactName, tier } = data;

  const subject = `Rynex Eclipse 2026 — Sponsorship Confirmation (${tier})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rynex Eclipse 2026 Sponsorship Confirmation</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #030712; color: #f3f4f6; margin: 0; padding: 20px; }
        .wrapper { max-width: 650px; margin: 0 auto; background: #0b1120; border: 2px solid #00d4ff; border-radius: 16px; padding: 32px; box-shadow: 0 0 35px rgba(0, 212, 255, 0.25); }
        .title { color: #00d4ff; font-size: 26px; font-weight: bold; text-align: center; }
        .badge { background: #00d4ff; color: #000000; font-weight: 900; padding: 4px 12px; border-radius: 4px; display: inline-block; text-transform: uppercase; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div style="text-align: center; margin-bottom: 24px;">
          <span class="badge">SPONSORSHIP PARTNERSHIP</span>
          <h1 class="title" style="margin-top: 12px;">RYNEX ECLIPSE 2026</h1>
        </div>

        <p>Dear <strong>${contactName}</strong> (${companyName}),</p>
        <p>Thank you for partnering with <strong>Rynex Eclipse 2026</strong> as a <strong>${tier}</strong>.</p>

        <div style="background: #030712; border: 1px solid rgba(0, 212, 255, 0.4); padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="color: #00d4ff; margin-top: 0;">Partnership Details</h3>
          <p style="margin: 6px 0;"><strong>Company / Organization:</strong> ${companyName}</p>
          <p style="margin: 6px 0;"><strong>Selected Tier:</strong> ${tier}</p>
          <p style="margin: 6px 0;"><strong>Event:</strong> Rynex Eclipse 2026 CTF Championship</p>
          <p style="margin: 6px 0;"><strong>Location:</strong> KFUEIT, Rahim Yar Khan, Pakistan</p>
        </div>

        <p>Our sponsorship relations team will reach out to you directly to coordinate banner placements, booth logistics, and marketing assets.</p>

        <div style="text-align: center; color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 20px;">
          Rynex Security — Detect . Exploit . Secure<br>
          Direct Contact: info@rynexsecurity.com | +92 327 287 3812
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    RYNEX ECLIPSE 2026 — SPONSORSHIP CONFIRMATION
    ==================================================
    Organization: ${companyName}
    Contact Person: ${contactName}
    Sponsorship Package: ${tier}
    Event: Rynex Eclipse 2026 CTF Championship
    Location: KFUEIT, Rahim Yar Khan, Pakistan

    Thank you for partnering with Rynex Security!
    Our team will reach out directly to coordinate booth & branding logistics.
  `;

  return { subject, html, text };
}
