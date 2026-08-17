// file: app/feeds/page.tsx
"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  MessageCircle,
  MoreVertical,
  Search,
  Send,
  ThumbsUp,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { useI18n } from "@/components/providers";

type Category = "General" | "Job" | "Event" | "News";
type Lang = "en" | "mm";

type Comment = {
  _id: string;
  content: string;
  createdAt?: string;
  author: {
    _id: string;
    name: string;
    image?: string;
    department?: string;
    degree?: string;
    graduatedYear?: number | null;
  };
};

type Post = {
  _id: string;
  content: string;
  category: Category;
  image?: string;
  images?: string[];
  likes?: string[];
  likedByMe?: boolean;
  comments?: Comment[];
  commentsCount?: number;
  isEdited?: boolean;
  createdAt?: string;
  updatedAt?: string;
  author: {
    _id: string;
    name: string;
    email?: string;
    image?: string;
    department?: string;
    degree?: string;
    graduatedYear?: number | null;
  };
  isOwner?: boolean;
};

const categories: Category[] = ["General", "Job", "Event", "News"];

const text = {
  en: {
    searchPosts: "Search posts...",
    clear: "Clear",
    allAuthors: "All Alumni ",
    allCategories: "Categories",
    filters: "Filters",
    showing: "Showing",
    posts: "Posts",
    postSingular: "post",
    postPlural: "posts",
    on: "on",
    shareUpdate: "Share an update with alumni...",
    posting: "Posting...",
    post: "Post",
    cancel: "Cancel",
    loadingPosts: "Loading posts...",
    noPosts: "No posts found",
    noPostsText: "Create a post or try another filter.",
    editPost: "Edit Post",
    saving: "Saving...",
    saveChanges: "Save Changes",
    deleteConfirm: "Delete this post?",
    createFailed: "Failed to create post",
    updateFailed: "Failed to update post",
    deleteFailed: "Failed to delete post",
    commentFailed: "Failed to comment",
    edited: "Edited",
    alumni: "Alumni",
    unknownAlumni: "Unknown Alumni",
    edit: "Edit",
    delete: "Delete",
    showLess: "Show less",
    readMore: "Read more",
    like: "Like",
    liked: "Liked",
    comment: "Comment",
    comments: "Comments",
    writeComment: "Write a comment...",
    noComments: "No comments yet.",
    viewProfile: "View profile",
    clearSelectedDate: "Clear selected date",
    calendar: "Calendar",
    recentPosts: "Recent News",
    recentPostsText: "Top News posts this month",
    noRecentPosts: "No News posts this month.",
    all: "All",
  },
  mm: {
    searchPosts: "Post များ ရှာမည်...",
    clear: "ရှင်းမည်",
    allAuthors: " ကျောင်းသားဟောင်းအားလုံး",
    allCategories: "Category များ",
    filters: "Filter များ",
    showing: "ပြနေသည်",
    posts: "Posts",
    postSingular: "post",
    postPlural: "posts",
    on: "နေ့စွဲ",
    shareUpdate: "Alumni များအတွက် အကြောင်းအရာ ရေးပါ...",
    posting: "တင်နေသည်...",
    post: "တင်မည်",
    cancel: "မလုပ်တော့ပါ",
    loadingPosts: "Post များ ဖွင့်နေသည်...",
    noPosts: "Post မတွေ့ပါ",
    noPostsText: "Post အသစ်တင်ပါ သို့မဟုတ် filter ပြောင်းပါ။",
    editPost: "Post ပြင်မည်",
    saving: "သိမ်းနေသည်...",
    saveChanges: "သိမ်းမည်",
    deleteConfirm: "ဒီ post ကို ဖျက်မှာ သေချာပါသလား?",
    createFailed: "Post တင်၍မရပါ",
    updateFailed: "Post ပြင်၍မရပါ",
    deleteFailed: "Post ဖျက်၍မရပါ",
    commentFailed: "Comment ရေး၍မရပါ",
    edited: "ပြင်ထားသည်",
    alumni: "ကျောင်းသားဟောင်း",
    unknownAlumni: "အမည်မသိ ကျောင်းသားဟောင်း",
    edit: "ပြင်မည်",
    delete: "ဖျက်မည်",
    showLess: "အနည်းငယ်သာပြမည်",
    readMore: "ပိုမိုဖတ်ရှုရန်",
    like: "ကြိုက်သည်",
    liked: "ကြိုက်ပြီး",
    comment: "မှတ်ချက်",
    comments: "မှတ်ချက်များ",
    writeComment: "Comment ရေးပါ...",
    noComments: "Comment မရှိသေးပါ။",
    viewProfile: "Profile ကြည့်မည်",
    clearSelectedDate: "ရွေးထားသောနေ့စွဲ ရှင်းမည်",
    calendar: "ပြက္ခဒိန်",
    recentPosts: "လတ်တလော သတင်းများ",
    recentPostsText: "ဒီလအတွင်း News posts များ",
    noRecentPosts: "ဒီလအတွင်း News post မရှိသေးပါ။",
    all: "အားလုံး",
  },
};

const categoryText: Record<Lang, Record<Category | "All", string>> = {
  en: {
    All: "All",
    General: "General",
    Job: "Job",
    Event: "Event",
    News: "News",
  },
  mm: {
    All: "အားလုံး",
    General: "အထွေထွေ",
    Job: "အလုပ်အကိုင်",
    Event: "ပွဲအစီအစဉ်",
    News: "သတင်း",
  },
};

function getAlumniDegree(user?: { degree?: string; department?: string }) {
  return user?.degree || user?.department || "";
}

function toDateKey(value?: string | Date) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isWithinCurrentMonth(value?: string) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

export default function FeedsPage() {
  const { lang } = useI18n();
  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [activeRecentId, setActiveRecentId] = useState("");

  const [composerActive, setComposerActive] = useState(false);
  const [content, setContent] = useState("");
  const [postCategory, setPostCategory] = useState<Category>("General");

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("General");

  useEffect(() => {
    function handleSearchToggle() {
      document.getElementById("page-search")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    window.addEventListener("alumni-search-toggle", handleSearchToggle);

    return () => {
      window.removeEventListener("alumni-search-toggle", handleSearchToggle);
    };
  }, []);

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);

      try {
        const res = await fetch("/api/posts", {
          cache: "no-store",
        });

        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Load posts failed:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  const authors = useMemo(() => {
    const map = new Map<string, string>();

    posts.forEach((post) => {
      if (post.author?._id) {
        map.set(post.author._id, post.author.name || t.unknownAlumni);
      }
    });

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [posts, t.unknownAlumni]);

  const categoryCounts = useMemo(() => {
    const counts: Record<Category | "All", number> = {
      All: posts.length,
      General: 0,
      Job: 0,
      Event: 0,
      News: 0,
    };

    posts.forEach((post) => {
      if (categories.includes(post.category)) {
        counts[post.category] += 1;
      }
    });

    return counts;
  }, [posts]);

  const postedDateKeys = useMemo(() => {
    return new Set(
      posts
        .map((post) => toDateKey(post.createdAt))
        .filter((dateKey): dateKey is string => Boolean(dateKey)),
    );
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return posts.filter((post) => {
      const searchable = [
        post.content,
        post.category,
        post.author?.name,
        post.author?.email,
        post.author?.department,
        post.author?.degree,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = keyword ? searchable.includes(keyword) : true;
      const matchCategory = filterCategory
        ? post.category === filterCategory
        : true;
      const matchAuthor = filterAuthor
        ? post.author?._id === filterAuthor
        : true;
      const matchDate = selectedDate
        ? toDateKey(post.createdAt) === selectedDate
        : true;

      return matchSearch && matchCategory && matchAuthor && matchDate;
    });
  }, [posts, search, filterCategory, filterAuthor, selectedDate]);

  const recentPosts = useMemo(() => {
    return posts
      .filter(
        (post) =>
          post.category === "News" && isWithinCurrentMonth(post.createdAt),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
  }, [posts]);

  async function createPost() {
    if (!content.trim() || saving) return;

    setSaving(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          category: postCategory,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || t.createFailed);
        return;
      }

      const newPost = await res.json();

      setPosts((prev) => [newPost, ...prev]);
      setContent("");
      setPostCategory("General");
      setComposerActive(false);
    } catch (error) {
      console.error("Create post failed:", error);
      alert(t.createFailed);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(post: Post) {
    setEditingPost(post);
    setEditContent(post.content);
    setEditCategory(post.category || "General");
  }

  async function updatePost() {
    if (!editingPost || !editContent.trim() || saving) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/posts/${editingPost._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: editContent,
          category: editCategory,
          image: editingPost.image || "",
          images: editingPost.images || [],
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || t.updateFailed);
        return;
      }

      const updatedPost = await res.json();

      setPosts((prev) =>
        prev.map((post) => (post._id === updatedPost._id ? updatedPost : post)),
      );

      setEditingPost(null);
      setEditContent("");
      setEditCategory("General");
    } catch (error) {
      console.error("Update post failed:", error);
      alert(t.updateFailed);
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(postId: string) {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || t.deleteFailed);
        return;
      }

      setPosts((prev) => prev.filter((post) => post._id !== postId));
    } catch (error) {
      console.error("Delete post failed:", error);
      alert(t.deleteFailed);
    }
  }

  async function toggleLike(postId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "PATCH",
      });

      if (!res.ok) return;

      const data = await res.json();

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: data.likes || [],
                likedByMe: Boolean(data.liked),
              }
            : post,
        ),
      );
    } catch (error) {
      console.error("Like failed:", error);
    }
  }

  function updatePostComments(postId: string, comments: Comment[]) {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              comments,
              commentsCount: comments.length,
            }
          : post,
      ),
    );
  }

  function clearFilters() {
    setSearch("");
    setFilterCategory("");
    setFilterAuthor("");
    setSelectedDate("");
    setCalendarMonth(new Date());
    setActiveRecentId("");
  }

  function jumpToPost(post: Post) {
    setSearch("");
    setFilterCategory("");
    setFilterAuthor("");
    setSelectedDate("");
    setActiveRecentId(post._id);

    window.setTimeout(() => {
      document.getElementById(`post-${post._id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
  }

  function scrollFeedToTop() {
    const feed = document.getElementById("feeds-scroll-area");

    if (feed) {
      feed.scrollTo({ top: 0, behavior: "smooth" });
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const hasActiveFilter = Boolean(
    search || filterCategory || filterAuthor || selectedDate,
  );

  return (
    <main className="mm page-wrapper relative overflow-hidden text-[var(--ucsh-text)]">
      <BackgroundDecor />

      <section className="ucsh-container relative z-10 max-w-7xl lg:h-[calc(100vh-96px)] lg:overflow-hidden">
        <div className="grid gap-5 lg:h-full lg:grid-cols-[260px_minmax(0,1fr)_310px]">
          <aside
            id="page-search"
            className="scroll-mt-28 lg:h-full lg:overflow-hidden"
          >
            <FeedFilters
              search={search}
              filterAuthor={filterAuthor}
              filterCategory={filterCategory}
              authors={authors}
              categoryCounts={categoryCounts}
              filteredCount={filteredPosts.length}
              hasActiveFilter={hasActiveFilter}
              selectedDate={selectedDate}
              onSearchChange={setSearch}
              onAuthorChange={setFilterAuthor}
              onCategoryChange={setFilterCategory}
              onClear={clearFilters}
              t={t}
              currentLang={currentLang}
            />
          </aside>

          <div
            id="feeds-scroll-area"
            className="min-w-0 space-y-5 lg:h-full lg:overflow-y-auto lg:pr-2"
          >
            <PostComposer
              content={content}
              postCategory={postCategory}
              composerActive={composerActive}
              saving={saving}
              onContentChange={(value) => {
                setContent(value);
                setComposerActive(true);
              }}
              onFocus={() => setComposerActive(true)}
              onCategoryChange={setPostCategory}
              onCancel={() => setComposerActive(false)}
              onCreate={createPost}
              t={t}
              currentLang={currentLang}
            />

            {loading ? (
              <EmptyState text={t.loadingPosts} />
            ) : filteredPosts.length === 0 ? (
              <EmptyState text={t.noPosts} subText={t.noPostsText} />
            ) : (
              filteredPosts.map((post, index) => (
                <PostCard
                  key={post._id}
                  post={post}
                  index={index}
                  active={activeRecentId === post._id}
                  onEdit={startEdit}
                  onDelete={deletePost}
                  onLike={toggleLike}
                  onCommentsChange={updatePostComments}
                  t={t}
                  currentLang={currentLang}
                />
              ))
            )}
          </div>

          <aside className="flex flex-col gap-5 lg:h-full lg:overflow-hidden">
            <div className="shrink-0">
              <PostCalendar
                month={calendarMonth}
                selectedDate={selectedDate}
                postedDateKeys={postedDateKeys}
                onMonthChange={setCalendarMonth}
                onSelectDate={setSelectedDate}
                t={t}
                currentLang={currentLang}
              />
            </div>

            <div className="min-h-0 flex-1">
              <RecentPosts
                posts={recentPosts}
                onOpenPost={jumpToPost}
                t={t}
                currentLang={currentLang}
              />
            </div>
          </aside>
        </div>
      </section>

      <button
        type="button"
        onClick={scrollFeedToTop}
        aria-label="Back to top"
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
      >
        <ArrowUp size={20} />
      </button>

      {editingPost && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="ucsh-card w-full max-w-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-[var(--ucsh-text)]">
                {t.editPost}
              </h2>

              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <textarea
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                rows={6}
                className="ucsh-input resize-none text-sm font-bold leading-7"
              />

              <select
                value={editCategory}
                onChange={(event) =>
                  setEditCategory(event.target.value as Category)
                }
                className="ucsh-input text-sm font-bold"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {categoryText[currentLang][item]}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={updatePost}
                disabled={!editContent.trim() || saving}
                className="ucsh-btn w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? t.saving : t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function FeedFilters({
  search,
  filterAuthor,
  filterCategory,
  authors,
  categoryCounts,
  filteredCount,
  hasActiveFilter,
  selectedDate,
  onSearchChange,
  onAuthorChange,
  onCategoryChange,
  onClear,
  t,
  currentLang,
}: {
  search: string;
  filterAuthor: string;
  filterCategory: string;
  authors: Array<{ id: string; name: string }>;
  categoryCounts: Record<Category | "All", number>;
  filteredCount: number;
  hasActiveFilter: boolean;
  selectedDate: string;
  onSearchChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClear: () => void;
  t: (typeof text)[Lang];
  currentLang: Lang;
}) {
  return (
    <div className="ucsh-card ucsh-animate p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-black text-[var(--ucsh-text)]">
             {filteredCount} {t.posts} {t.showing}
          </h4>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-500 transition hover:bg-red-100"
          >
            {t.clear}
          </button>
        )}
      </div>

      <div className="relative">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t.searchPosts}
          className="ucsh-input h-12 pl-11 pr-4 text-sm font-bold"
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--ucsh-muted)]">
          <UserRound size={14} />
          {t.allAuthors}
        </label>

        <select
          value={filterAuthor}
          onChange={(event) => onAuthorChange(event.target.value)}
          className="ucsh-input h-12 text-sm font-bold"
        >
          <option value="">{t.allAuthors}</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-[var(--ucsh-muted)]">
          {t.allCategories}
        </p>

        <div className="space-y-2">
          <SideCategoryButton
            active={!filterCategory}
            label={categoryText[currentLang].All}
            count={categoryCounts.All}
            onClick={() => onCategoryChange("")}
          />

          {categories.map((category) => (
            <SideCategoryButton
              key={category}
              active={filterCategory === category}
              label={categoryText[currentLang][category]}
              count={categoryCounts[category]}
              onClick={() => onCategoryChange(category)}
            />
          ))}
        </div>
      </div>

      {selectedDate && (
        <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-3 text-xs font-black text-[var(--ucsh-primary-dark)] dark:border-cyan-900 dark:bg-cyan-950/30">
          {t.on} {selectedDate}
        </div>
      )}
    </div>
  );
}

function SideCategoryButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
        active
          ? "bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-md"
          : "bg-white/70 text-slate-700 ring-1 ring-cyan-100 hover:bg-white hover:text-[var(--ucsh-primary-dark)] dark:bg-slate-950/70 dark:text-slate-200 dark:ring-slate-800"
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] ${
          active
            ? "bg-white/20 text-white"
            : "bg-cyan-50 text-[var(--ucsh-primary-dark)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function PostComposer({
  content,
  postCategory,
  composerActive,
  saving,
  onContentChange,
  onFocus,
  onCategoryChange,
  onCancel,
  onCreate,
  t,
  currentLang,
}: {
  content: string;
  postCategory: Category;
  composerActive: boolean;
  saving: boolean;
  onContentChange: (value: string) => void;
  onFocus: () => void;
  onCategoryChange: (value: Category) => void;
  onCancel: () => void;
  onCreate: () => void;
  t: (typeof text)[Lang];
  currentLang: Lang;
}) {
  return (
    <div className="ucsh-card ucsh-animate p-4 sm:p-5">
      <textarea
        value={content}
        onFocus={onFocus}
        onChange={(event) => onContentChange(event.target.value)}
        rows={composerActive || content ? 5 : 1}
        placeholder={t.shareUpdate}
        className="ucsh-input resize-none text-sm font-bold leading-7"
      />

      {(composerActive || content) && (
        <div className="ucsh-animate mt-4 flex flex-col gap-3 sm:flex-row">
          <select
            value={postCategory}
            onChange={(event) =>
              onCategoryChange(event.target.value as Category)
            }
            className="ucsh-input text-sm font-bold sm:w-48"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {categoryText[currentLang][item]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onCreate}
            disabled={!content.trim() || saving}
            className="ucsh-btn flex-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={18} />
            {saving ? t.posting : t.post}
          </button>

          {!content && (
            <button
              type="button"
              onClick={onCancel}
              className="ucsh-btn-outline rounded-[var(--ucsh-radius-md)] px-5 py-3 text-sm font-black"
            >
              {t.cancel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PostCalendar({
  month,
  selectedDate,
  postedDateKeys,
  onMonthChange,
  onSelectDate,
  t,
  currentLang,
}: {
  month: Date;
  selectedDate: string;
  postedDateKeys: Set<string>;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: string) => void;
  t: (typeof text)[Lang];
  currentLang: Lang;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const startBlankCount = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: Array<number | null> = [
    ...Array.from({ length: startBlankCount }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function moveMonth(step: number) {
    onMonthChange(new Date(year, monthIndex + step, 1));
  }

  return (
    <div className="ucsh-card ucsh-animate p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-[var(--ucsh-primary-dark)]" />

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ucsh-muted)]">
              {t.calendar}
            </p>
            <h3 className="text-sm font-black text-[var(--ucsh-text)]">
              {month.toLocaleDateString(
                currentLang === "mm" ? "my-MM" : "en-US",
                {
                  month: "long",
                  year: "numeric",
                },
              )}
            </h3>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="rounded-xl bg-white p-2 text-[var(--ucsh-primary-dark)] shadow-sm transition hover:bg-cyan-50 dark:bg-slate-900"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="rounded-xl bg-white p-2 text-[var(--ucsh-primary-dark)] shadow-sm transition hover:bg-cyan-50 dark:bg-slate-900"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-[var(--ucsh-muted)]">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div key={`${day}-${index}`} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) {
            return <div key={`blank-${index}`} className="h-9" />;
          }

          const dateKey = toDateKey(new Date(year, monthIndex, day));
          const hasPost = postedDateKeys.has(dateKey);
          const active = selectedDate === dateKey;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(active ? "" : dateKey)}
              className={`relative flex h-9 items-center justify-center rounded-xl text-xs font-black transition ${
                active
                  ? "bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-md"
                  : hasPost
                    ? "bg-white text-slate-900 hover:bg-cyan-50 dark:bg-slate-900 dark:text-slate-100"
                    : "text-slate-400 hover:bg-white dark:hover:bg-slate-900"
              }`}
            >
              {day}

              {hasPost && (
                <span
                  className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                    active ? "bg-white" : "bg-green-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <button
          type="button"
          onClick={() => onSelectDate("")}
          className="ucsh-btn-outline mt-3 w-full rounded-[var(--ucsh-radius-md)] px-4 py-2 text-xs font-black"
        >
          {t.clearSelectedDate}
        </button>
      )}
    </div>
  );
}

function RecentPosts({
  posts,
  onOpenPost,
  t,
  currentLang,
}: {
  posts: Post[];
  onOpenPost: (post: Post) => void;
  t: (typeof text)[Lang];
  currentLang: Lang;
}) {
  return (
    <div className="ucsh-card ucsh-animate flex h-full flex-col p-4">
      <div className="mb-4 shrink-0">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ucsh-muted)]">
          {t.recentPosts}
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-2xl bg-white/70 p-4 text-sm font-bold text-[var(--ucsh-muted)] dark:bg-slate-950/70">
          {t.noRecentPosts}
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 space-y-3 max-h-[380px]">
          {posts.map((post) => (
            <button
              key={post._id}
              type="button"
              onClick={() => onOpenPost(post)}
              className="w-full rounded-2xl bg-white/75 p-3 text-left shadow-sm ring-1 ring-cyan-100 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-slate-950/70 dark:ring-slate-800"
            >
              <div className="flex gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-[var(--ucsh-text)]">
                      {post.author?.name || t.unknownAlumni}
                    </p>
                    <span className="shrink-0 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-black text-[var(--ucsh-primary-dark)]">
                      {categoryText[currentLang][post.category]}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-600 dark:text-slate-300">
                    {post.content}
                  </p>

                  <p className="mt-2 text-[11px] font-black text-[var(--ucsh-muted)]">
                    {formatDate(post.createdAt, currentLang)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  index,
  active,
  onEdit,
  onDelete,
  onLike,
  onCommentsChange,
  t,
  currentLang,
}: {
  post: Post;
  index: number;
  active: boolean;
  onEdit: (post: Post) => void;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onCommentsChange: (postId: string, comments: Comment[]) => void;
  t: (typeof text)[Lang];
  currentLang: Lang;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

  const [localComments, setLocalComments] = useState<Comment[]>(
    post.comments || [],
  );

  useEffect(() => {
    setLocalComments(post.comments || []);
  }, [post.comments]);

  const needsReadMore = post.content.length > 420;
  const liked = Boolean(post.likedByMe);
  const commentsCount = localComments.length || post.commentsCount || 0;
  const postImages =
    Array.isArray(post.images) && post.images.length > 0
      ? post.images
      : post.image
        ? [post.image]
        : [];

  async function submitComment() {
    if (!commentText.trim() || commenting) return;

    setCommenting(true);

    try {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: commentText,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || t.commentFailed);
        return;
      }

      const newComment = await res.json();
      const nextComments = [...localComments, newComment];

      setLocalComments(nextComments);
      onCommentsChange(post._id, nextComments);
      setCommentText("");
      setShowComments(true);
    } catch (error) {
      console.error("Comment failed:", error);
      alert(t.commentFailed);
    } finally {
      setCommenting(false);
    }
  }

  return (
    <article
      id={`post-${post._id}`}
      className={`ucsh-card ucsh-animate overflow-hidden p-0 scroll-mt-28 transition ${
        active ? "ring-4 ring-[var(--ucsh-primary)]/35" : ""
      }`}
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <div className="h-1.5 bg-gradient-to-r from-[var(--ucsh-primary)] via-[var(--ucsh-secondary)] to-[var(--ucsh-accent)]" />

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Link
            href={`/profile/${post.author?._id}`}
            title={t.viewProfile}
            className="shrink-0 transition hover:scale-105"
          >
            <Image
              src={post.author?.image || "/avatar.png"}
              alt={post.author?.name || t.alumni}
              width={52}
              height={52}
              className="h-[52px] w-[52px] rounded-2xl object-cover shadow-sm"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${post.author?._id}`}
              title={t.viewProfile}
              className="inline-flex max-w-full items-center gap-2"
            >
              <h2 className="break-words text-base font-black text-[var(--ucsh-text)] transition hover:text-[var(--ucsh-primary-dark)]">
                {post.author?.name || t.unknownAlumni}
              </h2>
            </Link>

            <p className="mt-0.5 line-clamp-1 text-xs font-bold text-[var(--ucsh-muted)]">
              {getAlumniDegree(post.author) || t.alumni}
              {post.author?.graduatedYear
                ? ` • ${post.author.graduatedYear}`
                : ""}
            </p>

            <p className="mt-0.5 text-xs font-bold text-[var(--ucsh-muted)]">
              {formatDate(post.createdAt, currentLang)}
              {post.isEdited ? ` • ${t.edited}` : ""}
            </p>
          </div>

          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-[var(--ucsh-primary-dark)] ring-1 ring-cyan-200 dark:bg-cyan-950/40 dark:ring-cyan-900">
            {categoryText[currentLang][post.category]}
          </span>

          {post.isOwner && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="rounded-xl p-2 text-[var(--ucsh-muted)] transition hover:bg-cyan-50 hover:text-[var(--ucsh-primary-dark)] dark:hover:bg-slate-800"
              >
                <MoreVertical size={18} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 z-20 w-36 overflow-hidden rounded-2xl border border-[var(--ucsh-border)] bg-white shadow-xl dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(post);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-black text-slate-700 hover:bg-cyan-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Edit size={15} />
                    {t.edit}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(post._id);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={15} />
                    {t.delete}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p
          className={`mt-5 whitespace-pre-line break-words text-sm font-bold leading-7 text-slate-700 dark:text-slate-200 sm:text-base ${
            expanded ? "" : "line-clamp-5"
          }`}
        >
          {post.content}
        </p>

        {needsReadMore && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-2 text-sm font-black text-[var(--ucsh-primary-dark)] hover:underline"
          >
            {expanded ? "" : t.readMore}
          </button>
        )}

        {postImages.length > 0 && (
          <div
            className={`mt-4 grid gap-2 ${postImages.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
          >
            {postImages.slice(0, 3).map((image, imageIndex) => (
              <Image
                key={`${image}-${imageIndex}`}
                src={image}
                alt="Post image"
                width={900}
                height={600}
                className={`w-full rounded-2xl object-cover shadow-sm ${
                  postImages.length === 1 ? "max-h-[420px]" : "h-52"
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[var(--ucsh-border)] pt-4">
          <ActionButton
            active={liked}
            icon={
              <ThumbsUp
                size={18}
                className={liked ? "fill-[#1877F2] text-[#1877F2]" : ""}
              />
            }
            label={`${post.likes?.length || 0} ${liked ? t.liked : t.like}`}
            onClick={() => onLike(post._id)}
          />

          <ActionButton
            active={showComments}
            icon={<MessageCircle size={18} />}
            label={`${commentsCount} ${commentsCount === 1 ? t.comment : t.comments}`}
            onClick={() => setShowComments((value) => !value)}
          />
        </div>

        {showComments && (
          <div className="mt-4 space-y-3 rounded-[var(--ucsh-radius-lg)] border border-[var(--ucsh-border)] bg-white/65 p-3 dark:bg-slate-950/70">
            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitComment();
                }}
                placeholder={t.writeComment}
                className="ucsh-input min-w-0 flex-1 text-sm font-bold"
              />

              <button
                type="button"
                onClick={submitComment}
                disabled={!commentText.trim() || commenting}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={17} />
              </button>
            </div>

            {localComments.length === 0 ? (
              <p className="px-2 text-sm font-bold text-[var(--ucsh-muted)]">
                {t.noComments}
              </p>
            ) : (
              <div className="space-y-3">
                {localComments.map((comment) => (
                  <div key={comment._id} className="flex items-start gap-3">
                    <Image
                      src={comment.author.image || "/avatar.png"}
                      alt={comment.author.name || t.alumni}
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-xl object-cover shadow-sm"
                    />

                    <div className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-[var(--ucsh-text)]">
                          {comment.author.name || t.unknownAlumni}
                        </p>

                        <span className="text-xs font-bold text-[var(--ucsh-muted)]">
                          {formatDate(comment.createdAt, currentLang)}
                        </span>
                      </div>

                      <p className="mt-1 whitespace-pre-line break-words text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-black transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:hover:bg-slate-900 ${
        active
          ? "bg-cyan-100 text-[var(--ucsh-primary-dark)] dark:bg-cyan-950/40"
          : "bg-white/65 text-slate-600 hover:text-[var(--ucsh-primary-dark)] dark:bg-slate-950/70 dark:text-slate-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({ text, subText }: { text: string; subText?: string }) {
  return (
    <div className="ucsh-card ucsh-animate p-8 text-center">
      <Filter className="mx-auto text-[var(--ucsh-primary-dark)]" size={34} />

      <h2 className="mt-4 text-xl font-black text-[var(--ucsh-text)]">
        {text}
      </h2>

      {subText && (
        <p className="mt-2 text-sm font-bold text-[var(--ucsh-muted)]">
          {subText}
        </p>
      )}
    </div>
  );
}

function formatDate(value?: string, lang: Lang = "en") {
  if (!value) return "";

  return new Date(value).toLocaleDateString(lang === "mm" ? "my-MM" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--ucsh-primary)]/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/25 blur-3xl" />
    </>
  );
}