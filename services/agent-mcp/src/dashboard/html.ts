import type { UserSession } from "../types.js";

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
  color-scheme: dark;
  --bg: #0c1016;
  --bg-elev: #171d27;
  --bg-input: #0e141c;
  --bg-head: #121820;
  --fg: #f6f7fb;
  --muted: #c9d1de;
  --line: #465066;
  --line-strong: #6d788c;
  --accent: #f0d36a;
  --accent-ink: #1a1504;
  --danger: #ffb4bc;
  --danger-bg: #9f1239;
  --ok: #b6f3cd;
  --warn: #fde7a4;
  --sans: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  --serif: "Source Serif 4", Georgia, serif;
  --focus: 0 0 0 3px #0c1016, 0 0 0 6px var(--accent);
}
* { box-sizing: border-box; }
html, body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--sans);
  font-size: 18px;
  line-height: 1.6;
}
a { color: var(--accent); text-decoration-thickness: 2px; text-underline-offset: 3px; }
a:hover { color: #ffe7a0; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
.wrap { max-width: 1180px; margin: 0 auto; padding: 8px 28px 80px; }
header.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 0 20px;
  border-bottom: 2px solid var(--line);
  margin-bottom: 32px;
}
.brand {
  font-family: var(--serif);
  font-size: 1.7rem;
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: var(--fg);
  text-decoration: none;
  font-weight: 600;
}
.brand span { color: var(--accent); }
.top-side { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; justify-content: flex-end; }
nav.top-nav { display: flex; gap: 8px; flex-wrap: wrap; }
nav.top-nav a {
  color: var(--fg);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 10px;
}
nav.top-nav a.active { background: #2a3344; color: var(--accent); }
nav.top-nav a:hover { background: #222a38; text-decoration: none; }
.top-user { display: flex; align-items: center; gap: 12px; }
.meta { color: var(--muted); font-size: 1rem; }
h1 {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 2.35rem;
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin: 0 0 10px;
}
h2 {
  font-family: var(--serif);
  font-size: 1.55rem;
  line-height: 1.25;
  font-weight: 600;
  margin: 0 0 14px;
}
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 22px;
}
.page-head h1 { margin-bottom: 8px; }
.lede { color: var(--muted); margin: 0; max-width: 68ch; font-size: 1.125rem; }
.card {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 28px;
}
.card h2 { margin-top: 4px; }
.section-title { margin: 28px 0 4px; }
.grid { display: grid; gap: 18px; }
.grid-2 { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 16px; background: var(--bg-elev); margin-bottom: 28px; }
table { width: 100%; border-collapse: collapse; font-size: 1rem; min-width: 880px; }
th {
  text-align: left;
  color: var(--fg);
  font-weight: 700;
  font-size: 0.95rem;
  padding: 16px 18px;
  border-bottom: 2px solid var(--line);
  background: var(--bg-head);
  white-space: nowrap;
}
td {
  padding: 16px 18px;
  border-bottom: 1px solid #2c3546;
  vertical-align: top;
  overflow-wrap: break-word;
}
tbody tr:nth-child(even) { background: rgba(255, 255, 255, 0.035); }
tbody tr:hover { background: rgba(240, 211, 106, 0.08); }
td a { font-weight: 700; }
.badge {
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  color: var(--fg);
  background: #121820;
}
.badge.ok { color: #052e16; background: #86efac; border-color: #86efac; }
.badge.warn { color: #422006; background: #fcd34d; border-color: #fcd34d; }
.badge.danger { color: #fff; background: var(--danger-bg); border-color: var(--danger-bg); }
.field { margin: 0 0 18px; }
label, .field > label, legend {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: var(--fg);
  margin: 0 0 8px;
}
fieldset { border: 0; margin: 8px 0 0; padding: 0; }
input, select, textarea {
  width: 100%;
  background: var(--bg-input);
  color: var(--fg);
  border: 2px solid var(--line-strong);
  border-radius: 10px;
  padding: 12px 14px;
  font: inherit;
  line-height: 1.4;
  min-height: 48px;
}
textarea { min-height: 120px; resize: vertical; }
input::placeholder, textarea::placeholder { color: #b7c0d0; opacity: 1; }
input:focus, select:focus, textarea:focus { outline: none; box-shadow: var(--focus); border-color: var(--accent); }
.field:has(:user-invalid) input,
.field:has(:user-invalid) select,
.field:has(:user-invalid) textarea,
input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"] {
  border-color: #fb7185;
}
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 18px; }
.row-3 { display: grid; grid-template-columns: 1.4fr 0.8fr 1.4fr; gap: 16px 18px; }
.actions, .toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 8px; }
.toolbar form { margin: 0; }
button, .btn {
  appearance: none;
  border: 2px solid transparent;
  background: var(--fg);
  color: #12141a;
  font: inherit;
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.2;
  padding: 12px 18px;
  min-height: 48px;
  border-radius: 10px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
button.ghost, .btn.ghost { background: transparent; color: var(--fg); border-color: var(--line-strong); }
button.danger, .btn.danger { background: var(--danger-bg); color: #fff; border-color: var(--danger-bg); }
button:hover, .btn:hover { text-decoration: none; filter: brightness(1.06); }
button.ghost:hover, .btn.ghost:hover { background: #222a38; filter: none; }
.flash {
  padding: 16px 18px;
  border-radius: 12px;
  margin-bottom: 18px;
  border: 2px solid var(--line);
  font-size: 1.05rem;
  font-weight: 600;
}
.flash.error { background: #3f1219; color: #ffe4e8; border-color: #fb7185; }
.flash.ok { background: #052e1c; color: #d1fae5; border-color: #34d399; }
.flash.warn { background: #fde68a; color: #1c1404; border-color: #b45309; }
.help { color: var(--muted); font-size: 0.98rem; margin: 8px 0 0; }
.field-error { display: none; color: var(--danger); font-size: 0.98rem; font-weight: 650; margin: 8px 0 0; }
.field:has(:user-invalid) .field-error, .field-error.is-visible { display: block; }
.field-warn { margin-top: 10px; }
.secret {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1rem;
  line-height: 1.5;
  word-break: break-all;
  background: #07090d;
  color: var(--fg);
  padding: 14px 16px;
  border-radius: 10px;
  border: 2px solid var(--line-strong);
  margin: 12px 0 18px;
}
.login { max-width: 520px; margin: 6vh auto 0; }
.login h1 { font-size: 2.6rem; }
.qr { display: block; width: 220px; height: 220px; background: #fff; border-radius: 12px; padding: 8px; margin: 8px 0 16px; }
.check { display: flex; align-items: flex-start; gap: 12px; margin: 0 0 12px; }
.check input { width: 22px; height: 22px; min-height: 22px; margin-top: 3px; accent-color: var(--accent); }
.check label { margin: 0; font-weight: 600; }
.empty { color: var(--fg); font-size: 1.05rem; padding: 28px 18px; }
hr.sep { border: 0; border-top: 2px solid var(--line); margin: 8px 0 20px; }
@media (max-width: 840px) {
  html, body { font-size: 17px; }
  .wrap { padding: 4px 16px 56px; }
  header.top, .top-side, .page-head { flex-direction: column; align-items: stretch; }
  .top-side { gap: 12px; }
  .row, .row-3 { grid-template-columns: 1fr; }
  h1 { font-size: 2rem; }
  .login { margin-top: 12px; }
  table { min-width: 880px; }
}
`;

export function layout(opts: {
  title: string;
  session?: UserSession | null;
  active?: string;
  body: string;
}): string {
  const nav = opts.session && !opts.session.pendingTotp
    ? `
      <div class="top-side">
        <nav class="top-nav" aria-label="Dashboard">
          <a class="${opts.active === "databases" ? "active" : ""}" ${opts.active === "databases" ? 'aria-current="page"' : ""} href="/databases">Databases</a>
          <a class="${opts.active === "email" ? "active" : ""}" ${opts.active === "email" ? 'aria-current="page"' : ""} href="/email">Email</a>
          <a class="${opts.active === "keys" ? "active" : ""}" ${opts.active === "keys" ? 'aria-current="page"' : ""} href="/keys">API keys</a>
          <a class="${opts.active === "audit" ? "active" : ""}" ${opts.active === "audit" ? 'aria-current="page"' : ""} href="/audit">Audit</a>
          ${opts.session.role === "superadmin" ? `<a class="${opts.active === "users" ? "active" : ""}" ${opts.active === "users" ? 'aria-current="page"' : ""} href="/users">Users</a>` : ""}
        </nav>
        <div class="top-user">
          <span class="meta">${esc(opts.session.email)}</span>
          <form method="post" action="/logout"><button class="ghost" type="submit">Log out</button></form>
        </div>
      </div>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(opts.title)} · Stredan MCP</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=Source+Serif+4:opsz,wght@8..60,600&display=swap" />
  <style>${CSS}</style>
</head>
<body>
  <div class="wrap">
    <header class="top">
      <a class="brand" href="/">Stredan <span>MCP</span></a>
      ${nav}
    </header>
    <main id="content">
      ${opts.body}
    </main>
  </div>
</body>
</html>`;
}

export function flashHtml(kind: "error" | "ok" | "warn", message: string): string {
  const role = kind === "error" ? "alert" : "status";
  return `<div class="flash ${kind}" role="${role}">${esc(message)}</div>`;
}
