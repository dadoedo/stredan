"use client";

import { deleteProject } from "@/actions/admin";

type Props = {
  projectId: string;
  projectTitle: string;
};

export function DeleteButton({ projectId, projectTitle }: Props) {
  return (
    <form
      action={deleteProject}
      onSubmit={(e) => {
        if (!confirm(`Naozaj zmazať projekt "${projectTitle}"?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={projectId} />
      <button
        type="submit"
        className="rounded border border-destructive/40 px-3 py-1 text-sm text-destructive transition-colors hover:border-destructive hover:bg-destructive/10"
      >
        Zmazať
      </button>
    </form>
  );
}
