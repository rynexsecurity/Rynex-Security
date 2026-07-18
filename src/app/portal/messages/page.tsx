"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { Role } from "@prisma/client";

interface Message {
  id: string;
  threadId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  attachmentUrl?: string;
  sender: { id: string; name: string; email: string; role: string };
  receiver: { id: string; name: string; email: string; role: string };
  project?: { id: string; title: string } | null;
}

interface Thread {
  threadId: string;
  otherUser: { id: string; name: string; role: string };
  lastMessage: Message;
  unreadCount: number;
  projectTitle?: string;
}

interface CurrentUser {
  userId: string;
  name: string;
  role: Role;
  email: string;
  mustChangePassword: boolean;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupIntoThreads(messages: Message[], myId: string): Thread[] {
  const threadMap = new Map<string, Thread>();

  for (const msg of messages) {
    if (threadMap.has(msg.threadId)) continue;

    const otherUser = msg.sender.id === myId
      ? { id: msg.receiver.id, name: msg.receiver.name, role: msg.receiver.role }
      : { id: msg.sender.id, name: msg.sender.name, role: msg.sender.role };

    // Count unread in this thread
    const unreadCount = messages.filter(
      (m) => m.threadId === msg.threadId && !m.isRead && m.receiver.id === myId
    ).length;

    threadMap.set(msg.threadId, {
      threadId: msg.threadId,
      otherUser,
      lastMessage: messages
        .filter((m) => m.threadId === msg.threadId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
      unreadCount,
      projectTitle: msg.project?.title,
    });
  }

  return Array.from(threadMap.values()).sort(
    (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );
}

export default function MessagesPage() {
  const [session, setSession] = useState<CurrentUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadUser, setNewThreadUser] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchSession = useCallback(async () => {
    const res = await fetch("/api/portal/auth/me");
    if (res.ok) {
      const data = await res.json();
      setSession({ userId: data.user.id, name: data.user.name, role: data.user.role, email: data.user.email, mustChangePassword: data.user.mustChangePassword });
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    const res = await fetch("/api/portal/messages");
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSession();
    fetchMessages();

    fetch("/api/portal/users").then((r) => r.json()).then((data) => {
      setAvailableUsers(data.users ?? []);
    });

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const queryThreadId = urlParams.get("threadId");
      const queryNewThreadUser = urlParams.get("newThreadUser");
      
      if (queryThreadId) {
        setActiveThread(queryThreadId);
      } else if (queryNewThreadUser) {
        setNewThreadUser(queryNewThreadUser);
        setShowNewThread(true);
      }
    }
  }, [fetchSession, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread, messages]);

  if (!session) return null;

  const threads = groupIntoThreads(messages, session.userId);
  const activeMessages = activeThread
    ? messages.filter((m) => m.threadId === activeThread).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    : [];

  const activeThreadInfo = threads.find((t) => t.threadId === activeThread);

  async function sendMessage() {
    if (!newMessage.trim() || !activeThreadInfo) return;
    setSending(true);

    await fetch("/api/portal/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: activeThreadInfo.otherUser.id,
        content: newMessage.trim(),
      }),
    });

    setNewMessage("");
    setSending(false);
    fetchMessages();
  }

  async function startNewThread() {
    if (!newThreadUser || !newMessage.trim()) return;
    setSending(true);

    await fetch("/api/portal/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: newThreadUser,
        content: newMessage.trim(),
      }),
    });

    setNewMessage("");
    setShowNewThread(false);
    setNewThreadUser("");
    setSending(false);
    fetchMessages();
  }

  return (
    <PortalShell
      userName={session.name}
      userRole={session.role}
      pageTitle={session.role === "CEO" ? "Client Inbox" : "Messages"}
      pageSubtitle={session.role === "CEO" ? "Unified client communication center" : "Your conversations"}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: 0,
        height: "calc(100vh - var(--header-height) - 56px)",
        background: "var(--portal-card)",
        border: "1px solid var(--portal-border)",
        borderRadius: "var(--portal-radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--portal-shadow)",
      }}>
        {/* Thread List */}
        <div style={{
          borderRight: "1px solid var(--portal-border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--portal-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {threads.length} Conversation{threads.length !== 1 ? "s" : ""}
            </span>
            {["CEO", "ADMIN", "DEVELOPER", "HEAD"].includes(session.role) && (
              <button
                id="new-message-btn"
                className="btn btn-primary btn-sm"
                onClick={() => setShowNewThread(true)}
              >
                <i className="fa fa-pen-to-square" />
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div className="portal-empty"><div className="portal-spinner" /></div>
            ) : threads.length === 0 ? (
              <div className="portal-empty" style={{ padding: 40 }}>
                <i className="fa fa-comments" />
                <p style={{ fontSize: 13 }}>No conversations yet.</p>
              </div>
            ) : (
              threads.map((thread) => (
                <div
                  key={thread.threadId}
                  onClick={() => setActiveThread(thread.threadId)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    background: activeThread === thread.threadId ? "var(--portal-teal-light)" : "transparent",
                    borderLeft: activeThread === thread.threadId ? "3px solid var(--portal-teal)" : "3px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                  id={`thread-${thread.threadId}`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      className="portal-avatar"
                      style={{ background: activeThread === thread.threadId ? "var(--portal-teal)" : "var(--portal-navy)" }}
                    >
                      {getInitials(thread.otherUser.name)}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: thread.unreadCount > 0 ? 700 : 600, fontSize: 13.5, color: "var(--portal-text-primary)" }}>
                          {thread.otherUser.name}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--portal-text-muted)" }}>
                          {formatTime(thread.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: "var(--portal-text-secondary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginTop: 2,
                      }}>
                        {thread.lastMessage.content}
                      </div>
                      {thread.projectTitle && (
                        <div style={{ fontSize: 11, color: "var(--portal-teal)", marginTop: 2 }}>
                          <i className="fa fa-folder-open" style={{ marginRight: 4 }} />
                          {thread.projectTitle}
                        </div>
                      )}
                    </div>
                    {thread.unreadCount > 0 && (
                      <span style={{
                        background: "var(--portal-teal)",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 18,
                        height: 18,
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!activeThread ? (
            <div className="portal-empty" style={{ flex: 1 }}>
              <i className="fa fa-comments" style={{ fontSize: 48 }} />
              <p>Select a conversation to view messages.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{
                padding: "12px 20px",
                borderBottom: "1px solid var(--portal-border)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <div className="portal-avatar portal-avatar-lg" style={{ background: "var(--portal-navy)" }}>
                  {getInitials(activeThreadInfo?.otherUser.name ?? "")}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {activeThreadInfo?.otherUser.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--portal-text-muted)" }}>
                    {activeThreadInfo?.otherUser.role}
                    {activeThreadInfo?.projectTitle && ` · ${activeThreadInfo.projectTitle}`}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                <div className="message-thread">
                  {activeMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message-bubble ${msg.sender.id === session.userId ? "outgoing" : ""}`}
                    >
                      <div
                        className="portal-avatar portal-avatar-sm"
                        style={{
                          background: msg.sender.id === session.userId ? "var(--portal-teal)" : "var(--portal-navy)",
                        }}
                      >
                        {getInitials(msg.sender.name)}
                      </div>
                      <div>
                        <div className="message-bubble-content">{msg.content}</div>
                        <div className={`message-meta ${msg.sender.id === session.userId ? "text-right" : ""}`}
                          style={{ textAlign: msg.sender.id === session.userId ? "right" : "left" }}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </div>

              {/* Input */}
              <div style={{
                padding: "14px 20px",
                borderTop: "1px solid var(--portal-border)",
                display: "flex",
                gap: 10,
              }}>
                <input
                  id="message-input"
                  type="text"
                  className="form-control"
                  placeholder="Type your message…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  style={{ flex: 1 }}
                />
                <button
                  id="send-message-btn"
                  className="btn btn-primary"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? <span className="portal-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <i className="fa fa-paper-plane" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewThread && (
        <div className="portal-modal-overlay">
          <div className="portal-modal">
            <div className="portal-modal-header">
              <h2 className="portal-modal-title">New Message</h2>
              <button className="portal-modal-close" onClick={() => setShowNewThread(false)}>
                <i className="fa fa-xmark" />
              </button>
            </div>
            <div className="portal-modal-body">
              <div className="form-group">
                <label htmlFor="new-thread-recipient" className="form-label">To</label>
                <select id="new-thread-recipient" className="form-control" value={newThreadUser} onChange={(e) => setNewThreadUser(e.target.value)}>
                  <option value="">Select recipient…</option>
                  {availableUsers
                    .filter((u) => u.id !== session.userId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))
                  }
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="new-thread-message" className="form-label">Message</label>
                <textarea
                  id="new-thread-message"
                  className="form-control"
                  placeholder="Type your message…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ minHeight: 100 }}
                />
              </div>
            </div>
            <div className="portal-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewThread(false)}>Cancel</button>
              <button id="send-new-thread-btn" className="btn btn-primary" onClick={startNewThread} disabled={!newThreadUser || !newMessage.trim() || sending}>
                <i className="fa fa-paper-plane" /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
