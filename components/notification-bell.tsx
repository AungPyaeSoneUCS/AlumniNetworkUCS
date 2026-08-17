// file: components/notification-bell.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";

import { getPusherClient } from "@/lib/pusher-client";

type NotificationItem = {
  _id: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
};

export default function NotificationBell({ userId }: { userId?: string }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadNotifications() {
    try {
      setLoading(true);

      const res = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();

      setUnreadCount(data.unreadCount || 0);
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } finally {
      setLoading(false);
    }
  }

  async function markRead() {
    setUnreadCount(0);

    await fetch("/api/notifications", {
      method: "PATCH",
    });
  }

  async function deleteNotification(id: string, wasUnread: boolean) {
    try {
      setDeletingId(id);

      setItems((prev) => prev.filter((item) => item._id !== id));

      if (wasUnread) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        await loadNotifications();
      }
    } catch (error) {
      console.error("Delete notification failed:", error);
      await loadNotifications();
    } finally {
      setDeletingId(null);
    }
  }

  function toggleDropdown() {
    setOpen((value) => {
      const nextValue = !value;

      if (nextValue) {
        markRead();
      }

      return nextValue;
    });
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `notifications-${userId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("new-notification", (notification: NotificationItem) => {
      setUnreadCount((count) => count + 1);
      setItems((prev) => [notification, ...prev]);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [userId]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        aria-label="Open notifications"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#25C9C8]/30 bg-white/90 text-[#008B8B] shadow-sm transition hover:bg-white sm:h-11 sm:w-11 sm:rounded-2xl"
      >
        <Bell size={19} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/20 backdrop-blur-[1px] sm:hidden"
          />

          <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-14 sm:w-[360px]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div>
                <h3 className="text-base font-black text-slate-950">
                  Notifications
                </h3>
                <p className="mt-0.5 text-xs font-bold text-slate-400">
                  Latest updates and messages
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 sm:hidden"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-2 sm:max-h-96">
              {loading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse rounded-2xl bg-slate-100 p-4"
                    >
                      <div className="h-3 w-2/3 rounded-full bg-slate-200" />
                      <div className="mt-3 h-3 w-full rounded-full bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFFFFF] text-[#008B8B]">
                    <CheckCheck size={24} />
                  </div>

                  <p className="mt-4 text-sm font-black text-slate-800">
                    No notifications yet
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-400">
                    New notifications will appear here.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item._id}
                    className="group relative rounded-2xl transition hover:bg-[#F8FFFF]"
                  >
                    <Link
                      href={item.link || "/messages"}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 pr-12"
                    >
                      <div className="flex gap-3">
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFFFFF] text-[#008B8B]">
                          <Bell size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-black text-slate-900">
                            {item.title || "Notification"}
                          </p>

                          <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">
                            {item.body || "You have a new notification."}
                          </p>

                          {!item.read && (
                            <span className="mt-2 inline-flex rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-500">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        deleteNotification(item._id, !item.read);
                      }}
                      disabled={deletingId === item._id}
                      title="Delete notification"
                      aria-label="Delete notification"
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 opacity-100 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}