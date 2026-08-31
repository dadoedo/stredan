import { unstable_cache } from "next/cache";
import { fetchCursorProfile } from "react-cursor-calendar/server";
import type { CursorProfile } from "react-cursor-calendar/server";

export type { CursorProfile };

export const CURSOR_HANDLE = "dadoeodo";

function totalTokens(profile: CursorProfile) {
  return profile.activityCounts.reduce((sum, day) => sum + day.count, 0);
}

async function recordOwnSnapshot(profile: CursorProfile) {
  if (profile.handle !== CURSOR_HANDLE) return;
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.cursorProfileSnapshot.create({
      data: {
        handle: profile.handle,
        displayName: profile.displayName,
        joinedDate: profile.joinedDate,
        totalTokens: BigInt(Math.round(totalTokens(profile))),
        currentStreak: profile.stats.currentStreak,
        longestStreak: profile.stats.longestStreak,
        mostActiveMonth: profile.stats.mostActiveMonth,
        mostActiveDay: profile.stats.mostActiveDay,
        agentsLocal: profile.stats.agentsLocal,
        agentsCloud: profile.stats.agentsCloud,
        profile: JSON.parse(JSON.stringify(profile)),
      },
    });
  } catch (error) {
    console.error("cursor profile snapshot failed", error);
  }
}

async function loadCursorProfile(handle: string): Promise<CursorProfile> {
  const profile = await fetchCursorProfile(handle);
  await recordOwnSnapshot(profile);
  return profile;
}

export const getCursorProfile = unstable_cache(
  loadCursorProfile,
  ["cursor-public-profile"],
  { revalidate: 3600 },
);
