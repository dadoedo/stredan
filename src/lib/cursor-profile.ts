import { unstable_cache } from "next/cache";
import { fetchCursorProfile } from "react-cursor-calendar/server";
import type { CursorProfile } from "react-cursor-calendar/server";

export type { CursorProfile };

export const CURSOR_HANDLE = "dadoeodo";

async function loadCursorProfile(handle: string): Promise<CursorProfile> {
  return fetchCursorProfile(handle);
}

export const getCursorProfile = unstable_cache(
  loadCursorProfile,
  ["cursor-public-profile"],
  { revalidate: 3600 },
);
