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
        className="rounded border border-red-500/50 px-3 py-1 text-sm text-red-400 transition-colors hover:border-red-500 hover:bg-red-500/10"
      >
        Zmazať
      </button>
    </form>
  );
}
