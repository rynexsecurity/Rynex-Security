import "server-only";

const LOGO_URL = "https://ik.imagekit.io/t4itchmhb/logo.png";
const CONTACT_EMAIL = "info@rynexsecurity.com";

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return value.replace(/[&<>"']/g, (char) => entities[char] || char);
}

export function buildEventTicketEmail(data: {
  name: string;
  ticketToken: string;
  groupName?: string;
  category?: string;
}) {
  const { name, ticketToken, groupName, category } = data;

  const displayCategory =
    groupName && groupName.trim() && groupName.trim().toLowerCase() !== "individual"
      ? groupName.trim()
      : category && category.trim()
      ? category.trim()
      : "Cyber Security Professional";

  const cleanedName = name.trim().slice(0, 100) || "Competitor";
  const safeName = escapeHtml(cleanedName);
  const groupText = escapeHtml(groupName || "Individual");
  const categoryText = escapeHtml(displayCategory);

  const subject = `Your Official Rynex Security CTF Ticket [${ticketToken}]`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#0b0f19; font-family:Arial, Helvetica, sans-serif; color:#ffffff;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Your official event ticket for Rynex Security CTF: ${ticketToken}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0b0f19; padding:32px 12px;">
      <tr>
        <td align="center">

          <!-- Intro Message -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:740px; margin-bottom:20px;">
            <tr>
              <td style="padding:0 8px; color:#cbd5e1; font-size:15px; line-height:1.6;">
                <p style="margin:0 0 8px 0; font-size:18px; color:#ffffff;">Dear <strong>${safeName}</strong>,</p>
                <p style="margin:0 0 16px 0;">Congratulations! Your registration for the <strong>Rynex Security CTF Event</strong> has been confirmed. Below is your official digital event ticket pass.</p>
              </td>
            </tr>
          </table>

          <!-- MAIN TICKET CARD -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:740px; background-color:#000000; border:2px solid #00c2ff; border-radius:18px; overflow:hidden; box-shadow:0 0 40px rgba(0, 194, 255, 0.25);">
            <tr>
              
              <!-- LEFT COLUMN: DATE, TIME, PARTICIPANT INFO -->
              <td width="30%" valign="top" style="padding:20px; background-color:#050a14; border-right:1px solid #1e293b;">
                
                <!-- DATE BADGE -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#00c2ff; border-radius:6px; margin-bottom:14px; text-align:center;">
                  <tr>
                    <td style="padding:8px 4px;">
                      <div style="font-size:24px; font-weight:900; color:#000000; line-height:1; letter-spacing:1px;">7 AUG</div>
                      <div style="font-size:13px; font-weight:800; color:#000000; letter-spacing:1.5px; margin-top:2px;">FRIDAY</div>
                    </td>
                  </tr>
                </table>

                <!-- TIME BADGE -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:2px solid #00c2ff; border-radius:6px; margin-bottom:20px; text-align:center; background-color:#000000;">
                  <tr>
                    <td style="padding:8px 4px;">
                      <span style="font-size:18px; font-weight:900; color:#ffffff;">10:30</span>
                      <span style="font-size:13px; font-weight:900; color:#00c2ff; margin-left:4px;">AM</span>
                    </td>
                  </tr>
                </table>

                <!-- COMPETITOR NAME -->
                <div style="margin-bottom:14px;">
                  <div style="display:inline-block; background-color:#00c2ff; color:#000000; font-size:10px; font-weight:900; padding:2px 8px; border-radius:3px; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">
                    COMPETITOR
                  </div>
                  <div style="font-size:14px; font-weight:700; color:#ffffff; line-height:1.3; word-break:break-word;">
                    ${safeName}
                  </div>
                </div>

                <!-- CATEGORY -->
                <div>
                  <div style="display:inline-block; background-color:#00c2ff; color:#000000; font-size:10px; font-weight:900; padding:2px 8px; border-radius:3px; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">
                    CATEGORY
                  </div>
                  <div style="font-size:13px; font-weight:600; color:#cbd5e1; line-height:1.3; word-break:break-word;">
                    ${categoryText}
                  </div>
                </div>

              </td>

              <!-- CENTER COLUMN: EVENT HEADLINE & LOCATION -->
              <td width="44%" valign="top" style="padding:24px 20px; background-color:#000000;">
                
                <!-- TITLE -->
                <div style="margin-bottom:24px;">
                  <div style="font-size:30px; font-weight:900; color:#ffffff; letter-spacing:2px; line-height:1;">
                    RYNEX
                  </div>
                  <div style="font-size:30px; font-weight:900; color:#00c2ff; letter-spacing:2px; line-height:1; margin-top:2px;">
                    SECURITY
                  </div>
                  <div style="font-size:40px; font-weight:900; color:#ffffff; letter-spacing:4px; line-height:1; margin-top:4px;">
                    CTF
                  </div>
                  <div style="font-size:20px; font-weight:900; color:#00c2ff; letter-spacing:6px; line-height:1; margin-top:4px;">
                    EVENT
                  </div>
                </div>

                <!-- LOCATION -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-left:3px solid #00c2ff; padding-left:10px;">
                  <tr>
                    <td>
                      <div style="display:inline-block; background-color:#00c2ff; color:#000000; font-size:10px; font-weight:900; padding:2px 8px; border-radius:3px; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px;">
                        LOCATION
                      </div>
                      <div style="font-size:12px; font-weight:600; color:#ffffff; line-height:1.4;">
                        📍 Khwaja Fareed University of Engineering and Information Technology (KFUEIT), Rahim Yar Khan
                      </div>
                    </td>
                  </tr>
                </table>

              </td>

              <!-- ACCENT STRIPE & TEAR LINE -->
              <td width="6%" valign="top" align="center" style="background-color:#00c2ff; border-right:3px dashed #ffffff; padding:0;">
                <div style="height:100%; min-height:220px; background:linear-gradient(135deg, #00c2ff 25%, #000000 25%, #000000 50%, #00c2ff 50%, #00c2ff 75%, #000000 75%); background-size:12px 12px;"></div>
              </td>

              <!-- RIGHT STUB COLUMN: TICKET TITLE & TOKEN -->
              <td width="20%" valign="top" style="padding:16px 12px; background-color:#000000; text-align:center;">
                
                <!-- TICKET HEADER BADGE -->
                <div style="background-color:#00c2ff; color:#000000; font-size:12px; font-weight:900; padding:4px 0; border-radius:4px; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:14px;">
                  TICKET
                </div>

                <!-- MINI TITLE -->
                <div style="font-size:11px; font-weight:900; color:#ffffff; letter-spacing:1px; line-height:1.2;">
                  RYNEX
                </div>
                <div style="font-size:11px; font-weight:900; color:#00c2ff; letter-spacing:1px; line-height:1.2;">
                  SECURITY
                </div>
                <div style="font-size:16px; font-weight:900; color:#ffffff; letter-spacing:2px; line-height:1.2; margin:2px 0;">
                  CTF
                </div>
                <div style="font-size:11px; font-weight:900; color:#00c2ff; letter-spacing:2px; line-height:1.2; margin-bottom:12px;">
                  EVENT
                </div>

                <div style="border-top:1px solid #1e293b; margin:8px 0;"></div>

                <!-- MINI DATE & TIME -->
                <div style="font-size:10px; font-weight:900; color:#ffffff; letter-spacing:0.5px; line-height:1.3;">
                  7 AUGUST<br />
                  <span style="color:#00c2ff;">FRIDAY</span><br />
                  10:30 AM
                </div>

                <div style="border-top:1px solid #1e293b; margin:8px 0;"></div>

                <!-- TOKEN CODE -->
                <div style="font-size:9px; font-weight:800; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">
                  TICKET CODE
                </div>
                <div style="font-family:Consolas, Monaco, monospace; font-size:11px; font-weight:900; color:#00ffaa; word-break:break-all; line-height:1.2;">
                  ${ticketToken}
                </div>

              </td>

            </tr>
          </table>

          <!-- OUTRO FOOTER INFO -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:740px; margin-top:24px; text-align:center;">
            <tr>
              <td style="color:#94a3b8; font-size:13px; line-height:1.6;">
                <p style="margin:0 0 6px 0; color:#ffffff; font-weight:bold;">
                  Status: Pre-Registered Competitor (FREE ENTRY)
                </p>
                <p style="margin:0 0 12px 0;">
                  Please keep this digital ticket for entry verification. For questions or event details, contact us at 
                  <a href="mailto:${CONTACT_EMAIL}" style="color:#00c2ff; text-decoration:none;">${CONTACT_EMAIL}</a>
                </p>
                <div style="border-top:1px solid #1e293b; max-width:200px; margin:16px auto;"></div>
                <p style="margin:0; font-size:12px; color:#64748b;">
                  Rynex Security — Detect • Exploit • Secure
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `RYNEX SECURITY CTF EVENT TICKET

Ticket Code: ${ticketToken}
Name: ${cleanedName}
Category: ${category || "Competitor"}
Date: 7 AUGUST (FRIDAY) at 10:30 AM
Location: Khwaja Fareed University of Engineering and Information Technology (KFUEIT), Rahim Yar Khan

Status: Pre-Registered Competitor (FREE ENTRY)

Congratulations! Your registration for Rynex Security CTF Event has been confirmed.
Please keep this ticket code for event entry verification.

Questions: ${CONTACT_EMAIL}
Rynex Security — Detect • Exploit • Secure`;

  return { subject, html, text };
}
