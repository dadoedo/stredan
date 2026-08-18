"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type TouchChannel = "gmail" | "resend" | "smtp";

const CHANNELS: TouchChannel[] = ["gmail", "resend", "smtp"];

function asChannel(value: string): TouchChannel {
  return CHANNELS.includes(value as TouchChannel) ? (value as TouchChannel) : "gmail";
}

export async function updateEmailTemplate(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const key = String(formData.get("key") ?? "").trim();
  const locale = String(formData.get("locale") ?? "sk").trim() || "sk";
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyText = String(formData.get("bodyText") ?? "");
  const version = parseInt(String(formData.get("version") ?? "1"), 10) || 1;
  const active = formData.get("active") === "on";

  if (!id || !key || !subject) {
    throw new Error("Kľúč a predmet sú povinné.");
  }

  await prisma.emailTemplate.update({
    where: { id },
    data: { key, locale, subject, bodyText, version, active },
  });

  revalidatePath("/admin/templates");
  revalidatePath("/admin/matrix");
  redirect("/admin/templates");
}

export async function createEmailTemplate(formData: FormData) {
  await requireAdmin();
  const offerId = String(formData.get("offerId") ?? "");
  const key = String(formData.get("key") ?? "").trim();
  const locale = String(formData.get("locale") ?? "sk").trim() || "sk";
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyText = String(formData.get("bodyText") ?? "");
  const version = parseInt(String(formData.get("version") ?? "1"), 10) || 1;

  if (!offerId || !key || !subject) {
    throw new Error("Ponuka, kľúč a predmet sú povinné.");
  }

  await prisma.emailTemplate.create({
    data: {
      offerId,
      key,
      locale,
      subject,
      bodyText,
      version,
      active: true,
    },
  });

  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}

export async function updateSendAccount(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const mcpAccountKey = String(formData.get("mcpAccountKey") ?? "").trim() || null;
  const fromAddress = String(formData.get("fromAddress") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const dailyCap = parseInt(String(formData.get("dailyCap") ?? "8"), 10) || 8;
  const channel = asChannel(String(formData.get("channel") ?? "gmail"));
  const active = formData.get("active") === "on";

  if (!id || !name) {
    throw new Error("Názov je povinný.");
  }

  await prisma.sendAccount.update({
    where: { id },
    data: {
      name,
      mcpAccountKey,
      fromAddress,
      notes,
      dailyCap,
      channel,
      active: active && Boolean(mcpAccountKey),
    },
  });

  revalidatePath("/admin/accounts");
  revalidatePath("/admin/matrix");
}
