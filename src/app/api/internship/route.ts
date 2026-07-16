import { NextResponse } from "next/server";

import {
  sendInternshipConfirmationEmail,
  sendTeamNotification,
} from "@/lib/mailer";

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

  const fullName = readString(body.fullName);
  const email = readString(body.email).toLowerCase();
  const track = readString(body.track);
  const education = readString(body.education);
  const resumeLink = readString(body.resumeLink);
  const message = readString(body.message);
  const website = readString(body.website);

  // Honeypot: silently accept bot submissions.
  if (website) {
    return NextResponse.json({
      ok: true,
    });
  }

  if (!fullName || !email || !track || !message) {
    return NextResponse.json(
      {
        error:
          "Full name, email, track, and message are required.",
      },
      {
        status: 400,
      },
    );
  }

  if (fullName.length > 100) {
    return NextResponse.json(
      {
        error: "Full name is too long.",
      },
      {
        status: 400,
      },
    );
  }

  if (email.length > 254 || !isValidEmail(email)) {
    return NextResponse.json(
      {
        error: "Please provide a valid email address.",
      },
      {
        status: 400,
      },
    );
  }

  if (track.length > 100) {
    return NextResponse.json(
      {
        error: "Track name is too long.",
      },
      {
        status: 400,
      },
    );
  }

  if (education.length > 500) {
    return NextResponse.json(
      {
        error: "Education information is too long.",
      },
      {
        status: 400,
      },
    );
  }

  if (resumeLink.length > 1000) {
    return NextResponse.json(
      {
        error: "Resume link is too long.",
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

  try {
    await sendTeamNotification(
      `New internship application from ${cleanEmailHeader(fullName)} (${cleanEmailHeader(track)})`,
      `
        <h2>New internship application</h2>

        <p>
          <strong>Name:</strong>
          ${escapeHtml(fullName)}
        </p>

        <p>
          <strong>Email:</strong>
          ${escapeHtml(email)}
        </p>

        <p>
          <strong>Track:</strong>
          ${escapeHtml(track)}
        </p>

        ${
          education
            ? `
              <p>
                <strong>Education:</strong>
                ${escapeHtml(education)}
              </p>
            `
            : ""
        }

        ${
          resumeLink
            ? `
              <p>
                <strong>Resume/LinkedIn:</strong>
                ${escapeHtml(resumeLink)}
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

    await sendInternshipConfirmationEmail(
      email,
      fullName,
      track,
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "[api/internship] failed to send email",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to submit application. Please try again later.",
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