import type { AdminSession } from "../types.js";

export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CSS = `
:root {
  --bg: #09090b;
  --bg-elev: #121214;
  --bg-input: #18181b;
  --fg: #f4f4f5;
  --muted: #a1a1aa;
  --line: #27272a;
  --accent: #e8c547;
  --danger: #f87171;
  --ok: #4ade80;
  --sans: "IBM Plex Sans", system-ui, sans-serif;
  --serif: "Source Serif 4", Georgia, serif;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--fg); font-family: var(--sans); font-size: 15px; line-height: 1.45; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px 64px; }
header.top { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 0 18px; border-bottom: 1px solid var(--line); margin-bottom: 28px; }
.brand { font-family: var(--serif); font-size: 22px; letter-spacing: -0.03em; color: var(--fg); }
.brand span { color: var(--accent); }
nav.top-nav { display: flex; gap: 18px; flex-wrap: wrap; }
nav.top-nav a { color: var(--muted); font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; }
nav.top-nav a.active, nav.top-nav a:hover { color: var(--fg); text-decoration: none; }
.meta { color: var(--muted); font-size: 13px; }
h1 { font-family: var(--serif); font-weight: 600; font-size: 32px; letter-spacing: -0.03em; margin: 0 0 8px; }
h2 { font-family: var(--serif); font-size: 20px; margin: 32px 0 12px; }
.lede { color: var(--muted); margin: 0 0 24px; max-width: 62ch; }
.card { background: var(--bg-elev); border: 1px solid var(--line); border-radius: 12px; padding: 20px; }
.grid { display: grid; gap: 16px; }
.grid-2 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; color: var(--muted); font-weight: 500; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; padding: 10px 8px; border-bottom: 1px solid var(--line); }
td { padding: 12px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
.badge { display: inline-block; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
.badge.ok { color: var(--ok); border-color: #166534; }
.badge.warn { color: var(--accent); border-color: #854d0e; }
.badge.danger { color: var(--danger); border-color: #7f1d1d; }
label { display: block; font-size: 12px; color: var(--muted); margin: 12px 0 6px; letter-spacing: 0.04em; text-transform: uppercase; }
input, select, textarea { width: 100%; background: var(--bg-input); color: var(--fg); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; font: inherit; }
textarea { min-height: 80px; resize: vertical; }
input:focus, select:focus, textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.row-3 { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 16px; }
button, .btn { appearance: none; border: 0; background: var(--fg); color: var(--bg); font: inherit; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; padding: 10px 14px; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; }
button.ghost, .btn.ghost { background: transparent; color: var(--fg); border: 1px solid var(--line); }
button.danger, .btn.danger { background: #7f1d1d; color: #fecaca; }
button:hover, .btn:hover { filter: brightness(1.08); text-decoration: none; }
.flash { padding: 12px 14px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--line); }
.flash.error { background: #2a1212; color: #fecaca; border-color: #7f1d1d; }
.flash.ok { background: #102418; color: #bbf7d0; border-color: #166534; }
.flash.warn { background: #241c10; color: #fde68a; border-color: #854d0e; }
.secret { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; word-break: break-all; background: #000; padding: 12px; border-radius: 8px; }
.login { max-width: 420px; margin: 12vh auto; }
.login h1 { font-size: 36px; }
.check { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
.check input { width: auto; }
.check label { margin: 0; text-transform: none; letter-spacing: 0; color: var(--fg); font-size: 14px; }
.muted { color: var(--muted); font-size: 13px; }
hr.sep { border: 0; border-top: 1px solid var(--line); margin: 24px 0; }
@media (max-width: 720px) {
  .row, .row-3 { grid-template-columns: 1fr; }
  header.top { flex-direction: column; align-items: flex-start; }
}
`;

export function layout(opts: {
  title: string;
  session?: AdminSession | null;
  active?: string;
  body: string;
}): string {
  const nav = opts.session && !opts.session.pendingTotp
    ? `
      <nav class="top-nav">
        <a class="${opts.active === "databases" ? "active" : ""}" href="/databases">Databases</a>
        <a class="${opts.active === "email" ? "active" : ""}" href="/email">Email</a>
        <a class="${opts.active === "keys" ? "active" : ""}" href="/keys">API keys</a>
        <a class="${opts.active === "audit" ? "active" : ""}" href="/audit">Audit</a>
        <form method="post" action="/logout" style="display:inline"><button class="ghost" type="submit">Log out</button></form>
      </nav>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(opts.title)} · Stredan MCP</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,600&display=swap" />
  <style>${CSS}</style>
</head>
<body>
  <div class="wrap">
    <header class="top">
      <a class="brand" href="/">Stredan <span>MCP</span></a>
      ${nav}
    </header>
    ${opts.body}
  </div>
</body>
</html>`;
}

export function flashHtml(kind: "error" | "ok" | "warn", message: string): string {
  return `<div class="flash ${kind}">${esc(message)}</div>`;
}
