// file: app/messages/[userId]/page.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, Trash2, Edit2, Check, X, UserRound, Ban } from "lucide-react";

import { getPusherClient } from "@/lib/pusher-client";

type UserInfo = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  image?: string;
  profileImage?: string;
  googleImage?: string;
  googleProfileImage?: string;
  department?: string;
  graduatedYear?: number | null;
};

type Message = {
  _id: string;
  text: string;
  isDeleted?: boolean;
  isEdited?: boolean;
  deletedBy?: string;
  seen?: boolean;
  createdAt?: string;
  updatedAt?: string;
  sender: UserInfo;
  receiver: UserInfo;
};

const MESSAGE_DRAFT_KEY = "ucsh-message-draft";
const MESSAGE_SCROLL_KEY = "ucsh-message-scroll";

function getConversationId(userA: string, userB: string) {
  return [userA, userB].sort().join("-");
}

function getUserImage(user?: UserInfo | null) {
  return (
    user?.profileImage ||
    user?.image ||
    user?.googleImage ||
    user?.googleProfileImage ||
    "/avatar.png"
  );
}

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

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(dateString, today.toISOString())) return "Today";
  if (isSameDay(dateString, yesterday.toISOString())) return "Yesterday";

  return new Date(dateString).toLocaleDateString("en-US", {
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
  
  // Action Loading states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const restoredScroll = useRef(false);

  const draftKey = `${MESSAGE_DRAFT_KEY}-${userId}`;
  const scrollKey = `${MESSAGE_SCROLL_KEY}-${userId}`;

  const groupedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const previous = messages[index - 1];

      return {
        message,
        showDate: !previous || !isSameDay(previous.createdAt, message.createdAt),
      };
    });
  }, [messages]);

  const saveScrollPosition = useCallback(() => {
    const body = chatBodyRef.current;
    if (!body) return;

    sessionStorage.setItem(scrollKey, String(body.scrollTop));
  }, [scrollKey]);

  async function loadMe() {
    const res = await fetch("/api/me", { cache: "no-store" });

    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (!res.ok) return;

    setMe(await res.json());
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

    const savedDraft = sessionStorage.getItem(draftKey);
    if (savedDraft) setText(savedDraft);

    loadMe();
    loadReceiver();
    loadMessages();
  }, [userId, draftKey]);

  useEffect(() => {
    sessionStorage.setItem(draftKey, text);
  }, [text, draftKey]);

  useEffect(() => {
    const body = chatBodyRef.current;
    if (!body) return;

    body.addEventListener("scroll", saveScrollPosition);

    return () => {
      body.removeEventListener("scroll", saveScrollPosition);
    };
  }, [saveScrollPosition]);

  // Pusher Subscription handles new messages, inline edits, and ghost deletions
  useEffect(() => {
    if (!me?._id || !userId) return;

    const pusherClient = getPusherClient();
    if (!pusherClient) return;

    const conversationId = getConversationId(me._id, userId);
    const channelName = `chat-${conversationId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("new-message", (incoming: Message) => {
      setMessages((prev) => {
        const index = prev.findIndex((item) => item._id === incoming._id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = incoming;
          return updated;
        }
        return [...prev, incoming];
      });
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [me?._id, userId]);

  useEffect(() => {
    if (restoredScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const body = chatBodyRef.current;
    const savedScroll = sessionStorage.getItem(scrollKey);

    restoredScroll.current = true;

    window.requestAnimationFrame(() => {
      if (body && savedScroll) {
        body.scrollTop = Number(savedScroll) || 0;
      } else {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      }
    });
  }, [messages.length, scrollKey]);

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
      sessionStorage.removeItem(draftKey);
      await loadMessages();
    } finally {
      setSending(false);
    }
  }

  function startEditing(msg: Message) {
    setEditingId(msg._id);
    setEditText(msg.text);
  }

  async function commitEdit(messageId: string) {
    if (!editText.trim() || editingId !== messageId) return;

    try {
      const res = await fetch(`/api/messages/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, newText: editText.trim() }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, text: editText.trim(), isEdited: true } : m))
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error("Edit message failed:", error);
    }
  }

  async function deleteMessage(messageId: string) {
    if (!messageId || deletingId) return;

    const ok = window.confirm("Delete this message?");
    if (!ok) return;

    setDeletingId(messageId);
    const deleterName = me?.name || "User";

    try {
      const res = await fetch(`/api/messages/${userId}?messageId=${messageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, isDeleted: true, deletedBy: deleterName, text: `${deleterName} deleted this message.` }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Delete message failed:", error);
    } finally {
      setDeletingId(null);
    }
  }

  const isRestrictedAdminChat = useMemo(() => {
    return me?.role?.toLowerCase() !== "admin" && receiver?.role?.toLowerCase() === "admin";
  }, [me, receiver]);

  return (
    <main className="mm fixed inset-x-0 bottom-0 top-[72px] overflow-hidden bg-white text-[var(--ucsh-text)] sm:top-[80px]">
      <div className="flex h-full w-full flex-col overflow-hidden bg-white">
        
        {/* Header */}
        <header className="flex h-[56px] shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 sm:h-[60px] sm:px-3 z-10">
          <Link
            href="/messages"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </Link>

          <Image
            src={getUserImage(receiver)}
            alt={receiver?.name || "Alumni"}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />

          <div className="min-w-0 flex-1">
            <h1 className="line-clamp-1 text-sm font-black text-slate-900 sm:text-base">
              {receiver?.name || "Alumni"}
            </h1>

            <p className="line-clamp-1 text-[11px] font-semibold text-slate-500">
              {receiver?.department || "Alumni"}
              {receiver?.graduatedYear ? ` • ${receiver.graduatedYear}` : ""}
            </p>
          </div>

          <Link
            href={`/profile/${userId}`}
            className="flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-black text-slate-600 transition hover:bg-slate-100 sm:px-3"
          >
            <UserRound size={16} />
            <span className="hidden sm:inline">Profile</span>
          </Link>
        </header>

        {/* Chat Timeline */}
        <section
          ref={chatBodyRef}
          className="flex-1 overflow-y-auto bg-slate-50 px-2 py-3 sm:px-4"
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                  <Send size={22} />
                </div>

                <h2 className="mt-3 text-base font-black text-slate-900">
                  No messages yet
                </h2>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Start the conversation with {receiver?.name || "this alumni"}.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {groupedMessages.map(({ message, showDate }) => {
                const mine = String(message.sender?._id) === String(me?._id);
                const isEditingThis = editingId === message._id;

                return (
                  <div key={message._id}>
                    {/* CENTER STICKY Viber-style Day Divider */}
                    {showDate && (
                      <div className="my-4 flex justify-center">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-500 shadow-xs">
                          {formatDateLabel(message.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Message Row */}
                    <div
                      className={`group flex items-end gap-2 ${
                        mine ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!mine && (
                        <Image
                          src={getUserImage(message.sender)}
                          alt={message.sender?.name || "User"}
                          width={34}
                          height={34}
                          className="mb-4 h-[34px] w-[34px] shrink-0 rounded-full object-cover select-none"
                        />
                      )}

                      <div
                        className={`flex max-w-[85%] items-end gap-1.5 sm:max-w-[65%] ${
                          mine ? "flex-row" : "flex-row-reverse"
                        }`}
                      >
                        {/* TIMESTAMP placed strictly outside bubble */}
                        <span className="mb-1 shrink-0 text-[10px] font-semibold text-slate-400 select-none">
                          {formatTime(message.createdAt)}
                        </span>

                        {/* Bubble Core */}
                        <div className="relative flex items-center">
                          {isEditingThis ? (
                            <div className="flex min-w-[200px] items-center gap-1 rounded-2xl border border-[#00bfc4] bg-white p-1 shadow-md">
                              <input
                                autoFocus
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && commitEdit(message._id)}
                                className="w-full bg-transparent px-2 py-1 text-xs font-bold text-slate-800 outline-none"
                              />
                              <button type="button" onClick={() => commitEdit(message._id)} className="rounded-xl bg-emerald-500 p-1.5 text-white hover:bg-emerald-600"><Check size={14} /></button>
                              <button type="button" onClick={() => setEditingId(null)} className="rounded-xl bg-slate-200 p-1.5 text-slate-600 hover:bg-slate-300"><X size={14} /></button>
                            </div>
                          ) : (
                            <div
                              className={`rounded-2xl px-3.5 py-2 text-sm leading-6 shadow-xs ${
                                message.isDeleted
                                  ? "border border-slate-200 bg-slate-100 italic text-slate-400 select-none"
                                  : mine
                                    ? "rounded-br-xs bg-[#baf59f] text-slate-900"
                                    : "rounded-bl-xs bg-slate-100 text-slate-900"
                              }`}
                            >
                              <div className="flex items-baseline gap-1.5">
                                {message.isDeleted && <Ban size={13} className="mr-0.5 inline shrink-0 opacity-60" />}
                                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                                {message.isEdited && !message.isDeleted && (
                                  <span className="ml-1 text-[9px] italic text-slate-500">(edited)</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Hover Floating Action Menu (Edit / Delete) */}
                          {mine && !message.isDeleted && !isEditingThis && (
                            <div className="absolute -left-16 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-md group-hover:flex">
                              <button
                                type="button"
                                onClick={() => startEditing(message)}
                                title="Edit"
                                className="rounded-lg p-1 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteMessage(message._id)}
                                disabled={deletingId === message._id}
                                title="Delete"
                                className="rounded-lg p-1 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-br-xs bg-[#baf59f] px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500/70" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500/70 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500/70 [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="shrink-0 border-t border-slate-200 bg-white p-2">
          {isRestrictedAdminChat ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-center text-xs font-black text-amber-700">
              Only Administrators can send messages in this channel.
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Enter a message"
                rows={1}
                className="max-h-28 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00bfc4] text-white transition hover:bg-[#0b9fa4] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          )}
        </footer>
      </div>
    </main>
  );
}