"use client";

import { useActionState } from "react";
import { login } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => login(formData),
    null as { error?: string } | null,
  );

  return (
    <Card className="w-full max-w-sm border-border shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Admin prihlásenie
        </CardTitle>
        <CardDescription>
          Zadaj heslo pre prístup do administrácie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <p
              id="login-error"
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              aria-invalid={Boolean(state?.error)}
              aria-describedby={state?.error ? "login-error" : undefined}
            />
          </div>
          <Button type="submit" className="min-h-11 w-full">
            Prihlásiť
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
