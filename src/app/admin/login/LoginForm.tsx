"use client";

import { useActionState } from "react";
import { login } from "@/actions/admin";

export function LoginForm() {
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => login(formData),
    null as { error?: string } | null,
  );

  return (
    <form action={formAction} className="w-full max-w-sm space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Admin prihlásenie</h1>
      {state?.error && (
        <p
          id="login-error"
          role="alert"
          className="rounded border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="password" className="block text-sm text-muted">
          Heslo
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          aria-invalid={Boolean(state?.error)}
          aria-describedby={state?.error ? "login-error" : undefined}
          className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus-visible:border-zinc-400"
        />
      </div>
      <button
        type="submit"
        className="min-h-11 w-full rounded bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-zinc-300"
      >
        Prihlásiť
      </button>
    </form>
  );
}
