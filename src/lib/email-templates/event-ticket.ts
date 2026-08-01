export function buildEventTicketEmail(data: {
  name: string;
  ticketToken: string;
  groupName?: string;
  category?: string;
}) {
  const { name, ticketToken, groupName, category } = data;
  const hasOrg = groupName && groupName.trim() !== "" && groupName.trim() !== "Individual";

  const subject = `Official CTF Event Ticket — Rynex Eclipse 2026 [${ticketToken}]`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rynex Security CTF Event Ticket</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #030712; color: #f3f4f6; margin: 0; padding: 20px; }
        .wrapper { max-width: 680px; margin: 0 auto; }
        .ticket-container { background-color: #000000; border: 2px solid #00d4ff; border-radius: 16px; overflow: hidden; box-shadow: 0 0 30px rgba(0, 212, 255, 0.35); font-family: 'Segoe UI', Helvetica, Arial, sans-serif; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px; text-align: center;">
          Hello <strong>${name}</strong>, your seat for <strong>Rynex Eclipse 2026</strong> has been confirmed! Here is your official ticket.
        </p>

        <!-- GRAPHIC TICKET CONTAINER -->
        <div class="ticket-container">
          <table style="width: 100%; border-collapse: collapse; background-color: #000000;" cellpadding="0" cellspacing="0">
            <tr>
              <!-- MAIN LEFT SECTION -->
              <td style="padding: 24px; vertical-align: top;">
                
                <!-- Header Grid: Date Box & Big Title -->
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <!-- Top Left Date Badge -->
                    <td style="width: 105px; vertical-align: top;">
                      <div style="background-color: #00d4ff; color: #000000; text-align: center; border-radius: 8px 8px 0 0; padding: 8px 4px;">
                        <div style="font-size: 26px; font-weight: 900; line-height: 1; font-family: Impact, Arial, sans-serif;">7</div>
                        <div style="font-size: 16px; font-weight: 900; letter-spacing: 1px; line-height: 1.2;">AUG</div>
                      </div>
                      <div style="background-color: #ffffff; color: #000000; font-size: 11px; font-weight: 900; text-align: center; padding: 4px 2px; text-transform: uppercase; letter-spacing: 1px;">
                        FRIDAY
                      </div>
                      <div style="border: 1.5px solid #00d4ff; color: #ffffff; font-size: 12px; font-weight: 800; text-align: center; padding: 6px 2px; margin-top: 10px; border-radius: 4px; background: rgba(0, 212, 255, 0.05);">
                        10:30 AM
                      </div>
                    </td>

                    <td style="width: 20px;"></td>

                    <!-- Center Event Branding -->
                    <td style="vertical-align: top;">
                      <div style="font-size: 30px; font-weight: 900; color: #ffffff; letter-spacing: 2px; line-height: 0.95; font-family: Impact, Arial, sans-serif;">RYNEX</div>
                      <div style="font-size: 34px; font-weight: 900; color: #00d4ff; letter-spacing: 3px; line-height: 1; font-family: Impact, Arial, sans-serif;">SECURITY</div>
                      <div style="font-size: 42px; font-weight: 900; color: #ffffff; letter-spacing: 4px; line-height: 0.95; font-family: Impact, Arial, sans-serif;">CTF</div>
                      <div style="font-size: 22px; font-weight: 900; color: #00d4ff; letter-spacing: 4px; line-height: 1; margin-top: 2px; font-family: Impact, Arial, sans-serif;">EVENT</div>
                    </td>
                  </tr>
                </table>

                <!-- Divider line -->
                <div style="height: 1px; background: linear-gradient(90deg, rgba(0,212,255,0.6) 0%, rgba(0,212,255,0.1) 100%); margin: 20px 0;"></div>

                <!-- Bottom Details: Competitor, Category/University & Location -->
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <!-- Competitor & Category / Institution -->
                    <td style="vertical-align: top; width: 55%; padding-right: 12px;">
                      <!-- COMPETITOR BADGE & NAME -->
                      <div style="display: inline-block; background-color: #00d4ff; color: #000000; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 3px; letter-spacing: 1px; text-transform: uppercase;">
                        COMPETITOR
                      </div>
                      <div style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 4px 0 14px 0; word-break: break-word;">
                        ${name}
                      </div>

                      <!-- CATEGORY BADGE & VALUE -->
                      <div style="display: inline-block; background-color: #00d4ff; color: #000000; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 3px; letter-spacing: 1px; text-transform: uppercase;">
                        CATEGORY
                      </div>
                      <div style="font-size: 14px; font-weight: 700; color: #cbd5e1; margin: 4px 0 ${hasOrg ? '14px' : '0'} 0;">
                        ${category || "Cyber Security Professional"}
                      </div>

                      <!-- UNIVERSITY / ORGANIZATION BADGE & VALUE (If specified) -->
                      ${
                        hasOrg
                          ? `
                            <div style="display: inline-block; background-color: #00d4ff; color: #000000; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 3px; letter-spacing: 1px; text-transform: uppercase;">
                              UNIVERSITY / INSTITUTION
                            </div>
                            <div style="font-size: 14px; font-weight: 700; color: #00ffaa; margin: 4px 0 0 0;">
                              ${groupName}
                            </div>
                          `
                          : ""
                      }
                    </td>

                    <!-- LOCATION INFO -->
                    <td style="vertical-align: top; width: 45%; border-left: 1px solid rgba(0, 212, 255, 0.25); padding-left: 14px;">
                      <div style="display: inline-block; background-color: #00d4ff; color: #000000; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 3px; letter-spacing: 1px; text-transform: uppercase;">
                        LOCATION
                      </div>
                      <div style="font-size: 13px; color: #e2e8f0; margin-top: 6px; line-height: 1.4; font-weight: 500;">
                        📍 <strong>Khwaja Fareed University of Engineering and Information Technology (KFUEIT)</strong>, Rahim Yar Khan
                      </div>
                    </td>
                  </tr>
                </table>
              </td>

              <!-- RIGHT STUB SECTION -->
              <td style="width: 150px; background-color: #00d4ff; color: #000000; vertical-align: top; padding: 20px 12px; text-align: center; border-left: 2px dashed #000000;">
                <div style="background-color: #000000; color: #00d4ff; font-size: 13px; font-weight: 900; letter-spacing: 2px; padding: 4px; border-radius: 3px; margin-bottom: 18px;">
                  TICKET
                </div>
                <div style="font-size: 14px; font-weight: 900; color: #000000; letter-spacing: 1px; line-height: 1.2; font-family: Impact, Arial, sans-serif;">
                  RYNEX<br>SECURITY
                </div>
                <div style="font-size: 24px; font-weight: 900; color: #000000; margin: 4px 0; font-family: Impact, Arial, sans-serif;">
                  CTF
                </div>
                <div style="font-size: 12px; font-weight: 900; color: #000000; letter-spacing: 1px;">
                  EVENT
                </div>

                <div style="border-top: 2px solid #000000; margin: 18px 0 10px 0;"></div>

                <div style="font-size: 14px; font-weight: 900; color: #000000;">
                  7 AUGUST<br>FRIDAY
                </div>
                <div style="font-size: 12px; font-weight: 800; color: #000000; margin-top: 4px;">
                  10:30 AM
                </div>
              </td>
            </tr>
          </table>
        </div>

        <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 24px;">
          Rynex Security — Detect . Exploit . Secure<br>
          Token: ${ticketToken} | Official Pass
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
    RYNEX SECURITY CTF EVENT — OFFICIAL TICKET
    ==================================================
    Ticket Token: ${ticketToken}
    Name: ${name}
    Category: ${category || "Cyber Security Professional"}
    ${hasOrg ? `University/Institution: ${groupName}\n` : ""}
    Date & Time: 7 AUGUST FRIDAY — 10:30 AM
    Location: Khwaja Fareed University of Engineering and Information Technology (KFUEIT), Rahim Yar Khan

    Thank you for registering for Rynex Eclipse 2026!
    Present this ticket upon arrival at the venue.
  `;

  return { subject, html, text };
}
