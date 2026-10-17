// file: lib/admin-collections.ts
//
// Single source of truth for the admin import / export / delete tools.
// Maps the canonical Prisma table names (also used as filenames, e.g.
// `users.json`) to their Prisma delegates. Both the canonical names and the
// raw MongoDB export filenames (e.g. `approvedstudents.json`) resolve here.

import { prisma } from "./prisma";

export const TABLE_DELEGATES: Record<string, any> = {
  approved_students: prisma.approvedStudent,
  contact_settings: prisma.contactSetting,
  experiences: prisma.experience,
  job_applications: prisma.jobApplication,
  jobs: prisma.job,
  message_reactions: prisma.messageReaction,
  messages: prisma.message,
  notifications: prisma.notification,
  otps: prisma.otp,
  post_comments: prisma.postComment,
  post_likes: prisma.postLike,
  posts: prisma.post,
  push_tokens: prisma.pushToken,
  settings: prisma.setting,
  students: prisma.student,
  users: prisma.user,
  vote_projects: prisma.voteProject,
  vote_users: prisma.voteUser,
};

export const COLLECTION_NAMES = Object.keys(TABLE_DELEGATES).sort();

// Matching ignores underscores and letter case so that `approvedstudents`,
// `approved_students` and `approvedStudents` all resolve to the same table.
const LOOKUP: Record<string, string> = {};
for (const name of Object.keys(TABLE_DELEGATES)) {
  LOOKUP[name.toLowerCase().replace(/_/g, "")] = name;
}

/**
 * Resolve a raw collection name (with or without a `.json` suffix) to the
 * canonical table name, or `null` when unknown.
 */
export function resolveCollectionName(rawName: string): string | null {
  const raw = (rawName || "").trim().replace(/\.json$/i, "");
  if (!raw) return null;
  return LOOKUP[raw.toLowerCase().replace(/_/g, "")] ?? null;
}

export function getDelegate(name: string) {
  return TABLE_DELEGATES[name] ?? null;
}
