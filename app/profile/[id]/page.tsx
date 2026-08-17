// file: app/profile/[id]/page.tsx
"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FaArrowLeft,
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
    back: "Back",
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
    back: "နောက်သို့",
    tabs: {
      posts: "ပို့စ်များ",
      about: "ကိုယ်ရေးအကျဉ်းနှင့် ဆက်သွယ်ရန်",
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
  const router = useRouter();
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

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/feeds");
  }

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
      <main className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#25C9C8] border-t-transparent" />
      </main>
    );
  }

  if (!profileData) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 text-center text-base font-bold text-slate-500">
        Profile missing or unavailable.
      </main>
    );
  }

  return (
    <section className="min-h-screen p-0 text-slate-950 sm:p-4 md:p-8">
      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={handleBack}
          aria-label={t.back}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-[#25C9C8]/95 text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-[#25C9C8] hover:text-white active:scale-95"
        >
          <FaArrowLeft className="text-base" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-5xl space-y-0 sm:space-y-4">
        <header className="overflow-hidden rounded-none border-0 bg-white shadow-none sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-sm">
          <div className="relative h-28 bg-gradient-to-br from-[#00BFC4] via-[#77edec] to-[#339e9e] sm:h-36">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_35%)]" />
          </div>

          <div className="relative p-4 sm:px-6 sm:pb-4">
            <div className="-mt-16 flex flex-col gap-4 border-b border-slate-100 pb-4 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
                <Image
                  src={profileImage}
                  alt={profileData.name || t.unknownAlumni}
                  width={128}
                  height={128}
                  priority
                  className="h-28 w-28 rounded-full border-4 border-white bg-white object-cover shadow-sm sm:h-32 sm:w-32"
                />

                <div className="space-y-1">
                  <h1 className="break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    {profileData.name || t.unknownAlumni}
                  </h1>
                  <p className="break-all text-sm font-medium text-slate-500">
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
                      <Badge
                        text={`${t.classOf} ${profileData.graduatedYear}`}
                      />
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
                  icon={<FaEnvelope className="text-sm" />}
                  label={t.sendEmail}
                  href={
                    profileData.contactInfo?.email
                      ? `mailto:${profileData.contactInfo.email}`
                      : profileData.email
                        ? `mailto:${profileData.email}`
                        : ""
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#25C9C8] to-[#008B8B] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:scale-[1.02]"
                />

                <ActionLink
                  icon={<FaPhone className="text-sm" />}
                  label={t.callPhone}
                  href={
                    profileData.contactInfo?.phone
                      ? `tel:${profileData.contactInfo.phone}`
                      : ""
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#25C9C8] to-[#008B8B] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:scale-[1.02]"
                />
              </div>
            </div>

            <div className="no-scrollbar mt-2 flex items-center gap-2 overflow-x-auto pt-2">
              {(["posts", "about", "experience", "social"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                      activeTab === tab
                        ? "bg-[#25C9C8]/15 text-[#008B8B]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
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
          <div className="space-y-2 sm:space-y-4">
            {posts.length === 0 ? (
              <EmptyCard text={t.noPosts} />
            ) : (
              posts.map((post) => (
                <article
                  key={post._id}
                  className="rounded-none border-x-0 border-y border-slate-200 bg-white p-4 shadow-none transition hover:shadow-sm sm:rounded-2xl sm:border sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Image
                        src={profileImage}
                        alt={profileData.name || "Profile"}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/profile/${profileData._id}`}
                          className="block truncate text-base font-bold text-slate-950 hover:underline"
                        >
                          {profileData.name || t.unknownAlumni}
                        </Link>
                        <p className="text-xs font-medium text-slate-400">
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <PostContentBody content={post.content} t={t} />

                  {post.image && (
                    <div className="mt-3 -mx-4 overflow-hidden bg-slate-50 sm:mx-0 sm:rounded-xl sm:border sm:border-slate-100">
                      <img
                        src={post.image}
                        alt="Post attachment"
                        className="max-h-[520px] w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between px-1 text-xs font-medium text-slate-400">
                    <span>{post.likes?.length || 0} Likes</span>
                    <span>
                      {post.comments?.length || post.commentsCount || 0}{" "}
                      Comments
                    </span>
                  </div>

                  <div className="mt-2 flex border-t border-slate-100 pt-1 text-sm font-semibold text-slate-600">
                    <button
                      onClick={() => handleLikeToggle(post._id)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 transition hover:bg-slate-50 ${post.likedByMe ? "text-[#1877F2]" : ""}`}
                    >
                      <FaThumbsUp /> {t.like}
                    </button>
                    <button
                      onClick={() =>
                        setActivePostComments((prev) => ({
                          ...prev,
                          [post._id]: !prev[post._id],
                        }))
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 transition hover:bg-slate-50"
                    >
                      <FaComment /> {t.comment}
                    </button>
                  </div>

                  {activePostComments[post._id] && (
                    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
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
                            if (e.key === "Enter")
                              handleCommentSubmit(post._id);
                          }}
                          placeholder={t.writeComment}
                          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium outline-none transition focus:border-[#25C9C8] focus:bg-white"
                        />
                        <button
                          onClick={() => handleCommentSubmit(post._id)}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25C9C8] text-white transition hover:bg-[#008B8B]"
                        >
                          <FaPaperPlane className="text-sm" />
                        </button>
                      </div>

                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {Array.isArray(post.comments) &&
                          post.comments.map((comment: any, index: number) => (
                            <div
                              key={comment._id || index}
                              className="flex items-start gap-2.5"
                            >
                              <Image
                                src={comment.author?.image || "/avatar.png"}
                                alt="Comment author"
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <div className="max-w-full rounded-2xl bg-slate-50 px-3.5 py-2 text-sm">
                                <p className="font-bold text-slate-950">
                                  {comment.author?.name || "Alumni"}
                                </p>
                                <p className="mt-0.5 whitespace-pre-line break-words font-normal leading-relaxed text-slate-700">
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
                    label="Address"
                    value={profileData.contactInfo?.address}
                    emptyText={t.notProvided}
                  />
                </div>
              </Card>
            </div>

            <div className="space-y-4 md:col-span-7">
              <InfoBox
                icon={<FaGraduationCap />}
                label="Degree"
                value={profileData.degree || profileData.department}
                emptyText={t.notProvided}
              />
              <Card title={t.about}>
                <p className="whitespace-pre-line break-words text-sm font-normal leading-relaxed text-slate-700">
                  {profileData.bio || t.noBio}
                </p>
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
                    rel={
                      item.href.startsWith("http") ? "noreferrer" : undefined
                    }
                    className="group flex min-w-0 items-center gap-3.5 rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#25C9C8]/40 hover:bg-[#25C9C8]/10 hover:text-[#008B8B] hover:shadow-md"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E7F3FF] text-xl text-[#1877F2] shadow-sm transition group-hover:bg-[#25C9C8]/15 group-hover:text-[#008B8B]">
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs uppercase tracking-wide text-slate-400">
                        {item.label}
                      </span>
                      <span className="block truncate text-sm text-slate-800">
                        {item.displayValue}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </section>
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
    <section
      className={`rounded-none border-x-0 border-y border-slate-200 bg-white p-4 shadow-none sm:rounded-2xl sm:border sm:p-6 sm:shadow-sm ${className}`}
    >
      <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-slate-950">
        {title}
      </h2>
      {children}
    </section>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-none border-x-0 border-y border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm font-semibold text-slate-400 sm:rounded-2xl sm:border">
      {text}
    </div>
  );
}

function PostContentBody({ content, t }: { content?: string; t: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!content) return null;
  const shouldClamp = content.length > 420 || content.split("\n").length > 5;

  return (
    <div className="mt-3">
      <p
        className={`whitespace-pre-line break-words text-base font-normal leading-relaxed text-slate-800 ${!isExpanded ? "line-clamp-5" : ""}`}
      >
        {content}
      </p>
      {shouldClamp && (
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-1 text-sm font-bold text-[#1877F2] hover:underline"
        >
          {isExpanded ? "" : t.readMore}
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
    : `${formatDate(experience.startDate, t)} - ${formatDate(experience.endDate, t)}`;

  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-slate-200 hover:bg-white sm:p-5">
      <div className="flex gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F3FF] text-sm font-bold text-[#1877F2]">
          {index}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-base font-bold text-slate-950">
            {experience.position || t.notProvided}
          </h3>
          <p className="break-words text-sm font-semibold text-slate-500">
            {experience.company || t.notProvided}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
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
            <MiniInfo
              label={t.location}
              value={experience.location || t.notProvided}
            />
            <MiniInfo
              label={t.salary}
              value={experience.salary || t.notProvided}
            />
          </div>

          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
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
    <div className="rounded-xl bg-white p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-bold text-slate-700">
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
      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs">
        <span className="font-bold text-slate-400">{label}</span>
        <span className="font-medium text-slate-400">{emptyText}</span>
      </div>
    );
  }

  return (
    <a
      href={normalizeUrl(href)}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs transition hover:bg-slate-100"
    >
      <span className="font-bold text-slate-400">{label}</span>
      <span className="truncate font-bold text-[#1877F2]">{value}</span>
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
    <div className="flex items-center gap-3.5 rounded-none border-x-0 border-y border-slate-100 bg-slate-50 p-4 sm:rounded-2xl sm:border">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1877F2] shadow-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="break-words text-sm font-bold text-slate-700">
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
  if (!value || !href)
    return (
      <InfoBox icon={icon} label={label} value={value} emptyText={emptyText} />
    );

  return (
    <a
      href={normalizeUrl(href)}
      className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition hover:bg-slate-100"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1877F2] shadow-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="break-all text-sm font-bold text-[#1877F2]">{value}</p>
      </div>
    </a>
  );
}

function ActionLink({
  icon,
  label,
  href,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  className?: string;
}) {
  if (!href) {
    return (
      <button
        type="button"
        disabled
        className={`${className} cursor-not-allowed opacity-50`}
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <a href={href} className={className}>
      {icon}
      {label}
    </a>
  );
}

function Badge({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
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
    x:
      user.socialLinks?.x ||
      user.socialLinks?.twitter ||
      user.x ||
      user.twitter,
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
  return (
    user?.profileImage || user?.image || user?.googleImage || "/avatar.png"
  );
}

function normalizeUrl(url: string) {
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("viber:")
  )
    return url;
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

  if (key === "whatsapp" || key === "viber")
    cleaned = cleaned.replace(/[^\d+]/g, "");
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
  )
    return value;
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
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}