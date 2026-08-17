// file: app/profile/[id]/page.tsx
"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FaBriefcase,
  FaComment,
  FaDiscord,
  FaDribbble,
  FaEllipsis,
  FaEnvelope,
  FaFacebook,
  FaGithub,
  FaGlobe,
  FaGraduationCap,
  FaInstagram,
  FaLinkedin,
  FaLocationDot,
  FaMedium,
  FaPaperPlane,
  FaPen,
  FaPhone,
  FaPinterest,
  FaReddit,
  FaSnapchat,
  FaTiktok,
  FaTrash,
  FaTumblr,
  FaTwitch,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
  FaTelegram,
  FaThumbsUp,
} from "react-icons/fa6";
import { SiBehance, SiLine, SiThreads, SiViber } from "react-icons/si";

type Lang = "en" | "mm";
type TabKey = "posts" | "about" | "experience" | "social";

type Experience = {
  company?: string;
  position?: string;
  employmentType?: string;
  location?: string;
  phone?: string;
  email?: string;
  salary?: string;
  website?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  experienceYear?: string;
};

type SocialItem = {
  key: string;
  label: string;
  value: string;
  displayValue: string;
  href: string;
  icon: React.ReactNode;
};

const text = {
  en: {
    unknownAlumni: "Unknown Alumni",
    classOf: "Class of",
    editProfile: "Edit Profile",
    about: "About",
    noBio: "No bio added yet.",
    contactInfo: "Contact Info",
    workExperience: "Experience",
    noWorkExperience: "No work experience added yet.",
    socialLinks: "Social Media Links",
    noSocialLinks: "No social media links added yet.",
    phone: "Phone",
    email: "Email",
    sendEmail: "Mail",
    callPhone: "Call",
    notProvided: "Not provided",
    current: "Current",
    unknown: "Unknown",
    editPost: "Edit Post",
    deletePost: "Delete Post",
    like: "Like",
    comment: "Comment",
    readMore: "Read more",
    showLess: "Show less",
    companyContact: "Company Contact",
    writeComment: "Write a comment...",
    employmentType: "Type",
    location: "Location",
    salary: "Salary",
    experienceYear: "Experience Year",
    website: "Website",
    noPosts: "No posts yet.",
    professionalInfo: "Professional Info",
    address: "Address",
    company: "Company",
    position: "Position",
    degree: "Degree",
    tabs: {
      posts: "Posts",
      about: "About & Contact",
      experience: "Experience",
      social: "Social Media",
    },
  },
  mm: {
    unknownAlumni: "အမည်မသိ ကျောင်းသားဟောင်း",
    classOf: "ဘွဲ့ရနှစ်",
    editProfile: "ပရိုဖိုင် ပြင်မည်",
    about: "အကြောင်းအရာ",
    noBio: "Bio မထည့်ရသေးပါ။",
    contactInfo: "ဆက်သွယ်ရန် အချက်အလက်",
    workExperience: "လုပ်ငန်းအတွေ့အကြုံ",
    noWorkExperience: "လုပ်ငန်းအတွေ့အကြုံ မထည့်ရသေးပါ။",
    socialLinks: "လူမှုကွန်ရက်များ",
    noSocialLinks: "လူမှုကွန်ရက် မထည့်ရသေးပါ။",
    phone: "ဖုန်း",
    email: "အီးမေးလ်",
    sendEmail: "Mail",
    callPhone: "ဖုန်းခေါ်မည်",
    notProvided: "မထည့်ရသေးပါ",
    current: "လက်ရှိ",
    unknown: "မသိရှိပါ",
    editPost: "ပို့စ်ပြင်ဆင်ရန်",
    deletePost: "ပို့စ်ဖျက်ရန်",
    like: "သဘောကျတယ်",
    comment: "မှတ်ချက်",
    readMore: "ဆက်ဖတ်ရန်",
    showLess: "အကျဉ်းချုံ့မည်",
    companyContact: "ကုမ္ပဏီ ဆက်သွယ်ရန်",
    writeComment: "မှတ်ချက်ပေးရန်...",
    employmentType: "အမျိုးအစား",
    location: "တည်နေရာ",
    salary: "လစာ",
    experienceYear: "လုပ်သက် အတွေ့အကြုံ",
    website: "Website",
    noPosts: "ပို့စ်မရှိသေးပါ။",
    professionalInfo: "လုပ်ငန်းဆိုင်ရာ အချက်အလက်",
    address: "လိပ်စာ",
    company: "ကုမ္ပဏီ",
    position: "ရာထူး",
    degree: "ဘွဲ့",
    tabs: {
      posts: "ပို့စ်များ",
      about: "ကိုယ်ရေးအကျဉ်းနှင့် ဆက်သွယ်ရန်",
      experience: "အတွေ့အကြုံ",
      social: "လူမှုကွန်ရက်",
    },
  },
};

const socialOrder = [
  "facebook",
  "telegram",
  "instagram",
  "youtube",
  "linkedin",
  "github",
  "tiktok",
  "viber",
  "line",
  "x",
  "twitter",
  "whatsapp",
  "website",
  "portfolio",
  "threads",
  "discord",
  "medium",
  "behance",
  "dribbble",
  "pinterest",
  "reddit",
  "snapchat",
  "twitch",
  "tumblr",
];

const socialIcons: Record<string, React.ReactNode> = {
  facebook: <FaFacebook />,
  telegram: <FaTelegram />,
  instagram: <FaInstagram />,
  youtube: <FaYoutube />,
  linkedin: <FaLinkedin />,
  github: <FaGithub />,
  tiktok: <FaTiktok />,
  line: <SiLine />,
  viber: <SiViber />,
  whatsapp: <FaWhatsapp />,
  x: <FaXTwitter />,
  twitter: <FaXTwitter />,
  website: <FaGlobe />,
  portfolio: <FaGlobe />,
  threads: <SiThreads />,
  discord: <FaDiscord />,
  medium: <FaMedium />,
  behance: <SiBehance />,
  dribbble: <FaDribbble />,
  pinterest: <FaPinterest />,
  reddit: <FaReddit />,
  snapchat: <FaSnapchat />,
  twitch: <FaTwitch />,
  tumblr: <FaTumblr />,
};

const socialPrefixes: Record<string, string> = {
  facebook: "https://facebook.com/",
  telegram: "https://t.me/",
  instagram: "https://instagram.com/",
  youtube: "https://youtube.com/@",
  linkedin: "https://linkedin.com/in/",
  github: "https://github.com/",
  tiktok: "https://tiktok.com/@",
  line: "https://line.me/R/ti/p/@",
  viber: "viber://chat?number=",
  whatsapp: "https://wa.me/",
  x: "https://x.com/",
  twitter: "https://twitter.com/",
  threads: "https://threads.net/@",
  discord: "https://discord.com/users/",
  medium: "https://medium.com/@",
  behance: "https://behance.net/",
  dribbble: "https://dribbble.com/",
  pinterest: "https://pinterest.com/",
  reddit: "https://reddit.com/user/",
  snapchat: "https://snapchat.com/add/",
  twitch: "https://twitch.tv/",
  tumblr: "https://tumblr.com/",
};

export default function ProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const [profileData, setProfileData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePostComments, setActivePostComments] = useState<
    Record<string, boolean>
  >({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;

    async function fetchProfile() {
      try {
        setLoading(true);

        const [userRes, postsRes] = await Promise.all([
          fetch(`/api/users/${id}`, { cache: "no-store" }),
          fetch(`/api/posts?authorId=${id}`, { cache: "no-store" }),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setProfileData(userData);
        }

        if (postsRes.ok) {
          const postsData = await postsRes.json();

          const list = Array.isArray(postsData)
            ? postsData
            : Array.isArray(postsData.posts)
              ? postsData.posts
              : [];

          const onlyThisUserPosts = list.filter((post: any) => {
            const authorId =
              post.author?._id ||
              post.author?.id ||
              post.authorId ||
              post.user?._id ||
              post.userId;

            return String(authorId) === String(id);
          });

          setPosts(onlyThisUserPosts);
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [id]);

  const lang: Lang = profileData?.languagePreference === "mm" ? "mm" : "en";
  const t = text[lang];

  const isOwnProfile =
    profileData &&
    (String(profileData?._id) === String(id) ||
      String(profileData?.id) === String(id));

  const experiences: Experience[] = Array.isArray(profileData?.experiences)
    ? profileData.experiences
    : [];

  const profileImage = getUserImage(profileData);
  const socialItems = useMemo(() => getSocialItems(profileData), [profileData]);

  async function handleLikeToggle(postId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "PATCH" });
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
      console.error("Like error:", error);
    }
  }

  async function handleCommentSubmit(postId: string) {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) return;

      const newComment = await res.json();

      setPosts((prev) =>
        prev.map((post) => {
          if (post._id !== postId) return post;

          const comments = Array.isArray(post.comments) ? post.comments : [];

          return {
            ...post,
            comments: [
              ...comments,
              {
                ...newComment,
                _id: newComment._id || String(Date.now()),
                content: newComment.content || content,
                createdAt: newComment.createdAt || new Date().toISOString(),
                author: newComment.author || {
                  name: "You",
                  image: profileImage,
                },
              },
            ],
            commentsCount: (post.commentsCount || comments.length) + 1,
          };
        }),
      );

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Comment error:", error);
    }
  }

  if (loading) {
    return (
      <main className="mm page-wrapper relative grid min-h-screen place-items-center text-[var(--ucsh-text)]">
        <BackgroundDecor />
        <div className="relative z-10 h-10 w-10 animate-spin rounded-full border-4 border-[var(--ucsh-primary)] border-t-transparent" />
      </main>
    );
  }

  if (!profileData) {
    return (
      <main className="mm page-wrapper relative grid min-h-screen place-items-center px-4 text-center text-sm font-bold text-[var(--ucsh-muted)]">
        <BackgroundDecor />
        <div className="ucsh-card relative z-10 p-8">Profile missing or unavailable.</div>
      </main>
    );
  }

  return (
    <main className="mm page-wrapper relative overflow-hidden text-[var(--ucsh-text)]">
      <BackgroundDecor />

      <section className="ucsh-container relative z-10 max-w-5xl space-y-5">
        <header className="ucsh-card ucsh-animate overflow-hidden p-0">
          <div className="relative h-32 bg-gradient-to-r from-[var(--ucsh-primary)] via-[var(--ucsh-secondary)] to-[var(--ucsh-accent)] sm:h-44">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_36%)]" />
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/25 blur-3xl" />
          </div>

          <div className="relative px-4 pb-4 sm:px-6">
            <div className="-mt-12 flex flex-col gap-4 border-b border-[var(--ucsh-border)] pb-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:text-left">
                <Image
                  src={profileImage}
                  alt={profileData.name || t.unknownAlumni}
                  width={132}
                  height={132}
                  priority
                  className="h-24 w-24 rounded-[var(--ucsh-radius-xl)] border-4 border-white bg-white object-cover shadow-[var(--ucsh-shadow-md)] sm:h-32 sm:w-32"
                />

                <div className="pb-1">
                  <h1 className="break-words text-xl font-black tracking-tight text-[var(--ucsh-text)] sm:text-2xl">
                    {profileData.name || t.unknownAlumni}
                  </h1>

                  <p className="break-all text-xs font-bold text-[var(--ucsh-muted)]">
                    {profileData.email}
                  </p>

                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {(profileData.degree || profileData.department) && (
                      <Badge
                        icon={<FaGraduationCap />}
                        text={profileData.degree || profileData.department}
                      />
                    )}

                    {profileData.graduatedYear && (
                      <Badge text={`${t.classOf} ${profileData.graduatedYear}`} />
                    )}

                    <Badge text={`${posts.length} ${t.tabs.posts}`} />

                    {socialItems.length > 0 && (
                      <Badge text={`${socialItems.length} ${t.tabs.social}`} />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                <ActionLink
                  icon={<FaEnvelope />}
                  label={t.sendEmail}
                  href={
                    profileData.contactInfo?.email
                      ? `mailto:${profileData.contactInfo.email}`
                      : profileData.email
                        ? `mailto:${profileData.email}`
                        : ""
                  }
                  primary
                />

                <ActionLink
                  icon={<FaPhone />}
                  label={t.callPhone}
                  href={
                    profileData.contactInfo?.phone
                      ? `tel:${profileData.contactInfo.phone}`
                      : ""
                  }
                />

                {isOwnProfile && (
                  <Link href="/settings" className="ucsh-btn px-4 py-2 text-xs">
                    <FaPen className="text-[11px]" />
                    {t.editProfile}
                  </Link>
                )}
              </div>
            </div>

            <div className="no-scrollbar mt-4 flex items-center gap-2 overflow-x-auto">
              {(["posts", "about", "experience", "social"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap rounded-[var(--ucsh-radius-md)] px-4 py-2 text-xs font-black transition ${
                      activeTab === tab
                        ? "bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-md"
                        : "bg-white/65 text-[var(--ucsh-primary-dark)] ring-1 ring-cyan-200 hover:bg-white dark:bg-slate-950/70 dark:ring-slate-700"
                    }`}
                  >
                    {t.tabs[tab]}
                  </button>
                ),
              )}
            </div>
          </div>
        </header>

        {activeTab === "posts" && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <EmptyCard text={t.noPosts} />
            ) : (
              posts.map((post) => (
                <article
                  key={post._id}
                  className="ucsh-card ucsh-animate overflow-hidden p-4 transition hover:shadow-[var(--ucsh-shadow-md)] sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Image
                        src={profileImage}
                        alt={profileData.name || "Profile"}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-2xl object-cover shadow-sm"
                      />

                      <div className="min-w-0">
                        <Link
                          href={`/profile/${profileData._id}`}
                          className="block truncate text-sm font-black text-[var(--ucsh-text)] hover:text-[var(--ucsh-primary-dark)]"
                        >
                          {profileData.name || t.unknownAlumni}
                        </Link>

                        <p className="text-[11px] font-bold text-[var(--ucsh-muted)]">
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                    </div>

                    {isOwnProfile && (
                      <div className="group relative">
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--ucsh-muted)] transition hover:bg-cyan-50 hover:text-[var(--ucsh-primary-dark)] dark:hover:bg-slate-800">
                          <FaEllipsis />
                        </button>

                        <div className="absolute right-0 top-9 z-20 hidden w-40 overflow-hidden rounded-2xl border border-[var(--ucsh-border)] bg-white shadow-xl group-hover:block dark:bg-slate-900">
                          <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-black text-slate-700 hover:bg-cyan-50 dark:text-slate-200 dark:hover:bg-slate-800">
                            <FaPen className="text-slate-400" />
                            {t.editPost}
                          </button>

                          <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                            <FaTrash className="text-red-400" />
                            {t.deletePost}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <PostContentBody content={post.content} t={t} />

                  {post.image && (
                    <div className="mt-4 overflow-hidden rounded-[var(--ucsh-radius-lg)] border border-[var(--ucsh-border)] bg-white/65 dark:bg-slate-950/70">
                      <img
                        src={post.image}
                        alt="Post attachment"
                        className="max-h-[520px] w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between px-1 text-[11px] font-bold text-[var(--ucsh-muted)]">
                    <span>{post.likes?.length || 0} Likes</span>
                    <span>
                      {post.comments?.length || post.commentsCount || 0} Comments
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--ucsh-border)] pt-3 text-xs font-black">
                    <button
                      onClick={() => handleLikeToggle(post._id)}
                      className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:hover:bg-slate-900 ${
                        post.likedByMe
                          ? "bg-cyan-100 text-[var(--ucsh-primary-dark)] dark:bg-cyan-950/40"
                          : "bg-white/65 text-slate-600 hover:text-[var(--ucsh-primary-dark)] dark:bg-slate-950/70 dark:text-slate-300"
                      }`}
                    >
                      <FaThumbsUp />
                      {t.like}
                    </button>

                    <button
                      onClick={() =>
                        setActivePostComments((prev) => ({
                          ...prev,
                          [post._id]: !prev[post._id],
                        }))
                      }
                      className="flex items-center justify-center gap-2 rounded-2xl bg-white/65 px-3 py-3 text-slate-600 transition hover:-translate-y-0.5 hover:bg-white hover:text-[var(--ucsh-primary-dark)] hover:shadow-md dark:bg-slate-950/70 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      <FaComment />
                      {t.comment}
                    </button>
                  </div>

                  {activePostComments[post._id] && (
                    <div className="mt-4 space-y-3 rounded-[var(--ucsh-radius-lg)] border border-[var(--ucsh-border)] bg-white/65 p-3 dark:bg-slate-950/70">
                      <div className="flex items-center gap-2">
                        <input
                          value={commentInputs[post._id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [post._id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCommentSubmit(post._id);
                          }}
                          placeholder={t.writeComment}
                          className="ucsh-input min-w-0 flex-1 text-xs font-bold"
                        />

                        <button
                          onClick={() => handleCommentSubmit(post._id)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                          <FaPaperPlane className="text-xs" />
                        </button>
                      </div>

                      <div className="max-h-64 space-y-3 overflow-y-auto">
                        {Array.isArray(post.comments) &&
                          post.comments.map((comment: any, index: number) => (
                            <div
                              key={comment._id || index}
                              className="flex items-start gap-3"
                            >
                              <Image
                                src={comment.author?.image || "/avatar.png"}
                                alt="Comment author"
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-xl object-cover shadow-sm"
                              />

                              <div className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
                                <p className="text-xs font-black text-[var(--ucsh-text)]">
                                  {comment.author?.name || "Alumni"}
                                </p>

                                <p className="mt-1 whitespace-pre-line break-words text-xs font-bold leading-5 text-slate-600 dark:text-slate-300">
                                  {comment.content || comment.text}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="grid gap-4 md:grid-cols-12">
            <div className="space-y-4 md:col-span-5">
              <Card title={t.contactInfo}>
                <div className="space-y-3">
                  <ContactLink
                    icon={<FaPhone />}
                    label={t.phone}
                    value={profileData.contactInfo?.phone}
                    href={
                      profileData.contactInfo?.phone
                        ? `tel:${profileData.contactInfo.phone}`
                        : ""
                    }
                    emptyText={t.notProvided}
                  />

                  <ContactLink
                    icon={<FaEnvelope />}
                    label={t.email}
                    value={profileData.contactInfo?.email || profileData.email}
                    href={
                      profileData.contactInfo?.email
                        ? `mailto:${profileData.contactInfo.email}`
                        : profileData.email
                          ? `mailto:${profileData.email}`
                          : ""
                    }
                    emptyText={t.notProvided}
                  />

                  <InfoBox
                    icon={<FaLocationDot />}
                    label={t.address}
                    value={profileData.contactInfo?.address}
                    emptyText={t.notProvided}
                  />
                </div>
              </Card>

              <Card title={t.about}>
                <p className="whitespace-pre-line break-words text-sm font-bold leading-7 text-slate-700 dark:text-slate-200">
                  {profileData.bio || t.noBio}
                </p>
              </Card>
            </div>

            <div className="space-y-4 md:col-span-7">
              <Card title={t.professionalInfo}>
                <div className="space-y-3">
                  <InfoBox
                    icon={<FaBriefcase />}
                    label={t.company}
                    value={profileData.contactInfo?.company}
                    emptyText={t.notProvided}
                  />

                  <InfoBox
                    icon={<FaBriefcase />}
                    label={t.position}
                    value={profileData.contactInfo?.position}
                    emptyText={t.notProvided}
                  />

                  <InfoBox
                    icon={<FaGraduationCap />}
                    label={t.degree}
                    value={profileData.degree || profileData.department}
                    emptyText={t.notProvided}
                  />
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "experience" && (
          <Card title={t.workExperience}>
            {experiences.length === 0 ? (
              <EmptyCard text={t.noWorkExperience} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {experiences.map((experience, index) => (
                  <ExperienceCard
                    key={index}
                    experience={experience}
                    index={index + 1}
                    t={t}
                  />
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === "social" && (
          <Card title={`${t.socialLinks} (${socialItems.length})`}>
            {socialItems.length === 0 ? (
              <EmptyCard text={t.noSocialLinks} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {socialItems.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                    className="group flex min-w-0 items-center gap-3 rounded-[var(--ucsh-radius-lg)] border border-[var(--ucsh-border)] bg-white/65 px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:text-[var(--ucsh-primary-dark)] hover:shadow-md dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-lg text-white shadow-md transition group-hover:scale-105">
                      {item.icon}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] uppercase tracking-widest text-[var(--ucsh-muted)]">
                        {item.label}
                      </span>

                      <span className="block truncate text-sm text-slate-800 dark:text-slate-200">
                        {item.displayValue}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </Card>
        )}
      </section>
    </main>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`ucsh-card ucsh-animate p-4 sm:p-5 ${className}`}>
      <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-[var(--ucsh-text)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-[var(--ucsh-radius-lg)] border border-dashed border-[var(--ucsh-border)] bg-white/55 p-6 text-center text-sm font-bold text-[var(--ucsh-muted)] dark:bg-slate-950/70">
      {text}
    </div>
  );
}

function PostContentBody({ content, t }: { content?: string; t: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  const shouldClamp = content.length > 420 || content.split("\n").length > 5;

  return (
    <div className="mt-4">
      <p
        className={`whitespace-pre-line break-words text-sm font-bold leading-7 text-slate-700 dark:text-slate-200 ${
          !isExpanded ? "line-clamp-5" : ""
        }`}
      >
        {content}
      </p>

      {shouldClamp && (
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-2 text-xs font-black text-[var(--ucsh-primary-dark)] hover:underline"
        >
          {isExpanded ? t.showLess : t.readMore}
        </button>
      )}
    </div>
  );
}

function ExperienceCard({
  experience,
  index,
  t,
}: {
  experience: Experience;
  index: number;
  t: any;
}) {
  const dateText = experience.isCurrent
    ? `${formatDate(experience.startDate, t)} - ${t.current}`
    : `${formatDate(experience.startDate, t)} - ${formatDate(
        experience.endDate,
        t,
      )}`;

  return (
    <article className="rounded-[var(--ucsh-radius-lg)] border border-[var(--ucsh-border)] bg-white/65 p-4 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-md dark:bg-slate-950/70 dark:hover:bg-slate-900">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-xs font-black text-white shadow-md">
          {index}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-black text-[var(--ucsh-text)]">
            {experience.position || t.notProvided}
          </h3>

          <p className="break-words text-xs font-bold text-[var(--ucsh-muted)]">
            {experience.company || t.notProvided}
          </p>

          <p className="mt-1 text-[11px] font-bold text-[var(--ucsh-muted)]">
            {dateText}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <MiniInfo
              label={t.experienceYear}
              value={experience.experienceYear || t.notProvided}
            />
            <MiniInfo
              label={t.employmentType}
              value={experience.employmentType || t.notProvided}
            />
            <MiniInfo label={t.location} value={experience.location || t.notProvided} />
            <MiniInfo label={t.salary} value={experience.salary || t.notProvided} />
          </div>

          <div className="mt-3 border-t border-[var(--ucsh-border)] pt-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[var(--ucsh-muted)]">
              {t.companyContact}
            </p>

            <div className="space-y-2">
              <MiniContact
                label={t.phone}
                value={experience.phone}
                href={experience.phone ? `tel:${experience.phone}` : ""}
                emptyText={t.notProvided}
              />
              <MiniContact
                label={t.email}
                value={experience.email}
                href={experience.email ? `mailto:${experience.email}` : ""}
                emptyText={t.notProvided}
              />
              <MiniContact
                label={t.website}
                value={experience.website}
                href={experience.website || ""}
                emptyText={t.notProvided}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--ucsh-border)] bg-white/70 p-3 dark:bg-slate-900/70">
      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--ucsh-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black text-slate-700 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}

function MiniContact({
  label,
  value,
  href,
  emptyText,
}: {
  label: string;
  value?: string | null;
  href: string;
  emptyText: string;
}) {
  if (!value || !href) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2 text-xs dark:bg-slate-900/70">
        <span className="font-black text-[var(--ucsh-muted)]">{label}</span>
        <span className="truncate font-bold text-[var(--ucsh-muted)]">
          {emptyText}
        </span>
      </div>
    );
  }

  return (
    <a
      href={normalizeUrl(href)}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2 text-xs transition hover:bg-white hover:shadow-sm dark:bg-slate-900/70"
    >
      <span className="font-black text-[var(--ucsh-muted)]">{label}</span>
      <span className="truncate font-black text-[var(--ucsh-primary-dark)]">
        {value}
      </span>
    </a>
  );
}

function InfoBox({
  icon,
  label,
  value,
  emptyText,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
  emptyText: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--ucsh-radius-lg)] border border-[var(--ucsh-border)] bg-white/65 p-3 shadow-sm dark:bg-slate-950/70">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-md">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--ucsh-muted)]">
          {label}
        </p>

        <p className="break-words text-xs font-black text-slate-700 dark:text-slate-200">
          {value || emptyText}
        </p>
      </div>
    </div>
  );
}

function ContactLink({
  icon,
  label,
  value,
  href,
  emptyText,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
  href: string;
  emptyText: string;
}) {
  if (!value || !href) {
    return <InfoBox icon={icon} label={label} value={value} emptyText={emptyText} />;
  }

  return (
    <a
      href={normalizeUrl(href)}
      className="flex items-center gap-3 rounded-[var(--ucsh-radius-lg)] border border-[var(--ucsh-border)] bg-white/65 p-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-slate-950/70 dark:hover:bg-slate-900"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-md">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--ucsh-muted)]">
          {label}
        </p>

        <p className="break-all text-xs font-black text-[var(--ucsh-primary-dark)]">
          {value}
        </p>
      </div>
    </a>
  );
}

function ActionLink({
  icon,
  label,
  href,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  primary?: boolean;
}) {
  if (!href) {
    return (
      <span className="inline-flex items-center justify-center gap-2 rounded-[var(--ucsh-radius-md)] bg-white/65 px-4 py-2 text-xs font-black text-[var(--ucsh-muted)] ring-1 ring-[var(--ucsh-border)]">
        {icon}
        {label}
      </span>
    );
  }

  if (primary) {
    return (
      <a href={href} className="ucsh-btn px-4 py-2 text-xs">
        {icon}
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      className="ucsh-btn-outline inline-flex items-center justify-center gap-2 rounded-[var(--ucsh-radius-md)] px-4 py-2 text-xs font-black"
    >
      {icon}
      {label}
    </a>
  );
}

function Badge({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-black text-[var(--ucsh-primary-dark)] ring-1 ring-cyan-200 dark:bg-cyan-950/40 dark:ring-cyan-900">
      {icon}
      <span className="break-words">{text}</span>
    </span>
  );
}

function getSocialItems(user: any): SocialItem[] {
  if (!user || typeof user !== "object") return [];

  const raw: Record<string, unknown> = {
    ...(user.socialLinks && typeof user.socialLinks === "object"
      ? user.socialLinks
      : {}),
    ...(user.contactInfo && typeof user.contactInfo === "object"
      ? {
          facebook: user.contactInfo.facebook,
          telegram: user.contactInfo.telegram,
          instagram: user.contactInfo.instagram,
          youtube: user.contactInfo.youtube,
          linkedin: user.contactInfo.linkedin,
          github: user.contactInfo.github,
          tiktok: user.contactInfo.tiktok,
          viber: user.contactInfo.viber,
          line: user.contactInfo.line,
          x: user.contactInfo.x || user.contactInfo.twitter,
          whatsapp: user.contactInfo.whatsapp,
          website: user.contactInfo.website,
        }
      : {}),
    facebook: user.socialLinks?.facebook || user.facebook,
    telegram: user.socialLinks?.telegram || user.telegram,
    instagram: user.socialLinks?.instagram || user.instagram,
    youtube: user.socialLinks?.youtube || user.youtube,
    linkedin: user.socialLinks?.linkedin || user.linkedin,
    github: user.socialLinks?.github || user.github,
    tiktok: user.socialLinks?.tiktok || user.tiktok,
    viber: user.socialLinks?.viber || user.viber,
    line: user.socialLinks?.line || user.line,
    x: user.socialLinks?.x || user.socialLinks?.twitter || user.x || user.twitter,
    whatsapp: user.socialLinks?.whatsapp || user.whatsapp,
    website: user.socialLinks?.website || user.website,
  };

  const used = new Set<string>();

  return socialOrder
    .map((key) => {
      const value = raw[key];

      if (typeof value !== "string") return null;

      const cleanValue = value.trim();

      if (!cleanValue) return null;

      const outputKey = key === "twitter" ? "x" : key;

      if (used.has(outputKey)) return null;

      used.add(outputKey);

      return {
        key: outputKey,
        label: formatSocialLabel(outputKey),
        value: cleanValue,
        displayValue: displaySocialValue(outputKey, cleanValue),
        href: socialUrl(outputKey, cleanValue),
        icon: socialIcons[outputKey] || <FaGlobe />,
      };
    })
    .filter(Boolean) as SocialItem[];
}

function getUserImage(user: any) {
  return user?.profileImage || user?.image || user?.googleImage || "/avatar.png";
}

function normalizeUrl(url: string) {
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("viber:")
  ) {
    return url;
  }

  return `https://${url}`;
}

function cleanUsername(value: string, key = "") {
  let cleaned = value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "")
    .replace(/^@/, "");

  const removers = [
    "facebook.com/",
    "t.me/",
    "telegram.me/",
    "instagram.com/",
    "youtube.com/@",
    "youtube.com/",
    "linkedin.com/in/",
    "linkedin.com/company/",
    "linkedin.com/",
    "github.com/",
    "tiktok.com/@",
    "tiktok.com/",
    "x.com/",
    "twitter.com/",
    "wa.me/",
    "line.me/R/ti/p/@",
    "viber://chat?number=",
    "threads.net/@",
    "medium.com/@",
    "behance.net/",
    "dribbble.com/",
    "pinterest.com/",
    "reddit.com/user/",
    "snapchat.com/add/",
    "twitch.tv/",
    "tumblr.com/",
  ];

  for (const remover of removers) {
    if (cleaned.toLowerCase().startsWith(remover.toLowerCase())) {
      cleaned = cleaned.slice(remover.length);
    }
  }

  if (key === "whatsapp" || key === "viber") {
    cleaned = cleaned.replace(/[^\d+]/g, "");
  }

  return cleaned;
}

function displaySocialValue(key: string, value: string) {
  const clean = cleanUsername(value, key);

  if (key === "website" || key === "portfolio") return value;
  if (key === "viber" || key === "whatsapp") return clean;

  return clean.startsWith("@") ? clean : `@${clean}`;
}

function socialUrl(key: string, value: string) {
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("viber:")
  ) {
    return value;
  }

  if (key === "website" || key === "portfolio") return normalizeUrl(value);

  const prefix = socialPrefixes[key];

  if (!prefix) return normalizeUrl(value);

  return `${prefix}${cleanUsername(value, key)}`;
}

function formatSocialLabel(key: string) {
  const custom: Record<string, string> = {
    x: "X / Twitter",
    github: "GitHub",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    tiktok: "TikTok",
    whatsapp: "WhatsApp",
  };

  if (custom[key]) return custom[key];

  return key
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string | undefined, t: any) {
  if (!value) return t.unknown;

  const [year, month] = value.split("-");

  if (!year || !month) return value;

  const date = new Date(Number(year), Number(month) - 1);

  return date.toLocaleDateString("en-US", {
    month: "short",
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