import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendEventRegistrationEmail, sendSponsorConfirmationEmail } from "@/lib/mailer";

const prisma = new PrismaClient();

// GET all event submissions for Admin Portal
export async function GET(req: Request) {
  try {
    const submissions = await prisma.eventSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("[api/portal/events] GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch event submissions" }, { status: 500 });
  }
}

// PATCH update status or resend email for submission
export async function PATCH(req: Request) {
  try {
    const { id, status, resend } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    let updated = await prisma.eventSubmission.findUnique({ where: { id } });
    if (!updated) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (status) {
      updated = await prisma.eventSubmission.update({
        where: { id },
        data: { status },
      });
    }

    // Trigger ticket/confirmation email if status is CONFIRMED/APPROVED or resend flag is active
    if (resend || status === "CONFIRMED" || status === "APPROVED") {
      try {
        if (updated.type === "SPONSOR") {
          await sendSponsorConfirmationEmail({
            to: updated.email,
            companyName: updated.name,
            contactName: updated.name,
            tier: updated.tier || "Partner Sponsor",
          });
        } else {
          await sendEventRegistrationEmail({
            to: updated.email,
            name: updated.name,
            ticketToken: updated.ticketToken || `RYNEX-ECLIPSE-2026-${Math.floor(100000 + Math.random() * 900000)}`,
            groupName: updated.groupName || undefined,
            category: updated.category || undefined,
          });
        }
      } catch (mailErr) {
        console.error("[api/portal/events] Error sending confirmation email:", mailErr);
      }
    }

    return NextResponse.json({ ok: true, submission: updated });
  } catch (error) {
    console.error("[api/portal/events] PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}

// DELETE submission
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.eventSubmission.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/portal/events] DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
}
