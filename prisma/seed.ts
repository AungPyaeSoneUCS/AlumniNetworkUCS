/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

function readJson(name: string): any[] {
  const p = path.join(__dirname, "..", "backup_data", name);
  if (!fs.existsSync(p)) return [];
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  return Array.isArray(raw) ? raw : [];
}

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? undefined : d;
}

function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

async function clearTables() {
  await prisma.messageReaction.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.contactSetting.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.post.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.job.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.pushToken.deleteMany();
  await prisma.student.deleteMany();
  await prisma.approvedStudent.deleteMany();
  await prisma.voteProject.deleteMany();
  await prisma.voteUser.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers() {
  const docs = readJson("users.json");
  const seenEmail = new Set<string>();
  const users: any[] = [];
  const experiences: any[] = [];

  for (const u of docs) {
    if (!u?._id) continue;
    const email = str(u.email).trim().toLowerCase();
    if (!email) continue;
    if (seenEmail.has(email)) continue;
    seenEmail.add(email);

    const ci = u.contactInfo || {};
    const sl = u.socialLinks || {};

    users.push({
      id: u._id,
      name: str(u.name),
      email,
      password: u.password ? String(u.password) : undefined,
      role: str(u.role) || "user",
      position: str(u.position),
      isBlocked: Boolean(u.isBlocked),
      image: str(u.image),
      bio: str(u.bio),
      graduatedYear: str(u.graduatedYear),
      degree: str(u.degree),
      isVerified: Boolean(u.isVerified),
      fatherName: str(u.fatherName),
      contactPhone: str(ci.phone),
      contactEmail: str(ci.email),
      contactAddress: str(ci.address),
      contactCompany: str(ci.company),
      contactPosition: str(ci.position),
      socialFacebook: str(sl.facebook),
      socialTelegram: str(sl.telegram),
      socialInstagram: str(sl.instagram),
      socialYoutube: str(sl.youtube),
      socialLinkedin: str(sl.linkedin),
      socialGithub: str(sl.github),
      socialTiktok: str(sl.tiktok),
      socialViber: str(sl.viber),
      socialLine: str(sl.line),
      socialX: str(sl.x),
      socialTwitter: str(sl.twitter),
      socialWhatsapp: str(sl.whatsapp),
      socialWebsite: str(sl.website),
      isProfilePublic: u.isProfilePublic !== false,
      profileVisibility: str(u.profileVisibility) || "public",
      languagePreference: str(u.languagePreference) || "en",
      themePreference: str(u.themePreference) || "light",
      createdAt: toDate(u.createdAt),
      updatedAt: toDate(u.updatedAt),
    });

    if (Array.isArray(u.experiences)) {
      for (const e of u.experiences) {
        if (!e) continue;
        experiences.push({
          userId: u._id,
          company: str(e.company),
          position: str(e.position),
          employmentType: str(e.employmentType),
          location: str(e.location),
          phone: str(e.phone),
          email: str(e.email),
          salary: str(e.salary),
          website: str(e.website),
          startDate: str(e.startDate),
          endDate: str(e.endDate),
          isCurrent: Boolean(e.isCurrent),
          experienceYear: str(e.experienceYear),
        });
      }
    }
  }

  for (let i = 0; i < users.length; i += 500) {
    await prisma.user.createMany({ data: users.slice(i, i + 500) });
  }
  for (let i = 0; i < experiences.length; i += 500) {
    await prisma.experience.createMany({ data: experiences.slice(i, i + 500) });
  }
  console.log(`users: ${users.length}, experiences: ${experiences.length}`);
}

async function seedApprovedStudents() {
  const docs = readJson("approvedstudents.json");
  const rows = docs
    .filter((s) => s && s._id)
    .map((s) => ({
      id: s._id,
      name: str(s.name),
      fatherName: str(s.fatherName),
      graduatedYear: str(s.graduatedYear),
      approved: s.approved !== false,
      registered: Boolean(s.registered),
      createdAt: toDate(s.createdAt),
      updatedAt: toDate(s.updatedAt),
    }));

  const seen = new Set<string>();
  const unique = rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));

  for (let i = 0; i < unique.length; i += 500) {
    await prisma.approvedStudent.createMany({ data: unique.slice(i, i + 500) });
  }
  console.log(`approvedstudents: ${unique.length}`);
}

async function seedPosts() {
  const docs = readJson("posts.json");
  const posts: any[] = [];
  const likes: any[] = [];
  const comments: any[] = [];
  const seenPost = new Set<string>();
  const seenLike = new Set<string>();
  const seenComment = new Set<string>();

  for (const p of docs) {
    if (!p?._id) continue;
    if (seenPost.has(p._id)) continue;
    seenPost.add(p._id);

    const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];

    posts.push({
      id: p._id,
      author: str(p.author),
      content: str(p.content),
      category: str(p.category) || "General",
      image: str(p.image) || (images[0] || ""),
      images: JSON.stringify(images),
      isEdited: Boolean(p.isEdited),
      createdAt: toDate(p.createdAt),
      updatedAt: toDate(p.updatedAt),
    });

    if (Array.isArray(p.likes)) {
      for (const l of p.likes) {
        const uid = str(l);
        if (!uid) continue;
        const key = `${p._id}:${uid}`;
        if (seenLike.has(key)) continue;
        seenLike.add(key);
        likes.push({ postId: p._id, userId: uid });
      }
    }

    if (Array.isArray(p.comments)) {
      for (const c of p.comments) {
        if (!c) continue;
        const cid = str(c._id);
        const key = cid || `${p._id}:${c.author}:${c.content}:${c.createdAt}`;
        if (seenComment.has(key)) continue;
        seenComment.add(key);
        comments.push({
          id: cid || undefined,
          postId: p._id,
          authorId: str(c.author),
          content: str(c.content),
          createdAt: toDate(c.createdAt),
          updatedAt: toDate(c.updatedAt),
        });
      }
    }
  }

  for (let i = 0; i < posts.length; i += 500) {
    await prisma.post.createMany({ data: posts.slice(i, i + 500) });
  }
  for (let i = 0; i < likes.length; i += 500) {
    await prisma.postLike.createMany({ data: likes.slice(i, i + 500) });
  }
  for (let i = 0; i < comments.length; i += 500) {
    await prisma.postComment.createMany({ data: comments.slice(i, i + 500) });
  }
  console.log(`posts: ${posts.length}, likes: ${likes.length}, comments: ${comments.length}`);
}

async function seedMessages() {
  const docs = readJson("messages.json");
  const messages: any[] = [];

  for (const m of docs) {
    if (!m?._id) continue;
    messages.push({
      id: m._id,
      sender: str(m.sender),
      receiver: str(m.receiver),
      text: str(m.text),
      seen: Boolean(m.seen),
      isDeleted: Boolean(m.isDeleted),
      isEdited: Boolean(m.isEdited),
      deletedBy: str(m.deletedBy),
      createdAt: toDate(m.createdAt),
      updatedAt: toDate(m.updatedAt),
    });
  }

  for (let i = 0; i < messages.length; i += 500) {
    await prisma.message.createMany({ data: messages.slice(i, i + 500) });
  }
  console.log(`messages: ${messages.length}`);
}

async function seedNotifications() {
  const docs = readJson("notifications.json");
  const rows = docs
    .filter((n) => n && n._id)
    .map((n) => ({
      id: n._id,
      receiver: str(n.receiver),
      sender: n.sender ? str(n.sender) : null,
      type: str(n.type) || "message",
      title: str(n.title),
      body: str(n.body),
      link: str(n.link),
      read: Boolean(n.read),
      createdAt: toDate(n.createdAt),
      updatedAt: toDate(n.updatedAt),
    }));

  for (let i = 0; i < rows.length; i += 500) {
    await prisma.notification.createMany({ data: rows.slice(i, i + 500) });
  }
  console.log(`notifications: ${rows.length}`);
}

async function seedVoteUsers() {
  const docs = readJson("vote_users.json");
  const seen = new Set<string>();
  const rows: any[] = [];

  for (const v of docs) {
    if (!v?._id) continue;
    const email = str(v.email).trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    rows.push({
      id: v._id,
      name: str(v.name),
      email,
      password: v.password ? String(v.password) : "",
      role: str(v.role) || "VOTER",
      hasVoted: Boolean(v.hasVoted),
      votedProjectId: v.votedProjectId ? str(v.votedProjectId) : null,
      createdAt: toDate(v.createdAt),
      updatedAt: toDate(v.updatedAt),
    });
  }

  if (rows.length) await prisma.voteUser.createMany({ data: rows });
  console.log(`vote_users: ${rows.length}`);
}

async function seedContactSetting() {
  const docs = readJson("contactsettings.json");
  if (!docs.length) return;
  const c = docs[0];
  await prisma.contactSetting.create({
    data: {
      id: c._id ? String(c._id) : undefined,
      phone1: str(c.phone1),
      phone2: str(c.phone2),
      email: str(c.email),
      address: str(c.address),
      website: str(c.website),
      facebookUrl: str(c.facebookUrl),
      facebookName: str(c.facebookName),
      mapUrl: str(c.mapUrl),
      createdAt: toDate(c.createdAt),
      updatedAt: toDate(c.updatedAt),
    },
  });
  console.log("contactsettings: 1");
}

async function seedSettings() {
  const docs = readJson("settings.json");
  if (!docs.length) return;
  const s = docs[0];
  const startDate = str(s.startDate);
  const endDate = str(s.endDate);

  await prisma.setting.create({
    data: {
      id: s._id ? String(s._id) : undefined,
      key: "siteLogo",
      value: str(s.value),
      startDate,
      endDate,
      createdAt: toDate(s.createdAt),
      updatedAt: toDate(s.updatedAt),
    },
  });

  await prisma.setting.create({
    data: {
      key: "voteWindow",
      value: "",
      startDate,
      endDate,
      createdAt: toDate(s.createdAt),
      updatedAt: toDate(s.updatedAt),
    },
  });
  console.log("settings: 2 (siteLogo + voteWindow)");
}

async function main() {
  console.log("Clearing existing data...");
  await clearTables();

  await seedUsers();
  await seedApprovedStudents();
  await seedPosts();
  await seedMessages();
  await seedNotifications();
  await seedVoteUsers();
  await seedContactSetting();
  await seedSettings();

  const counts = {
    users: await prisma.user.count(),
    experiences: await prisma.experience.count(),
    approvedStudents: await prisma.approvedStudent.count(),
    posts: await prisma.post.count(),
    postLikes: await prisma.postLike.count(),
    postComments: await prisma.postComment.count(),
    messages: await prisma.message.count(),
    notifications: await prisma.notification.count(),
    voteUsers: await prisma.voteUser.count(),
    contactSettings: await prisma.contactSetting.count(),
    settings: await prisma.setting.count(),
  };

  console.log("\nSeed complete. Final counts:");
  console.log(counts);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Seed failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
