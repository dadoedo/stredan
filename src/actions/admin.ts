"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, getAdminToken, verifyPassword } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { downloadFavicon } from "@/lib/favicon";

export async function login(formData: FormData) {
  const password = (formData.get("password") as string) ?? "";
  if (!verifyPassword(password)) {
    return { error: "Nesprávne heslo" };
  }
  const token = getAdminToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  redirect("/admin/projects");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function createProject(formData: FormData) {
  const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "-");
  const titleEn = (formData.get("titleEn") as string)?.trim();
  const titleSk = (formData.get("titleSk") as string)?.trim();
  const descriptionEn = (formData.get("descriptionEn") as string)?.trim() || null;
  const descriptionSk = (formData.get("descriptionSk") as string)?.trim() || null;
  const url = (formData.get("url") as string)?.trim() || null;
  const appStoreUrl = (formData.get("appStoreUrl") as string)?.trim() || null;
  const playStoreUrl = (formData.get("playStoreUrl") as string)?.trim() || null;
  const category = (formData.get("category") as string) || "personal";
  const year = parseInt((formData.get("year") as string) || "0", 10) || null;
  const featured = formData.get("featured") === "on";
  const visible = formData.get("visible") === "on";
  const sortOrder = parseInt((formData.get("sortOrder") as string) || "0", 10);
  const technologySlugs = (formData.get("technologies") as string)?.split(",").map((s) => s.trim()).filter(Boolean) || [];
  const integrationSlugs = (formData.get("integrations") as string)?.split(",").map((s) => s.trim()).filter(Boolean) || [];

  if (!slug || !titleEn || !titleSk) {
    return { error: "Slug, titleEn a titleSk sú povinné" };
  }

  const existing = await prisma.project.findUnique({ where: { slug } });
  if (existing) {
    return { error: "Projekt s týmto slugom už existuje" };
  }

  const technologies = await prisma.technology.findMany({
    where: { slug: { in: technologySlugs } },
  });
  const integrations = await prisma.integration.findMany({
    where: { slug: { in: integrationSlugs } },
  });

  await prisma.project.create({
    data: {
      slug,
      titleEn,
      titleSk,
      descriptionEn,
      descriptionSk,
      url,
      appStoreUrl,
      playStoreUrl,
      category,
      year,
      featured,
      visible,
      sortOrder,
      technologies: {
        create: technologies.map((t) => ({ technologyId: t.id })),
      },
      integrations: {
        create: integrations.map((i) => ({ integrationId: i.id })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function updateProject(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: "Chýba ID projektu" };

  const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "-");
  const titleEn = (formData.get("titleEn") as string)?.trim();
  const titleSk = (formData.get("titleSk") as string)?.trim();
  const descriptionEn = (formData.get("descriptionEn") as string)?.trim() || null;
  const descriptionSk = (formData.get("descriptionSk") as string)?.trim() || null;
  const url = (formData.get("url") as string)?.trim() || null;
  const appStoreUrl = (formData.get("appStoreUrl") as string)?.trim() || null;
  const playStoreUrl = (formData.get("playStoreUrl") as string)?.trim() || null;
  const category = (formData.get("category") as string) || "personal";
  const year = parseInt((formData.get("year") as string) || "0", 10) || null;
  const featured = formData.get("featured") === "on";
  const visible = formData.get("visible") === "on";
  const sortOrder = parseInt((formData.get("sortOrder") as string) || "0", 10);
  const technologySlugs = (formData.get("technologies") as string)?.split(",").map((s) => s.trim()).filter(Boolean) || [];
  const integrationSlugs = (formData.get("integrations") as string)?.split(",").map((s) => s.trim()).filter(Boolean) || [];

  if (!slug || !titleEn || !titleSk) {
    return { error: "Slug, titleEn a titleSk sú povinné" };
  }

  const existing = await prisma.project.findFirst({
    where: { slug, NOT: { id } },
  });
  if (existing) {
    return { error: "Projekt s týmto slugom už existuje" };
  }

  const technologies = await prisma.technology.findMany({
    where: { slug: { in: technologySlugs } },
  });
  const integrations = await prisma.integration.findMany({
    where: { slug: { in: integrationSlugs } },
  });

  await prisma.project.update({
    where: { id },
    data: {
      slug,
      titleEn,
      titleSk,
      descriptionEn,
      descriptionSk,
      url,
      appStoreUrl,
      playStoreUrl,
      category,
      year,
      featured,
      visible,
      sortOrder,
      technologies: {
        deleteMany: {},
        create: technologies.map((t) => ({ technologyId: t.id })),
      },
      integrations: {
        deleteMany: {},
        create: integrations.map((i) => ({ integrationId: i.id })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/projects");
  revalidatePath(`/projects/${slug}`);
  redirect("/admin/projects");
}

export async function deleteProject(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.project.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function fetchProjectLogo(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: "Chýba ID projektu" };

  const project = await prisma.project.findUnique({
    where: { id },
    select: { slug: true, url: true },
  });

  if (!project) return { error: "Projekt neexistuje" };
  if (!project.url) return { error: "Projekt nemá URL – logo sa nedá stiahnuť" };

  const logoPath = await downloadFavicon(project.url, project.slug);
  if (!logoPath) return { error: "Nepodarilo sa stiahnuť favicon" };

  await prisma.project.update({
    where: { id },
    data: { logo: logoPath },
  });

  revalidatePath("/");
  revalidatePath("/admin/projects");
  revalidatePath(`/projects/${project.slug}`);
  return { success: true, logo: logoPath };
}

export async function fetchAllProjectLogos() {
  const projects = await prisma.project.findMany({
    where: { url: { not: null } },
    select: { id: true, slug: true, url: true, titleEn: true },
  });

  const results: { slug: string; success: boolean; error?: string }[] = [];

  for (const project of projects) {
    if (!project.url) continue;
    try {
      const logoPath = await downloadFavicon(project.url, project.slug);
      if (logoPath) {
        await prisma.project.update({
          where: { id: project.id },
          data: { logo: logoPath },
        });
        results.push({ slug: project.slug, success: true });
      } else {
        results.push({ slug: project.slug, success: false, error: "Nepodarilo sa stiahnuť" });
      }
    } catch (e) {
      results.push({
        slug: project.slug,
        success: false,
        error: e instanceof Error ? e.message : "Chyba",
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/projects");
  return { results };
}
