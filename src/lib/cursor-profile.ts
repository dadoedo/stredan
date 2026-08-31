import { unstable_cache } from "next/cache";
import { fetchCursorProfile } from "react-cursor-calendar/server";
import type { CursorProfile } from "react-cursor-calendar/server";

export type { CursorProfile };

export const CURSOR_HANDLE = "dadoeodo";

function totalTokens(profile: CursorProfile) {
  return profile.activityCounts.reduce((sum, day) => sum + day.count, 0);
}

function aggregates(profile: CursorProfile) {
  return {
    handle: profile.handle,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    joinedDate: profile.joinedDate,
    visibility: profile.visibility,
    viewedAs: profile.viewedAs,
    badges: profile.badges,
    links: profile.links,
    stats: profile.stats,
    topModels: profile.topModels,
    totalTokens: Math.round(totalTokens(profile)),
  };
}

async function upsertHandle(
  handle: string,
  patch: {
    displayName?: string;
    joinedDate?: string;
    lastTotalTokens?: bigint;
    lastCurrentStreak?: number;
    lastLongestStreak?: number;
    lastError?: string | null;
    increment?: boolean;
  },
) {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.cursorHandle.upsert({
      where: { handle },
      create: {
        handle,
        requestCount: patch.increment ? 1 : 0,
        displayName: patch.displayName ?? "",
        joinedDate: patch.joinedDate ?? "",
        lastTotalTokens: patch.lastTotalTokens ?? BigInt(0),
        lastCurrentStreak: patch.lastCurrentStreak ?? 0,
        lastLongestStreak: patch.lastLongestStreak ?? 0,
        lastError: patch.lastError ?? null,
      },
      update: {
        lastSeenAt: new Date(),
        ...(patch.increment ? { requestCount: { increment: 1 } } : {}),
        ...(patch.displayName != null ? { displayName: patch.displayName } : {}),
        ...(patch.joinedDate != null ? { joinedDate: patch.joinedDate } : {}),
        ...(patch.lastTotalTokens != null
          ? { lastTotalTokens: patch.lastTotalTokens }
          : {}),
        ...(patch.lastCurrentStreak != null
          ? { lastCurrentStreak: patch.lastCurrentStreak }
          : {}),
        ...(patch.lastLongestStreak != null
          ? { lastLongestStreak: patch.lastLongestStreak }
          : {}),
        ...(patch.lastError !== undefined ? { lastError: patch.lastError } : {}),
      },
    });
  } catch (error) {
    console.error("cursor handle log failed", error);
  }
}

async function recordSnapshot(profile: CursorProfile) {
  const tokens = BigInt(Math.round(totalTokens(profile)));
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.cursorProfileSnapshot.create({
      data: {
        handle: profile.handle,
        displayName: profile.displayName,
        joinedDate: profile.joinedDate,
        totalTokens: tokens,
        currentStreak: profile.stats.currentStreak,
        longestStreak: profile.stats.longestStreak,
        mostActiveMonth: profile.stats.mostActiveMonth,
        mostActiveDay: profile.stats.mostActiveDay,
        agentsLocal: profile.stats.agentsLocal,
        agentsCloud: profile.stats.agentsCloud,
        profile: JSON.parse(JSON.stringify(aggregates(profile))),
      },
    });
  } catch (error) {
    console.error("cursor profile snapshot failed", error);
  }
}

/** Count an API request. Does not write a scrape log. */
export async function logCursorProfileRequest(handle: string, error?: string) {
  await upsertHandle(handle, { increment: true, lastError: error ?? null });
}

async function loadCursorProfile(handle: string): Promise<CursorProfile> {
  const profile = await fetchCursorProfile(handle);
  const tokens = BigInt(Math.round(totalTokens(profile)));
  await Promise.all([
    recordSnapshot(profile),
    upsertHandle(profile.handle, {
      displayName: profile.displayName,
      joinedDate: profile.joinedDate,
      lastTotalTokens: tokens,
      lastCurrentStreak: profile.stats.currentStreak,
      lastLongestStreak: profile.stats.longestStreak,
      lastError: null,
    }),
  ]);
  return profile;
}

export const getCursorProfile = unstable_cache(
  loadCursorProfile,
  ["cursor-public-profile"],
  { revalidate: 3600 },
);
