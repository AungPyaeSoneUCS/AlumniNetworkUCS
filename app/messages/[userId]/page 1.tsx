// file: app/messages/[userId]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";

type UserInfo = {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  department?: string;
  graduatedYear?: number | null;
};

type Message = {
  _id: string;
  text: string;
  seen?: boolean;
  createdAt?: string;
  updatedAt?: string;
  sender: UserInfo;
  receiver: UserInfo;
};

function isSameDay(a?: string, b?: string) {
  if (!a || !b) return false;

  const d1 = new Date(a);
  const d2 = new Date(b);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDateLabel(dateString?: string) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(dateString, today.toISOString())) return "Today";
  if (isSameDay(dateString, yesterday.toISOString())) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString?: string) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const params = useParams<{ userId: string }>();
  const userId = String(params?.userId || "");

  const [me, setMe] = useState<UserInfo | null>(null);
  const [receiver, setReceiver] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const groupedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const previous = messages[index - 1];

      return {
        message,
        showDate: !previous || !isSameDay(previous.createdAt, message.createdAt),
      };
    });
  }, [messages]);

  async function loadMe() {
    const res = await fetch("/api/me", { cache: "no-store" });

    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (!res.ok) return;

    const data = await res.json();
    setMe(data);
  }

  async function loadReceiver() {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (!res.ok) return;

    const data = await res.json();

    if (Array.isArray(data)) {
      const found = data.find((user: UserInfo) => user._id === userId);
      setReceiver(found || null);
    }
  }

  async function loadMessages() {
    const res = await fetch(`/api/messages/${userId}`, {
      cache: "no-store",
    });

    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (!res.ok) {
      setMessages([]);
      return;
    }

    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    if (!userId) return;

    loadMe();
    loadReceiver();
    loadMessages();
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage() {
    if (!text.trim() || sending) return;

    const messageText = text.trim();

    setSending(true);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: userId,
          text: messageText,
        }),
      });

      if (!res.ok) return;

      setText("");
      await loadMessages();
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(messageId: string) {
    if (!messageId || deletingId) return;

    const ok = window.confirm("Delete this message?");
    if (!ok) return;

    setDeletingId(messageId);

    const oldMessages = messages;
    setMessages((prev) => prev.filter((message) => message._id !== messageId));

    try {
      const res = await fetch(`/api/messages/${userId}?messageId=${messageId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setMessages(oldMessages);
      }
    } catch (error) {
      console.error("Delete message failed:", error);
      setMessages(oldMessages);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mm fixed inset-x-0 bottom-0 top-[88px] overflow-hidden bg-[var(--ucsh-bg)] px-3 py-4 text-[var(--ucsh-text)] sm:px-5">
      <BackgroundDecor />

      <div className="ucsh-card relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden p-0">
        <header className="flex items-center gap-3 border-b border-[var(--ucsh-border)] bg-white/90 px-3 py-3 shadow-sm backdrop-blur-xl dark:bg-slate-950/90 sm:px-5">
          <Link
            href="/messages"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--ucsh-border)] bg-white/70 text-[var(--ucsh-primary-dark)] shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-slate-900"
          >
            <ArrowLeft size={20} />
          </Link>

          <img
            src={receiver?.image || "/avatar.png"}
            alt={receiver?.name || "Alumni"}
            className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-white dark:ring-slate-900"
          />

          <div className="min-w-0 flex-1">
            <h1 className="line-clamp-1 font-black text-[var(--ucsh-text)]">
              {receiver?.name || "Alumni"}
            </h1>

            <p className="line-clamp-1 text-xs font-bold text-[var(--ucsh-muted)]">
              {receiver?.department || "Alumni"}
              {receiver?.graduatedYear ? ` • ${receiver.graduatedYear}` : ""}
            </p>
          </div>

          <Link
            href={`/profile/${userId}`}
            className="ucsh-btn hidden px-4 py-2 text-sm sm:flex"
          >
            <UserRound size={17} />
            Profile
          </Link>
        </header>

        <section className="flex-1 overflow-y-auto bg-cyan-50/40 px-3 py-5 dark:bg-slate-950/40 sm:px-5">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="ucsh-card p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-md">
                  <Send size={24} />
                </div>

                <h2 className="mt-4 text-lg font-black text-[var(--ucsh-text)]">
                  No messages yet
                </h2>

                <p className="mt-1 text-sm font-bold text-[var(--ucsh-muted)]">
                  Start the conversation with {receiver?.name || "this alumni"}.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {groupedMessages.map(({ message, showDate }) => {
                const mine = String(message.sender?._id) === String(me?._id);

                return (
                  <div key={message._id}>
                    {showDate && (
                      <div className="sticky top-2 z-10 my-5 flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ucsh-border)] bg-white/90 px-4 py-2 text-xs font-black text-[var(--ucsh-muted)] shadow-md backdrop-blur-xl dark:bg-slate-900/90">
                          <CalendarDays size={14} />
                          {formatDateLabel(message.createdAt)}
                        </div>
                      </div>
                    )}

                    <div
                      className={`group flex ${
                        mine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex max-w-[82%] items-end gap-2 sm:max-w-[70%] ${
                          mine ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        {!mine && (
                          <img
                            src={message.sender?.image || "/avatar.png"}
                            alt={message.sender?.name || "User"}
                            className="mb-1 h-8 w-8 rounded-xl object-cover shadow-sm"
                          />
                        )}

                        <div
                          className={`relative rounded-[22px] px-4 py-3 shadow-md ${
                            mine
                              ? "rounded-br-md bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white"
                              : "rounded-bl-md border border-[var(--ucsh-border)] bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-6">
                            {message.text}
                          </p>

                          <div
                            className={`mt-1 text-right text-[10px] font-black ${
                              mine
                                ? "text-white/75"
                                : "text-[var(--ucsh-muted)]"
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </div>

                          {mine && (
                            <button
                              type="button"
                              onClick={() => deleteMessage(message._id)}
                              disabled={deletingId === message._id}
                              title="Delete message"
                              className="absolute -left-10 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-white text-red-500 shadow-md transition hover:bg-red-50 disabled:opacity-50 group-hover:flex dark:bg-slate-900"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex justify-end">
                  <div className="rounded-[22px] rounded-br-md bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] px-4 py-3 text-white shadow-md">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/80" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/80 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/80 [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </section>

        <footer className="border-t border-[var(--ucsh-border)] bg-white/90 px-3 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:bg-slate-950/90 sm:px-5">
          <div className="flex items-end gap-2 rounded-[1.7rem] border border-[var(--ucsh-border)] bg-white/70 p-2 shadow-inner dark:bg-slate-900/70">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Write a message..."
              rows={1}
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-4 py-3 text-sm font-bold text-[var(--ucsh-text)] outline-none placeholder:text-slate-400"
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}

function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
      <div className="absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-[var(--ucsh-primary)]/30 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-white/50 blur-3xl" />
    </div>
  );
}