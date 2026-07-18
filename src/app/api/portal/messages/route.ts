import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/portal/prisma";
import { getSession } from "@/lib/portal/auth";
import { Role } from "@prisma/client";
import { sendNewMessageEmail } from "@/lib/portal/mailer";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.role as Role;
    const url = new URL(req.url);
    const threadId = url.searchParams.get("threadId");
    const projectId = url.searchParams.get("projectId");

    let whereClause: Record<string, unknown> = {};

    if (role === "CEO") {
      // CEO sees all client messages + thread-specific
      if (threadId) {
        whereClause = { threadId };
      } else {
        whereClause = {
          OR: [
            { receiverId: session.userId },
            { senderId: session.userId },
            { sender: { role: "CLIENT" } },
          ],
        };
      }
    } else if (threadId) {
      whereClause = {
        threadId,
        OR: [{ senderId: session.userId }, { receiverId: session.userId }],
      };
    } else {
      whereClause = {
        OR: [{ senderId: session.userId }, { receiverId: session.userId }],
        ...(projectId ? { projectId } : {}),
      };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
        receiver: { select: { id: true, name: true, email: true, role: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[Messages API] GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.role as Role;

    // CLIENT and INTERN have restricted messaging
    // Full validation of "who can message whom" is done here
    const canSend = ["CEO", "ADMIN", "DEVELOPER", "HEAD", "CLIENT"].includes(role);
    if (!canSend) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { receiverId, projectId, content, attachmentUrl } = await req.json();

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: "Receiver and message content are required." },
        { status: 400 }
      );
    }

    // Validate receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "Recipient not found." }, { status: 404 });
    }

    // Generate or find existing thread ID for this sender+receiver+project combo
    const existingThread = await prisma.message.findFirst({
      where: {
        projectId: projectId || null,
        OR: [
          { senderId: session.userId, receiverId },
          { senderId: receiverId, receiverId: session.userId },
        ],
      },
      select: { threadId: true },
      orderBy: { createdAt: "asc" },
    });

    const threadId =
      existingThread?.threadId ??
      `${[session.userId, receiverId].sort().join("-")}${projectId ? `-${projectId}` : ""}`;

    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: session.userId,
        receiverId,
        projectId: projectId || null,
        content: content.trim(),
        attachmentUrl: attachmentUrl ?? null,
        isRead: false,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
        receiver: { select: { id: true, name: true, email: true, role: true } },
        project: { select: { id: true, title: true } },
      },
    });

    // Email notification to receiver
    const portalUrl = process.env.SITE_URL ?? "https://rynexsecurity.com";
    try {
      await sendNewMessageEmail({
        to: receiver.email,
        recipientName: receiver.name,
        senderName: session.name,
        projectTitle: message.project?.title ?? "General",
        messagePreview: content.trim().slice(0, 100) + (content.length > 100 ? "…" : ""),
        threadUrl: `${portalUrl}/portal/messages/${threadId}`,
      });
    } catch (emailErr) {
      console.error("[Messages API] Email notification failed:", emailErr);
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[Messages API] POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
