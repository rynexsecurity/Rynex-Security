import { NextResponse } from "next/server";

import {
  sendContactConfirmationEmail,
  sendTeamNotification,
} from "@/lib/mailer";
import { validateEmail } from "@/lib/email-validator";

const INQUIRY_LABELS: Record<string, string> = {
  general: "General Inquiry",
  consultation: "Security Consultation (VAPT / SOC / GRC)",
  partnership: "Strategic Partnership",
  careers: "Careers / Internship",
  media: "Media & Press",
};

type JsonRecord = Record<string, unknown>;

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request body.",
      },
      {
        status: 400,
      },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
      },
      {
        status: 400,
      },
    );
  }

  const name = readString(body.name);
  const email = readString(body.email).toLowerCase();
  const inquiryType = readString(body.inquiryType);
  const subject = readString(body.subject);
  const message = readString(body.message);
  const website = readString(body.website);

  // Honeypot: silently accept bot submissions.
  if (website) {
    return NextResponse.json({
      ok: true,
    });
  }

  if (!name || !email || !message) {
    return NextResponse.json(
      {
        error: "Name, email, and message are required.",
      },
      {
        status: 400,
      },
    );
  }

  if (name.length > 100) {
    return NextResponse.json(
      {
        error: "Name is too long.",
      },
      {
        status: 400,
      },
    );
  }

  const emailValidation = validateEmail(email);
  if (email.length > 254 || !emailValidation.isValid) {
    return NextResponse.json(
      {
        error: emailValidation.error || "Please provide a valid email address.",
      },
      {
        status: 400,
      },
    );
  }

  if (subject.length > 150) {
    return NextResponse.json(
      {
        error: "Subject is too long.",
      },
      {
        status: 400,
      },
    );
  }

  if (message.length > 5000) {
    return NextResponse.json(
      {
        error: "Message is too long.",
      },
      {
        status: 400,
      },
    );
  }

  const inquiryLabel =
    INQUIRY_LABELS[inquiryType] ??
    "General Inquiry";

  const notificationSubject = [
    `New contact form message from ${cleanEmailHeader(name)}`,
    inquiryLabel,
    subject ? cleanEmailHeader(subject) : null,
  ]
    .filter(Boolean)
    .join(" — ");

  try {
    await sendTeamNotification(
      notificationSubject,
      `
        <h2>New contact form submission</h2>

        <p>
          <strong>Name:</strong>
          ${escapeHtml(name)}
        </p>

        <p>
          <strong>Email:</strong>
          ${escapeHtml(email)}
        </p>

        <p>
          <strong>Inquiry Type:</strong>
          ${escapeHtml(inquiryLabel)}
        </p>

        ${
          subject
            ? `
              <p>
                <strong>Subject:</strong>
                ${escapeHtml(subject)}
              </p>
            `
            : ""
        }

        <p><strong>Message:</strong></p>

        <p>
          ${escapeHtml(message).replace(/\r?\n/g, "<br />")}
        </p>
      `,
      email,
    );

    await sendContactConfirmationEmail(
      email,
      name,
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "[api/contact] failed to send email",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to deliver message. Please try again later.",
      },
      {
        status: 500,
      },
    );
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readString(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanEmailHeader(value: string): string {
  return value
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 150);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}