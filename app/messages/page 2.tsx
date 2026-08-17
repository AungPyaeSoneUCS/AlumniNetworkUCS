// file: app/messages/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Search, Send, UserRound } from "lucide-react";

import { getPusherClient } from "@/lib/pusher-client";

type UserInfo = {
  _id: string;
  name?: string;
  email?: string;
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
  seen?: boolean;
  createdAt?: string;
  updatedAt?: string;
  sender: UserInfo;
  receiver: UserInfo;
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

function formatTime(value?: string) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
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

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const restoredSelectedUser = useRef(false);

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

    channel.bind("new-message", (newMessage: Message) => {
      setMessages((prev) => {
        const exists = prev.some((item) => item._id === newMessage._id);
        return exists ? prev : [...prev, newMessage];
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

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => String(user._id) !== String(me?._id))
      .filter((user) =>
        [user.name, user.email, user.department]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
  }, [users, me?._id, search]);

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
              <header className="flex h-[64px] shrink-0 items-center gap-2.5 border-b border-[var(--ucsh-border)] bg-white/85 px-2.5 backdrop-blur-xl dark:bg-slate-950/85 sm:h-[68px] sm:px-4">
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
                <div className="min-h-full space-y-3">
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

                  {messages.map((message) => {
                    const isMine =
                      String(message.sender?._id) === String(me?._id);

                    return (
                      <div
                        key={message._id}
                        className={`flex items-end gap-2 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isMine && (
                          <Image
                            src={getUserImage(message.sender)}
                            alt={message.sender?.name || "Alumni"}
                            width={30}
                            height={30}
                            className="h-[30px] w-[30px] rounded-full object-cover shadow-sm"
                          />
                        )}

                        <div
                          className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm font-bold leading-6 shadow-sm sm:max-w-[60%] ${
                            isMine
                              ? "rounded-br-md bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white"
                              : "rounded-bl-md bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          }`}
                        >
                          <p className="whitespace-pre-line break-words">
                            {message.text}
                          </p>

                          <p
                            className={`mt-1 text-[10px] font-black ${
                              isMine
                                ? "text-white/75"
                                : "text-[var(--ucsh-muted)]"
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>

                        {isMine && (
                          <Image
                            src={getUserImage(me)}
                            alt={me?.name || "Me"}
                            width={30}
                            height={30}
                            className="h-[30px] w-[30px] rounded-full object-cover shadow-sm"
                          />
                        )}
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
    </main>
  );
}