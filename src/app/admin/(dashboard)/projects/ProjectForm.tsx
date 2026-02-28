"use client";

import React, { useActionState, useTransition } from "react";

const CATEGORIES = [
  "personal",
  "product",
  "client",
  "open-source",
  "internal",
  "legacy",
] as const;

type Technology = { id: string; slug: string; name: string };
type Integration = { id: string; slug: string; name: string };
type ProjectWithRelations = {
  slug: string;
  titleEn: string;
  titleSk: string;
  descriptionEn: string | null;
  descriptionSk: string | null;
  url: string | null;
  appStoreUrl: string | null;
  playStoreUrl: string | null;
  category: string;
  year: number | null;
  featured: boolean;
  visible: boolean;
  sortOrder: number;
  technologies: { technology: Technology }[];
  integrations: { integration: Integration }[];
};

type Props = {
  action: (formData: FormData) => Promise<{ error?: string } | never>;
  fetchLogoAction?: (formData: FormData) => Promise<{ error?: string; success?: boolean; logo?: string }>;
  technologies: Technology[];
  integrations: Integration[];
  project?: ProjectWithRelations & { id?: string; url?: string | null; logo?: string | null };
};

export function ProjectForm({
  action,
  fetchLogoAction,
  technologies,
  integrations,
  project,
}: Props) {
  const [logoState, setLogoState] = React.useState<{ error?: string; success?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      return action(formData);
    },
    null as { error?: string } | null,
  );

  const techSlugs = project?.technologies.map((t) => t.technology.slug).join(", ") ?? "";
  const intSlugs = project?.integrations.map((i) => i.integration.slug).join(", ") ?? "";

  return (
    <form action={formAction} className="space-y-6">
      {project?.id && <input type="hidden" name="id" value={project.id} />}
      {state?.error && (
        <p className="rounded border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="slug" className="block text-sm text-muted">
            Slug *
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={project?.slug}
            required
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
            placeholder="my-project"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm text-muted">
            Kategória
          </label>
          <select
            id="category"
            name="category"
            defaultValue={project?.category}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="titleEn" className="block text-sm text-muted">
            Názov (EN) *
          </label>
          <input
            id="titleEn"
            name="titleEn"
            defaultValue={project?.titleEn}
            required
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="titleSk" className="block text-sm text-muted">
            Názov (SK) *
          </label>
          <input
            id="titleSk"
            name="titleSk"
            defaultValue={project?.titleSk}
            required
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="descriptionEn" className="block text-sm text-muted">
          Popis (EN)
        </label>
        <textarea
          id="descriptionEn"
          name="descriptionEn"
          defaultValue={project?.descriptionEn ?? ""}
          rows={3}
          className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="descriptionSk" className="block text-sm text-muted">
          Popis (SK)
        </label>
        <textarea
          id="descriptionSk"
          name="descriptionSk"
          defaultValue={project?.descriptionSk ?? ""}
          rows={3}
          className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="url" className="block text-sm text-muted">
            URL
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="url"
              name="url"
              type="url"
              defaultValue={project?.url ?? ""}
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
            />
            {project?.id && project?.url && fetchLogoAction && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setLogoState(null);
                  const fd = new FormData();
                  fd.set("id", project.id!);
                  startTransition(async () => {
                    const result = await fetchLogoAction(fd);
                    setLogoState(result);
                    if (result.success) window.location.reload();
                  });
                }}
                className="shrink-0 rounded border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-zinc-500 hover:text-foreground disabled:opacity-50"
              >
                {isPending ? "..." : "Stiahnuť logo"}
              </button>
            )}
          </div>
          {project?.logo && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={project.logo}
                alt="Logo"
                className="size-8 rounded object-contain"
              />
              <span className="text-xs text-muted">{project.logo}</span>
            </div>
          )}
          {logoState?.error && (
            <p className="mt-1 text-sm text-red-400">{logoState.error}</p>
          )}
        </div>
        <div>
          <label htmlFor="year" className="block text-sm text-muted">
            Rok
          </label>
          <input
            id="year"
            name="year"
            type="number"
            defaultValue={project?.year ?? ""}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="appStoreUrl" className="block text-sm text-muted">
            App Store URL
          </label>
          <input
            id="appStoreUrl"
            name="appStoreUrl"
            type="url"
            defaultValue={project?.appStoreUrl ?? ""}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="playStoreUrl" className="block text-sm text-muted">
            Play Store URL
          </label>
          <input
            id="playStoreUrl"
            name="playStoreUrl"
            type="url"
            defaultValue={project?.playStoreUrl ?? ""}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="technologies" className="block text-sm text-muted">
            Technológie (slugy oddelené čiarkou)
          </label>
          <input
            id="technologies"
            name="technologies"
            defaultValue={techSlugs}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
            placeholder="nextjs, typescript, postgresql"
          />
          <p className="mt-1 text-xs text-muted">
            Dostupné: {technologies.map((t) => t.slug).join(", ")}
          </p>
        </div>
        <div>
          <label htmlFor="integrations" className="block text-sm text-muted">
            Integrácie (slugy oddelené čiarkou)
          </label>
          <input
            id="integrations"
            name="integrations"
            defaultValue={intSlugs}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
            placeholder="oauth-google, slack-api"
          />
          <p className="mt-1 text-xs text-muted">
            Dostupné: {integrations.map((i) => i.slug).join(", ")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="sortOrder" className="block text-sm text-muted">
            Poradie
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={project?.sortOrder ?? 0}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={project?.featured}
            className="rounded border-border"
          />
          <span className="text-sm">Featured</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="visible"
            defaultChecked={project?.visible ?? true}
            className="rounded border-border"
          />
          <span className="text-sm">Viditeľný</span>
        </label>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-zinc-300"
        >
          {project ? "Uložiť" : "Vytvoriť"}
        </button>
        {project && (
          <a
            href="/admin/projects"
            className="rounded border border-border px-4 py-2 text-sm transition-colors hover:border-zinc-500"
          >
            Zrušiť
          </a>
        )}
      </div>
    </form>
  );
}
