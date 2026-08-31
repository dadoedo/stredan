import type { Metadata } from "next";
import { CursorProfilePlayground } from "@/components/CursorProfilePlayground";

export const metadata: Metadata = {
  title: "react-cursor-calendar",
  description:
    "Activity calendar for public Cursor profiles. npm i react-cursor-calendar",
};

export default function CursorProfilePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm text-muted">dadoedo / react-cursor-calendar</p>
      <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Cursor profile calendar
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Public heatmap for{" "}
        <a className="underline underline-offset-2" href="https://cursor.com/@dadoeodo">
          cursor.com/@handle
        </a>
        . Drop-in React component plus a CORS API.
      </p>

      <pre className="mt-6 overflow-x-auto rounded-xl bg-foreground px-4 py-3 text-sm text-background">
        npm i react-cursor-calendar
      </pre>

      <p className="mt-4 text-sm text-muted">
        <a className="underline underline-offset-2" href="https://www.npmjs.com/package/react-cursor-calendar">
          npm
        </a>
        {" · "}
        <a className="underline underline-offset-2" href="https://github.com/dadoedo/react-cursor-calendar">
          Source
        </a>
        {" · "}
        <a className="underline underline-offset-2" href="https://cursor-profile.stredan.sk/v1/dadoeodo">
          GET /v1/:handle
        </a>
        {" · "}
        <a className="underline underline-offset-2" href="https://cursor-profile.stredan.sk/v1/dadoeodo.svg">
          .svg
        </a>
        {" · "}
        <a className="underline underline-offset-2" href="https://cursor-profile.stredan.sk/v1/dadoeodo.png">
          .png
        </a>
        {" · "}
        <a className="underline underline-offset-2" href="/about">
          Used on /about
        </a>
      </p>

      <section className="mt-12">
        <h2 className="text-sm font-medium">Embed</h2>
        <p className="mt-2 text-sm text-muted">
          <code className="rounded bg-surface-2 px-1.5 py-0.5">
            {`<img src="https://cursor-profile.stredan.sk/v1/dadoeodo.svg" />`}
          </code>
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/api/cursor-profile/dadoeodo.svg"
            alt="Cursor activity for @dadoeodo"
            className="h-auto w-full max-w-3xl"
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium">Try a public handle</h2>
        <div className="mt-4">
          <CursorProfilePlayground />
        </div>
      </section>
    </main>
  );
}
