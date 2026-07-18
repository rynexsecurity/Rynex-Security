import { MailtrapClient } from "mailtrap";

const client = new MailtrapClient({
  token: process.env.MAILTRAP_API_KEY!,
});

const FROM_EMAIL = process.env.MAILTRAP_FROM_EMAIL ?? "no-reply@rynexsecurity.com";
const FROM_NAME = "Rynex Security Portal";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await client.send({
      from: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to }],
      subject,
      html,
    });
  } catch (error) {
    console.error("[Portal Mailer] Failed to send email:", error);
  }
}

// ─── Email Templates ─────────────────────────────────────────────────────────

function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Rynex Security Portal</title>
</head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1A1F36;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color:#00BFA6;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">RYNEX SECURITY</span>
                    <div style="color:#ffffff;font-size:18px;font-weight:600;margin-top:4px;">Internal Portal</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F8F9FA;padding:20px 32px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#718096;font-size:12px;">This is an automated message from the Rynex Security Internal Portal. Do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  role: string;
  email: string;
  tempPassword: string;
  portalUrl: string;
}) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#2D3748;font-size:22px;font-weight:600;">Welcome to the Portal, ${opts.name}!</h2>
    <p style="color:#718096;margin:0 0 24px;">Your Rynex Security Portal account has been created. Here are your login credentials:</p>

    <div style="background:#F8F9FA;border:1px solid #E2E8F0;border-radius:6px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;"><span style="color:#718096;font-size:13px;">Role</span></td>
          <td style="padding:6px 0;text-align:right;"><strong style="color:#2D3748;">${opts.role}</strong></td>
        </tr>
        <tr>
          <td style="padding:6px 0;"><span style="color:#718096;font-size:13px;">Email</span></td>
          <td style="padding:6px 0;text-align:right;"><strong style="color:#2D3748;">${opts.email}</strong></td>
        </tr>
        <tr>
          <td style="padding:6px 0;"><span style="color:#718096;font-size:13px;">Temporary Password</span></td>
          <td style="padding:6px 0;text-align:right;"><strong style="color:#00BFA6;font-family:monospace;">${opts.tempPassword}</strong></td>
        </tr>
      </table>
    </div>

    <p style="color:#EF4444;font-size:13px;margin:0 0 24px;">⚠️ You will be required to change your password on first login.</p>

    <a href="${opts.portalUrl}" style="display:inline-block;background:#00BFA6;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Access Portal →</a>
  `);

  await sendEmail({
    to: opts.to,
    subject: "Your Rynex Security Portal Access",
    html,
  });
}

export async function sendNewMessageEmail(opts: {
  to: string;
  recipientName: string;
  senderName: string;
  projectTitle: string;
  messagePreview: string;
  threadUrl: string;
}) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#2D3748;font-size:22px;font-weight:600;">New Message</h2>
    <p style="color:#718096;margin:0 0 24px;">You have a new message from <strong>${opts.senderName}</strong> regarding <strong>${opts.projectTitle}</strong>.</p>

    <div style="background:#F8F9FA;border-left:4px solid #00BFA6;padding:16px 20px;border-radius:0 6px 6px 0;margin-bottom:24px;">
      <p style="margin:0;color:#2D3748;font-style:italic;">"${opts.messagePreview}"</p>
    </div>

    <a href="${opts.threadUrl}" style="display:inline-block;background:#00BFA6;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View Message →</a>
  `);

  await sendEmail({
    to: opts.to,
    subject: `New message from ${opts.senderName} — Rynex Portal`,
    html,
  });
}

export async function sendReportStatusEmail(opts: {
  to: string;
  authorName: string;
  reportTitle: string;
  status: "APPROVED" | "REJECTED";
  reviewNote?: string;
  reportUrl: string;
}) {
  const isApproved = opts.status === "APPROVED";
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#2D3748;font-size:22px;font-weight:600;">Report ${isApproved ? "Approved ✅" : "Rejected ❌"}</h2>
    <p style="color:#718096;margin:0 0 24px;">Your report <strong>${opts.reportTitle}</strong> has been <strong style="color:${isApproved ? "#22C55E" : "#EF4444"}">${opts.status.toLowerCase()}</strong>.</p>

    ${opts.reviewNote ? `
    <div style="background:#F8F9FA;border:1px solid #E2E8F0;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#718096;text-transform:uppercase;letter-spacing:1px;">Reviewer Note</p>
      <p style="margin:0;color:#2D3748;">${opts.reviewNote}</p>
    </div>` : ""}

    <a href="${opts.reportUrl}" style="display:inline-block;background:#1A1F36;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View Report →</a>
  `);

  await sendEmail({
    to: opts.to,
    subject: `Report ${isApproved ? "approved" : "rejected"}: ${opts.reportTitle} — Rynex Portal`,
    html,
  });
}

export async function sendReportSubmittedEmail(opts: {
  to: string[];
  submitterName: string;
  reportTitle: string;
  reportType: string;
  projectTitle: string;
  reportUrl: string;
}) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#2D3748;font-size:22px;font-weight:600;">New Report Submitted</h2>
    <p style="color:#718096;margin:0 0 24px;"><strong>${opts.submitterName}</strong> submitted a new ${opts.reportType} report for <strong>${opts.projectTitle}</strong>.</p>

    <div style="background:#F8F9FA;border:1px solid #E2E8F0;border-radius:6px;padding:20px;margin-bottom:24px;">
      <p style="margin:0;font-weight:600;color:#2D3748;">${opts.reportTitle}</p>
    </div>

    <a href="${opts.reportUrl}" style="display:inline-block;background:#00BFA6;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Review Report →</a>
  `);

  for (const to of opts.to) {
    await sendEmail({
      to,
      subject: `New ${opts.reportType} report submitted — ${opts.projectTitle}`,
      html,
    });
  }
}

export async function sendTaskAssignedEmail(opts: {
  to: string;
  assigneeName: string;
  taskTitle: string;
  projectTitle: string;
  priority: string;
  dueDate?: string;
  portalUrl: string;
}) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#2D3748;font-size:22px;font-weight:600;">Task Assigned</h2>
    <p style="color:#718096;margin:0 0 24px;">A new task has been assigned to you on <strong>${opts.projectTitle}</strong>.</p>

    <div style="background:#F8F9FA;border:1px solid #E2E8F0;border-radius:6px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;"><span style="color:#718096;font-size:13px;">Task</span></td>
          <td style="padding:6px 0;text-align:right;"><strong style="color:#2D3748;">${opts.taskTitle}</strong></td>
        </tr>
        <tr>
          <td style="padding:6px 0;"><span style="color:#718096;font-size:13px;">Priority</span></td>
          <td style="padding:6px 0;text-align:right;"><strong style="color:#2D3748;">${opts.priority}</strong></td>
        </tr>
        ${opts.dueDate ? `
        <tr>
          <td style="padding:6px 0;"><span style="color:#718096;font-size:13px;">Due Date</span></td>
          <td style="padding:6px 0;text-align:right;"><strong style="color:#2D3748;">${opts.dueDate}</strong></td>
        </tr>` : ""}
      </table>
    </div>

    <a href="${opts.portalUrl}" style="display:inline-block;background:#00BFA6;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View Task →</a>
  `);

  await sendEmail({
    to: opts.to,
    subject: `New task assigned: ${opts.taskTitle}`,
    html,
  });
}
