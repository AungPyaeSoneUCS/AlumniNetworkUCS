// file: app/messages/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  MessageCircle, 
  Search, 
  Send, 
  UserRound, 
  ShieldAlert, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Ban, 
  AlertTriangle 
} from "lucide-react";

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

type DialogState = {
  isOpen: boolean;
  title: string;
  description: string;
  type: "alert" | "confirm";
  onConfirm?: () => void;
};

const SELECTED_USER_STORAGE_KEY = "ucsh-messages-selected-user-id";
const SEARCH_STORAGE_KEY = "ucsh-messages-search";
const DRAFT_STORAGE_KEY = "ucsh-messages-draft";

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

function formatTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MessagesPage() {
  const [me, setMe] = useState<UserInfo | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modern Dialog State
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: "",
    description: "",
    type: "alert",
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const restoredSelectedUser = useRef(false);

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
    if (res.status === 401) return (window.location.href = "/login");
    setMe(await res.json());
  }

  async function loadUsers() {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.status === 401) return (window.location.href = "/login");

    const data = await res.json();
    const userList: UserInfo[] = Array.isArray(data) ? data : [];
    setUsers(userList);

    if (restoredSelectedUser.current) return;
    restoredSelectedUser.current = true;

    const savedUserId = sessionStorage.getItem(SELECTED_USER_STORAGE_KEY);
    if (!savedUserId) return;

    const savedUser = userList.find(
      (user) => String(user._id) === String(savedUserId),
    );

    if (savedUser) {
      setSelectedUser(savedUser);
    }
  }

  async function loadMessages(userId: string) {
    const res = await fetch(`/api/messages/${userId}`, { cache: "no-store" });
    if (res.status === 401) return (window.location.href = "/login");

    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    const savedSearch = sessionStorage.getItem(SEARCH_STORAGE_KEY);
    if (savedSearch) setSearch(savedSearch);

    loadMe();
    loadUsers();
  }, []);

  useEffect(() => {
    sessionStorage.setItem(SEARCH_STORAGE_KEY, search);
  }, [search]);

  useEffect(() => {
    if (!selectedUser?._id) return;
    sessionStorage.setItem(SELECTED_USER_STORAGE_KEY, selectedUser._id);

    const savedDraft = sessionStorage.getItem(
      `${DRAFT_STORAGE_KEY}-${selectedUser._id}`,
    );

    setText(savedDraft || "");
    loadMessages(selectedUser._id);
  }, [selectedUser?._id]);

  useEffect(() => {
    if (!selectedUser?._id) return;
    sessionStorage.setItem(`${DRAFT_STORAGE_KEY}-${selectedUser._id}`, text);
  }, [text, selectedUser?._id]);

  useEffect(() => {
    if (!me?._id || !selectedUser?._id) return;

    const pusherClient = getPusherClient();
    if (!pusherClient) return;

    const conversationId = getConversationId(me._id, selectedUser._id);
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
  }, [me?._id, selectedUser?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  function handleSelectUser(user: UserInfo) {
    setSelectedUser(user);
    setMessages([]);
    sessionStorage.setItem(SELECTED_USER_STORAGE_KEY, user._id);

    const savedDraft = sessionStorage.getItem(`${DRAFT_STORAGE_KEY}-${user._id}`);
    setText(savedDraft || "");
  }

  function handleBackToList() {
    setSelectedUser(null);
    setMessages([]);
    setText("");
    sessionStorage.removeItem(SELECTED_USER_STORAGE_KEY);
  }

  async function sendMessage() {
    if (!text.trim() || !selectedUser || sending) return;

    const amIAdmin = me?.role?.toLowerCase() === "admin";
    const isTargetAdmin = selectedUser?.role?.toLowerCase() === "admin";

    if (!amIAdmin && isTargetAdmin) {
      setDialog({
        isOpen: true,
        title: "Access Restricted",
        description: "You are not authorized to send direct messages to an Administrator.",
        type: "alert",
      });
      return;
    }

    const messageText = text.trim();
    setText("");
    setSending(true);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUser._id,
          text: messageText,
        }),
      });

      if (!res.ok) {
        setText(messageText);
        return;
      }

      sessionStorage.removeItem(`${DRAFT_STORAGE_KEY}-${selectedUser._id}`);
      await loadMessages(selectedUser._id);
    } finally {
      setSending(false);
    }
  }

  function startEditing(msg: Message) {
    setEditingId(msg._id);
    setEditText(msg.text);
  }

  async function commitEdit(messageId: string) {
    if (!editText.trim() || actionLoadingId || !selectedUser) return;
    setActionLoadingId(messageId);

    try {
      const res = await fetch(`/api/messages/${selectedUser._id}`, {
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
    } finally {
      setActionLoadingId(null);
    }
  }

  function requestDeleteMessage(messageId: string) {
    setDialog({
      isOpen: true,
      title: "Delete Message",
      description: "Are you sure you want to delete this message? This action cannot be undone.",
      type: "confirm",
      onConfirm: () => performDeleteMessage(messageId),
    });
  }

  async function performDeleteMessage(messageId: string) {
    setDialog((prev) => ({ ...prev, isOpen: false }));
    if (!messageId || actionLoadingId || !selectedUser) return;

    setActionLoadingId(messageId);
    const deleterName = me?.name || "User";

    try {
      const res = await fetch(`/api/messages/${selectedUser._id}?messageId=${messageId}`, {
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
    } finally {
      setActionLoadingId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const amIAdmin = me?.role?.toLowerCase() === "admin";

    return users
      .filter((user) => String(user._id) !== String(me?._id))
      .filter((user) => {
        if (!amIAdmin && user?.role?.toLowerCase() === "admin") {
          return false;
        }
        return true;
      })
      .filter((user) =>
        [user.name, user.email, user.department]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
  }, [users, me, search]);

  const isChatRestricted = useMemo(() => {
    const amIAdmin = me?.role?.toLowerCase() === "admin";
    const isTargetAdmin = selectedUser?.role?.toLowerCase() === "admin";
    return !amIAdmin && isTargetAdmin;
  }, [me, selectedUser]);

  return (
    <main className="mm fixed inset-x-0 bottom-0 top-[72px] overflow-hidden bg-[var(--ucsh-bg)] p-2 text-[var(--ucsh-text)] sm:top-[80px] sm:p-3">
      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl overflow-hidden rounded-2xl border border-[var(--ucsh-border)] bg-white/80 shadow-xl backdrop-blur-xl dark:bg-slate-950/80">
        <aside
          className={`h-full w-full shrink-0 bg-white/70 dark:bg-slate-950/70 md:block md:w-[330px] md:border-r md:border-[var(--ucsh-border)] lg:w-[360px] ${
            selectedUser ? "hidden" : "block"
          }`}
        >
          <div className="border-b border-[var(--ucsh-border)] p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-sm">
                <MessageCircle size={20} />
              </div>

              <div className="min-w-0">
                <h1 className="text-xl font-black leading-tight text-[var(--ucsh-text)]">
                  Messages
                </h1>
                <p className="line-clamp-1 text-[11px] font-bold text-[var(--ucsh-muted)]">
                  Realtime alumni chats
                </p>
              </div>
            </div>

            <div className="mt-3 flex h-10 items-center gap-2 rounded-xl border border-[var(--ucsh-border)] bg-white/80 px-3 shadow-sm dark:bg-slate-900/80">
              <Search size={15} className="text-[var(--ucsh-muted)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search alumni..."
                className="h-full min-w-0 flex-1 bg-transparent text-xs font-bold outline-none placeholder:text-slate-400 sm:text-sm"
              />
            </div>
          </div>

          <div className="h-[calc(100%-105px)] overflow-y-auto p-2">
            {filteredUsers.length === 0 ? (
              <div className="rounded-xl border border-[var(--ucsh-border)] bg-white/70 p-4 text-center text-sm font-bold text-[var(--ucsh-muted)] dark:bg-slate-900/70">
                No alumni found
              </div>
            ) : (
              filteredUsers.map((user) => {
                const active = selectedUser?._id === user._id;

                return (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={`mb-1.5 flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition hover:bg-white hover:shadow-sm dark:hover:bg-slate-900 ${
                      active
                        ? "border-cyan-200 bg-cyan-50 shadow-sm dark:border-cyan-900 dark:bg-cyan-950/30"
                        : "border-transparent bg-transparent"
                    }`}
                  >
                    <Image
                      src={getUserImage(user)}
                      alt={user.name || "Alumni"}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-xl object-cover shadow-sm"
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-1 text-sm font-black text-[var(--ucsh-text)]">
                        {user.name || "Unknown Alumni"}
                      </h2>

                      <p className="line-clamp-1 text-[11px] font-bold text-[var(--ucsh-muted)]">
                        {user.department || "Alumni"}
                        {user.graduatedYear ? ` • ${user.graduatedYear}` : ""}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section
          className={`h-full min-w-0 flex-1 flex-col bg-cyan-50/25 dark:bg-slate-950/40 ${
            selectedUser ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedUser ? (
            <>
              <header className="flex h-[64px] shrink-0 items-center gap-2.5 border-b border-[var(--ucsh-border)] bg-white/85 px-2.5 backdrop-blur-xl dark:bg-slate-950/85 sm:h-[68px] sm:px-4 z-10">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ucsh-border)] bg-white text-[var(--ucsh-primary-dark)] shadow-sm dark:bg-slate-900 md:hidden"
                >
                  <ArrowLeft size={18} />
                </button>

                <Image
                  src={getUserImage(selectedUser)}
                  alt={selectedUser.name || "Alumni"}
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-xl object-cover shadow-sm"
                />

                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-1 text-sm font-black text-[var(--ucsh-text)] sm:text-base">
                    {selectedUser.name || "Alumni"}
                  </h2>

                  <p className="line-clamp-1 text-[11px] font-bold text-[var(--ucsh-muted)]">
                    {selectedUser.department || "Alumni"}
                    {selectedUser.graduatedYear
                      ? ` • ${selectedUser.graduatedYear}`
                      : ""}
                  </p>
                </div>

                <Link
                  href={`/profile/${selectedUser._id}`}
                  className="ucsh-btn rounded-xl px-3 py-2 text-xs sm:text-sm"
                >
                  <UserRound size={15} />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </header>

              <div className="flex-1 overflow-y-auto px-2.5 py-3 sm:px-4 sm:py-4">
                <div className="min-h-full space-y-4">
                  {messages.length === 0 && (
                    <div className="grid min-h-[45vh] place-items-center text-center">
                      <div>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[var(--ucsh-primary-dark)] shadow-md dark:bg-slate-900">
                          <MessageCircle size={28} />
                        </div>

                        <p className="mt-3 text-sm font-bold text-[var(--ucsh-muted)]">
                          Start your conversation with{" "}
                          {selectedUser.name || "Alumni"}.
                        </p>
                      </div>
                    </div>
                  )}

                  {groupedMessages.map(({ message, showDate }) => {
                    const isMine = String(message.sender?._id) === String(me?._id);
                    const isEditingThis = editingId === message._id;

                    return (
                      <div key={message._id}>
                        {/* CENTER STICKY Viber-style Day Divider */}
                        {showDate && (
                          <div className="my-5 flex justify-center">
                            <span className="rounded-full border border-[var(--ucsh-border)] bg-white/90 px-3.5 py-1 text-[11px] font-bold text-slate-500 shadow-xs backdrop-blur-md dark:bg-slate-900/90 dark:text-slate-400">
                              {formatDateLabel(message.createdAt)}
                            </span>
                          </div>
                        )}

                        <div className={`flex items-end gap-2.5 ${isMine ? "justify-end" : "justify-start"}`}>
                          {!isMine && (
                            <Image
                              src={getUserImage(message.sender)}
                              alt="User"
                              width={32}
                              height={32}
                              className="mb-4 h-8 w-8 rounded-full object-cover shadow-sm shrink-0 select-none"
                            />
                          )}

                          <div className={`group flex max-w-[85%] items-end gap-1.5 sm:max-w-[65%] ${isMine ? "flex-row" : "flex-row-reverse"}`}>
                            {/* EXTERNAL TIMESTAMP */}
                            <span className="mb-1 shrink-0 text-[10px] font-bold text-slate-400 select-none">
                              {formatTime(message.createdAt)}
                            </span>

                            {/* Bubble Core */}
                            <div className="relative flex items-center">
                              {isEditingThis ? (
                                <div className="flex min-w-[200px] items-center gap-1 rounded-2xl border border-[var(--ucsh-primary)] bg-white p-1 shadow-md dark:bg-slate-900">
                                  <input
                                    autoFocus
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && commitEdit(message._id)}
                                    className="w-full bg-transparent px-2 py-1 text-xs font-bold text-[var(--ucsh-text)] outline-none"
                                  />
                                  <button type="button" onClick={() => commitEdit(message._id)} className="rounded-xl bg-emerald-500 p-1.5 text-white hover:bg-emerald-600"><Check size={14} /></button>
                                  <button type="button" onClick={() => setEditingId(null)} className="rounded-xl bg-slate-200 p-1.5 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"><X size={14} /></button>
                                </div>
                              ) : (
                                <div
                                  className={`rounded-2xl px-3.5 py-2.5 text-sm font-bold leading-6 shadow-sm ${
                                    message.isDeleted
                                      ? "border border-[var(--ucsh-border)] bg-slate-100/80 italic text-slate-400 select-none dark:bg-slate-900/60"
                                      : isMine
                                        ? "rounded-br-md bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white"
                                        : "rounded-bl-md bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                  }`}
                                >
                                  <div className="flex items-baseline gap-1.5">
                                    {message.isDeleted && <Ban size={13} className="mr-0.5 inline shrink-0 opacity-60" />}
                                    <p className="whitespace-pre-line break-words">{message.text}</p>
                                    {message.isEdited && !message.isDeleted && (
                                      <span className={`ml-1 text-[9px] italic ${isMine ? "text-white/80" : "text-slate-400"}`}>(edited)</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Hover Floating Actions Menu */}
                              {isMine && !message.isDeleted && !isEditingThis && (
                                <div className="absolute -left-16 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-1 rounded-xl border border-[var(--ucsh-border)] bg-white p-1 shadow-md group-hover:flex dark:bg-slate-900">
                                  <button type="button" onClick={() => startEditing(message)} title="Edit" className="rounded-lg p-1 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/50"><Edit2 size={13} /></button>
                                  <button type="button" onClick={() => requestDeleteMessage(message._id)} disabled={actionLoadingId === message._id} title="Delete" className="rounded-lg p-1 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"><Trash2 size={13} /></button>
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
                      <div className="rounded-2xl rounded-br-md bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] px-4 py-3 text-white shadow-sm">
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
              </div>

              <footer className="shrink-0 border-t border-[var(--ucsh-border)] bg-white/85 p-2.5 backdrop-blur-xl dark:bg-slate-950/85 sm:p-3">
                {isChatRestricted ? (
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-black text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                    <ShieldAlert size={16} className="shrink-0" />
                    <span>Only Administrators can initiate or reply to messages in this channel.</span>
                  </div>
                ) : (
                  <div className="flex items-end gap-2 rounded-2xl border border-[var(--ucsh-border)] bg-white/80 p-1.5 shadow-sm dark:bg-slate-900/80">
                    <textarea
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      rows={1}
                      placeholder="Type a message..."
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm font-bold text-[var(--ucsh-text)] outline-none placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={!text.trim() || sending}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                )}
              </footer>
            </>
          ) : (
            <div className="grid h-full place-items-center p-6 text-center">
              <div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 text-[var(--ucsh-primary-dark)] shadow-md dark:bg-slate-900">
                  <MessageCircle size={34} />
                </div>

                <h2 className="mt-4 text-xl font-black text-[var(--ucsh-text)]">
                  Select a conversation
                </h2>

                <p className="mt-1 text-sm font-bold text-[var(--ucsh-muted)]">
                  Choose an alumni to start chatting.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Modern Dialog Box Overlay */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--ucsh-border)] bg-white p-6 shadow-2xl dark:bg-slate-900 scale-100 transition-all">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                dialog.type === 'confirm' 
                  ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400' 
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
              }`}>
                {dialog.type === 'confirm' ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--ucsh-text)]">{dialog.title}</h3>
                <p className="mt-1 text-xs font-bold leading-relaxed text-[var(--ucsh-muted)]">{dialog.description}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {dialog.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (dialog.onConfirm) dialog.onConfirm();
                  else setDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className={`rounded-xl px-4 py-2 text-xs font-black text-white shadow-sm transition hover:scale-105 ${
                  dialog.type === 'confirm' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)]'
                }`}
              >
                {dialog.type === 'confirm' ? 'Delete' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}