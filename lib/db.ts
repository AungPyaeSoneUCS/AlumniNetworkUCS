// file: lib/db.ts
import { prisma } from "./prisma";

export { prisma };

export function isValidId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0;
}

export function parseList<T = string>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string" && value.trim() !== "") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      // ignore
    }
  }
  return [];
}

export function serializeList(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value);
  return "[]";
}

export function serializeListIfNeeded(value: unknown): string {
  return serializeList(value);
}

export function toStringId(id: unknown): string {
  if (typeof id === "string") return id;
  if (id === null || id === undefined) return "";
  if (typeof id === "object" && id !== null && "_id" in id) {
    const v = (id as Record<string, unknown>)._id;
    return toStringId(v);
  }
  return String(id);
}

export async function getUsersByIds(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(isValidId)));
  if (unique.length === 0) return new Map<string, { id: string; name: string; image: string; email: string }>();
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true, image: true, email: true },
  });
  const map = new Map<string, { id: string; name: string; image: string; email: string }>();
  for (const u of users) map.set(u.id, u);
  return map;
}
