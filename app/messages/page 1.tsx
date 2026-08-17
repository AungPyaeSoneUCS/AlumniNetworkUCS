// file: app/messages/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Search,
  Send,
  UserRound,
} from "lucide-react";

import { getPusherClient } from "@/lib/pusher-client";

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

function getConversationId(userA: string, userB: string) {
  return [userA, userB].sort().join("-");
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

  async function loadMe() {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (res.status === 401) return (window.location.href = "/login");
    setMe(await res.json());
  }

  async function loadUsers() {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.status === 401) return (window.location.href = "/login");

    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  }

  async function loadMessages(userId: string) {
    const res = await fetch(`/api/messages/${userId}`, { cache: "no-store" });
    if (res.status === 401) return (window.location.href = "/login");

    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadMe();
    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUser?._id) return;
    loadMessages(selectedUser._id);
  }, [selectedUser?._id]);

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

      if (!res.ok) setText(messageText);
    } finally {
      setSending(false);
    }
  }

  const filteredUsers = users
    .filter((user) => String(user._id) !== String(me?._id))
    .filter((user) =>
      [user.name, user.email, user.department]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <main className="mm fixed inset-x-0 bottom-0 top-[88px] overflow-hidden bg-[#94EFEE] px-3 py-4 text-slate-950 sm:px-5">
      <GradientBackground />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-2xl backdrop-blur-xl">
        <aside
          className={`h-full w-full shrink-0 bg-white/90 md:block md:w-[370px] md:border-r md:border-[#25C9C8]/20 ${
            selectedUser ? "hidden" : "block"
          }`}
        >
          <div className="border-b border-[#25C9C8]/20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-lg">
                <MessageCircle size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-black leading-tight">Messages</h1>
                <p className="text-xs font-bold text-slate-500">
                  Realtime alumni chats
                </p>
              </div>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#008B8B]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search alumni..."
                className="w-full rounded-2xl border border-[#25C9C8]/25 bg-[#F8FFFF] px-4 py-3 pl-12 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:bg-white focus:ring-4 focus:ring-[#00BFC4]/10"
              />
            </div>
          </div>

          <div className="h-[calc(100%-133px)] overflow-y-auto p-3">
            {filteredUsers.map((user) => {
              const active = selectedUser?._id === user._id;

              return (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(user);
                    setMessages([]);
                  }}
                  className={`mb-2 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-[#94EFEE]/30 hover:shadow-md ${
                    active ? "bg-[#94EFEE]/60 shadow-md" : "bg-transparent"
                  }`}
                >
                  <Image
                    src={user.image || "/avatar.png"}
                    alt={user.name || "Alumni"}
                    width={54}
                    height={54}
                    className="h-[54px] w-[54px] rounded-2xl object-cover shadow-sm"
                  />

                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-1 text-sm font-black text-slate-950">
                      {user.name || "Unknown Alumni"}
                    </h2>
                    <p className="line-clamp-1 text-xs font-bold text-slate-500">
                      {user.department || "Alumni"}
                      {user.graduatedYear ? ` • ${user.graduatedYear}` : ""}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section
          className={`h-full min-w-0 flex-1 flex-col ${
            selectedUser ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedUser ? (
            <>
              <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-[#25C9C8]/20 bg-white/95 px-3 shadow-sm sm:px-5">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F8FFFF] text-[#008B8B] shadow-sm md:hidden"
                >
                  <ArrowLeft size={20} />
                </button>

                <Image
                  src={selectedUser.image || "/avatar.png"}
                  alt={selectedUser.name || "Alumni"}
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] rounded-2xl object-cover shadow-md"
                />

                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-1 text-base font-black text-slate-950">
                    {selectedUser.name || "Alumni"}
                  </h2>
                  <p className="line-clamp-1 text-xs font-bold text-slate-500">
                    {selectedUser.department || "Alumni"}
                    {selectedUser.graduatedYear
                      ? ` • ${selectedUser.graduatedYear}`
                      : ""}
                  </p>
                </div>

                <Link
                  href={`/profile/${selectedUser._id}`}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-4 py-2 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  <UserRound size={17} />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </header>

              <div className="flex-1 overflow-y-auto bg-[#D9FFFF]/70 px-3 py-5 sm:px-5">
                <div className="min-h-full space-y-4">
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
                            src={message.sender?.image || "/avatar.png"}
                            alt={message.sender?.name || "Alumni"}
                            width={34}
                            height={34}
                            className="h-[34px] w-[34px] rounded-full object-cover"
                          />
                        )}

                        <div
                          className={`max-w-[76%] rounded-[1.4rem] px-4 py-3 text-sm font-bold leading-6 shadow-md sm:max-w-[58%] ${
                            isMine
                              ? "rounded-br-md bg-[#00A8A8] text-white"
                              : "rounded-bl-md bg-white text-slate-700"
                          }`}
                        >
                          <p className="whitespace-pre-line break-words">
                            {message.text}
                          </p>
                          <p
                            className={`mt-2 text-[10px] font-black ${
                              isMine ? "text-white/75" : "text-slate-400"
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>

                        {isMine && (
                          <Image
                            src={me?.image || "/avatar.png"}
                            alt={me?.name || "Me"}
                            width={34}
                            height={34}
                            className="h-[34px] w-[34px] rounded-full object-cover"
                          />
                        )}
                      </div>
                    );
                  })}

                  {sending && (
                    <div className="flex justify-end">
                      <div className="rounded-[1.4rem] rounded-br-md bg-[#00A8A8] px-4 py-3 text-white shadow-md">
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

              <footer className="shrink-0 border-t border-[#25C9C8]/20 bg-white/95 p-3 sm:p-4">
                <div className="flex items-end gap-2 rounded-[1.7rem] border border-[#25C9C8]/30 bg-[#F8FFFF] p-2 shadow-sm">
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
                    className="max-h-24 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-sm font-bold outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!text.trim() || sending}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="grid h-full place-items-center p-6 text-center">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-white/90 text-[#008B8B] shadow-xl">
                  <MessageCircle size={38} />
                </div>
                <h2 className="mt-5 text-2xl font-black">
                  Select a conversation
                </h2>
                <p className="mt-2 text-sm font-bold text-slate-500">
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

function formatTime(value?: string) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function GradientBackground() {
  return (
    <>
      <div className="absolute inset-0 -z-10 bg-[#F1FFFF]" />
      <div className="absolute left-0 top-0 -z-10 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-96 w-96 rounded-full bg-[#25C9C8]/40 blur-3xl" />
    </>
  );
}