import "server-only";

import { MailtrapClient } from "mailtrap";

import {
  buildContactConfirmationEmail as buildContactTemplate,
} from "./email-templates/contact-confirmation";

import {
  buildInternshipConfirmationEmail as buildInternshipTemplate,
} from "./email-templates/internship-confirmation";

import { buildEventTicketEmail } from "./email-templates/event-ticket";
import { buildSponsorConfirmationEmail } from "./email-templates/sponsor-confirmation";

const NOTIFY_TO =
  process.env.CONTACT_NOTIFY_EMAIL ??
  "info@rynexsecurity.com";

const FROM_EMAIL =
  process.env.MAILTRAP_FROM_EMAIL ??
  "no-reply@rynexsecurity.com";

const FROM_NAME = "Rynex Security";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

import nodemailer from "nodemailer";

async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendArgs) {
  // 1. If SMTP credentials are set in .env.local, use direct SMTP via Nodemailer
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = parseInt(process.env.SMTP_PORT || "587", 10);
      const secure = process.env.SMTP_SECURE === "true" || port === 465;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"${FROM_NAME}" <${process.env.SMTP_FROM || FROM_EMAIL}>`,
        to,
        subject,
        html,
        text,
        replyTo: replyTo || NOTIFY_TO,
        headers: {
          "X-Priority": "1 (Highest)",
          "X-MSMail-Priority": "High",
          "Importance": "High",
        },
      });

      console.log(`[mailer] SMTP email successfully sent to ${to}:`, info.messageId);
      return {
        skipped: false,
        success: true,
        res: info,
      };
    } catch (smtpErr: any) {
      console.error(`[mailer] SMTP email send to ${to} failed:`, smtpErr?.message || smtpErr);
    }
  }

  // 2. Fallback to Mailtrap Client API
  const token = process.env.MAILTRAP_API_KEY;

  if (!token) {
    console.warn(
      "[mailer] Neither SMTP nor MAILTRAP_API_KEY set — skipping email send.",
      {
        to,
        subject,
      },
    );

    return {
      skipped: true,
    };
  }

  const client = new MailtrapClient({
    token,
  });

  try {
    const res = await client.send({
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      html,
      ...(text ? { text } : {}),
      ...(replyTo
        ? {
            reply_to: {
              email: replyTo,
            },
          }
        : {}),
    });
    console.log(`[mailer] Mailtrap API email sent to ${to}:`, JSON.stringify(res));
    return {
      skipped: false,
      success: true,
      res,
    };
  } catch (err: any) {
    console.error(`[mailer] Mailtrap email send to ${to} failed with FROM_EMAIL=${FROM_EMAIL}:`, err?.message || err);
    return {
      skipped: false,
      success: false,
      error: err?.message || err,
    };
  }
}

/**
 * Sends an internal notification to the Rynex team.
 */
export async function sendTeamNotification(
  subject: string,
  html: string,
  replyTo?: string,
) {
  return sendEmail({
    to: NOTIFY_TO,
    subject,
    html,
    replyTo,
  });
}

/**
 * Retained in case other code still uses the older generic function.
 */
export async function sendConfirmationEmail(
  to: string,
  subject: string,
  html: string,
) {
  return sendEmail({
    to,
    subject,
    html,
    replyTo: NOTIFY_TO,
  });
}

/**
 * Sends the branded contact confirmation email.
 */
export async function sendContactConfirmationEmail(
  to: string,
  name: string,
) {
  const template = buildContactTemplate(name);

  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: NOTIFY_TO,
  });
}

/**
 * Sends the branded internship confirmation email.
 */
export async function sendInternshipConfirmationEmail(
  to: string,
  fullName: string,
  track: string,
) {
  // The current template only requires the applicant name.
  // The route still passes track so it can be added to the template later.
  void track;

  const template = buildInternshipTemplate(fullName);

  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: NOTIFY_TO,
  });
}

/**
 * Sends the branded event ticket confirmation email.
 */
export async function sendEventRegistrationEmail(data: {
  to: string;
  name: string;
  ticketToken: string;
  groupName?: string;
  category?: string;
}) {
  const template = buildEventTicketEmail({
    name: data.name,
    ticketToken: data.ticketToken,
    groupName: data.groupName,
    category: data.category,
  });

  // 1. Send the graphic ticket to the candidate
  const candidateResult = await sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: NOTIFY_TO,
  });

  // 2. Send seat confirmation notification to info@rynexsecurity.com
  try {
    await sendTeamNotification(
      `🎟️ SEAT CONFIRMED: ${data.name} (${data.groupName || "Individual"}) — Ticket Issued`,
      `
        <h2>CTF Event Seat Confirmed & Ticket Issued</h2>
        <p><strong>Candidate Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.to}</p>
        <p><strong>Category:</strong> ${data.category || "Competitor"}</p>
        <p><strong>University / Organization:</strong> ${data.groupName || "Individual"}</p>
        <p><strong>Ticket Token:</strong> ${data.ticketToken}</p>
        <p><strong>Status:</strong> CONFIRMED & ISSUED</p>
      `
    );
  } catch (err) {
    console.error("[mailer] Error sending team seat confirmation notification:", err);
  }

  return candidateResult;
}

/**
 * Sends the branded sponsorship confirmation email.
 */
export async function sendSponsorConfirmationEmail(data: {
  to: string;
  companyName: string;
  contactName: string;
  tier: string;
}) {
  const template = buildSponsorConfirmationEmail({
    companyName: data.companyName,
    contactName: data.contactName,
    tier: data.tier,
  });

  const sponsorResult = await sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: NOTIFY_TO,
  });

  try {
    await sendTeamNotification(
      `🤝 SPONSOR CONFIRMED: ${data.companyName} (${data.tier}) — Partnership Confirmed`,
      `
        <h2>Sponsorship Partnership Confirmed</h2>
        <p><strong>Company Name:</strong> ${data.companyName}</p>
        <p><strong>Contact Name:</strong> ${data.contactName}</p>
        <p><strong>Email:</strong> ${data.to}</p>
        <p><strong>Tier:</strong> ${data.tier}</p>
        <p><strong>Status:</strong> CONFIRMED</p>
      `
    );
  } catch (err) {
    console.error("[mailer] Error sending team sponsor confirmation notification:", err);
  }

  return sponsorResult;
}