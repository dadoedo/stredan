"use client";

import { useState } from "react";
import Link from "next/link";
import { GitHubCalendar } from "react-github-calendar";
import "react-github-calendar/tooltips.css";
import {
  compactNumber,
  CursorCalendar,
  lastMonths,
  totalCount,
} from "react-cursor-calendar";
import "react-cursor-calendar/tooltips.css";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { StatsData } from "@/lib/stats";
import type { Locale } from "@/lib/translations";
import { OpensInNewTab } from "@/components/OpensInNewTab";
import type { CursorProfile } from "react-cursor-calendar";

const CHART_COLORS = [
  "#d4d4d8", // zinc-300
  "#a1a1aa", // zinc-400
  "#71717a", // zinc-500
  "#52525b", // zinc-600
  "#eab308", // amber-500
  "#22c55e", // emerald-500
  "#06b6d4", // cyan-500
  "#8b5cf6", // violet-500
  "#f43f5e", // rose-500
  "#f97316", // orange-500
];

const TOP_IN_CHART = 8;

const CATEGORY_LABELS: Record<string, { en: string; sk: string }> = {
  product: { en: "Product", sk: "Produkt" },
  client: { en: "Client", sk: "Klient" },
  "open-source": { en: "Open Source", sk: "Open Source" },
  internal: { en: "Internal", sk: "Interný" },
  personal: { en: "Personal", sk: "Osobný" },
  legacy: { en: "Legacy", sk: "Legacy" },
};

type TabId = "technologies" | "integrations" | "overview";

interface StatsDashboardProps {
  stats: StatsData;
  locale: Locale;
  cursorProfile?: CursorProfile | null;
}

function preparePieData<T extends { name: string; value: number }>(
  items: T[]
): { data: T[]; other: T[] } {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, TOP_IN_CHART);
  const other = sorted.slice(TOP_IN_CHART);
  return { data: top, other };
}

function formatChartSummary(
  items: { name: string; value: number }[],
  locale: Locale,
  unit: { en: string; sk: string },
) {
  return items
    .map(
      (item) =>
        `${item.name}: ${item.value} ${locale === "sk" ? unit.sk : unit.en}`,
    )
    .join(", ");
}

function ChartDataTable({
  caption,
  rows,
}: {
  caption: string;
  rows: { name: string; value: number }[];
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Count</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td>{row.name}</td>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function StatsDashboard({ stats, locale, cursorProfile }: StatsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("technologies");
  const [selectedTechSlug, setSelectedTechSlug] = useState<string | null>(null);
  const [selectedIntSlug, setSelectedIntSlug] = useState<string | null>(null);

  const t = locale === "sk" ? "sk" : "en";
  const getProjectTitle = (p: { titleEn: string; titleSk: string }) =>
    locale === "sk" ? p.titleSk : p.titleEn;

  const tabs: { id: TabId; labelEn: string; labelSk: string }[] = [
    { id: "technologies", labelEn: "Technologies", labelSk: "Technológie" },
    { id: "integrations", labelEn: "Integrations", labelSk: "Integrácie" },
    { id: "overview", labelEn: "Overview", labelSk: "Prehľad" },
  ];

  const techPieItems = stats.technologies.map((t) => ({
    name: t.name,
    slug: t.slug,
    value: t.count,
  }));
  const { data: techChartData, other: techOther } = preparePieData(
    techPieItems.map(({ name, value }) => ({ name, value }))
  );
  const techPieData =
    techOther.length > 0
      ? [
          ...techChartData,
          {
            name: locale === "sk" ? `Ostatné (${techOther.length})` : `Other (${techOther.length})`,
            value: techOther.reduce((s, x) => s + x.value, 0),
          },
        ]
      : techChartData;

  const intPieItems = stats.integrations.map((i) => ({
    name: i.name,
    slug: i.slug,
    value: i.count,
  }));
  const { data: intChartData, other: intOther } = preparePieData(
    intPieItems.map(({ name, value }) => ({ name, value }))
  );
  const intPieData =
    intOther.length > 0
      ? [
          ...intChartData,
          {
            name: locale === "sk" ? `Ostatné (${intOther.length})` : `Other (${intOther.length})`,
            value: intOther.reduce((s, x) => s + x.value, 0),
          },
        ]
      : intChartData;

  const categoryPieData = stats.byCategory.map((c) => ({
    name: CATEGORY_LABELS[c.category]?.[t] ?? c.category,
    value: c.count,
  }));

  const selectedTech = selectedTechSlug
    ? stats.projectsByTechnology.find((x) => x.techSlug === selectedTechSlug)
    : null;
  const selectedInt = selectedIntSlug
    ? stats.projectsByIntegration.find((x) => x.intSlug === selectedIntSlug)
    : null;

  return (
    <section id="stats" className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {locale === "sk" ? "Štatistiky portfólia" : "Portfolio Stats"}
        </h2>

        <div
          className="mt-6 flex gap-1 rounded-lg border border-border bg-surface p-1"
          role="tablist"
          aria-label={
            locale === "sk" ? "Štatistiky portfólia" : "Portfolio stats"
          }
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`stats-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`stats-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTechSlug(null);
                setSelectedIntSlug(null);
              }}
              className={`min-h-11 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {locale === "sk" ? tab.labelSk : tab.labelEn}
            </button>
          ))}
        </div>

        <div
          id={`stats-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`stats-tab-${activeTab}`}
          className="mt-6 rounded-xl border border-border bg-surface p-6 sm:p-8"
        >
          {activeTab === "technologies" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Left: chart + legend only */}
              <div className="flex flex-col">
                <h3 className="mb-2 text-sm font-medium text-foreground">
                  {locale === "sk"
                    ? "Projekty podľa technológie"
                    : "Projects by technology"}
                </h3>
                {techPieData.length > 0 ? (
                  <>
                    <ChartDataTable
                      caption={
                        locale === "sk"
                          ? "Projekty podľa technológie"
                          : "Projects by technology"
                      }
                      rows={techPieData}
                    />
                    <div
                      className="h-[340px] overflow-hidden pt-4 sm:h-[280px]"
                      role="img"
                      aria-label={formatChartSummary(techPieData, locale, {
                        en: "projects",
                        sk: "projektov",
                      })}
                    >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 24, right: 8, bottom: 8, left: 8 }}>
                        <Pie
                          data={techPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                        >
                          {techPieData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                              stroke="#e4dfd8"
                              strokeWidth={1}
                            />
                          ))}
                        </Pie>
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{ paddingTop: 8 }}
                          formatter={(value, entry: { payload?: { value?: number } }) => (
                            <span className="text-xs text-muted">
                              {value} ({entry?.payload?.value ?? 0})
                            </span>
                          )}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e4dfd8",
                            borderRadius: "8px",
                            color: "#121212",
                          }}
                          itemStyle={{ color: "#121212" }}
                          labelStyle={{ color: "#121212" }}
                          formatter={(value) => [
                            `${value ?? 0} ${locale === "sk" ? "projektov" : "projects"}`,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <p className="py-12 text-center text-sm text-muted">
                    {locale === "sk" ? "Žiadne dáta" : "No data"}
                  </p>
                )}
              </div>

              {/* Right: technologies + projects */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">
                  {locale === "sk"
                    ? "Klikni na technológiu – zobrazia sa projekty"
                    : "Click a technology → see its projects"}
                </h3>
                <div className="mb-2 flex flex-wrap gap-2">
                  {stats.projectsByTechnology.map((item) => (
                    <button
                      key={item.techSlug}
                      type="button"
                      aria-pressed={selectedTechSlug === item.techSlug}
                      onClick={() =>
                        setSelectedTechSlug(
                          selectedTechSlug === item.techSlug ? null : item.techSlug
                        )
                      }
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors ${
                        selectedTechSlug === item.techSlug
                          ? "bg-foreground text-background"
                          : "bg-surface-2 text-muted hover:bg-border hover:text-foreground"
                      }`}
                    >
                      {stats.technologies.find((t) => t.slug === item.techSlug)
                        ?.icon && (
                        <img
                          src={
                            stats.technologies.find(
                              (t) => t.slug === item.techSlug
                            )!.icon!
                          }
                          alt=""
                          className="h-3.5 w-3.5"
                        />
                      )}
                      {item.techName} ({item.projects.length})
                    </button>
                  ))}
                </div>
                {selectedTech ? (
                  <div className="rounded border border-border bg-surface-2 p-3">
                    <p className="mb-2 text-xs text-muted">
                      {selectedTech.projects.length}{" "}
                      {locale === "sk" ? "projektov" : "projects"}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {selectedTech.projects.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/projects/${p.slug}`}
                          className="text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:underline"
                        >
                          {getProjectTitle(p)}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="py-2 text-sm text-muted">
                    {locale === "sk"
                      ? "Vyber technológiu vyššie"
                      : "Select a technology above"}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Left: chart + legend only */}
              <div className="flex flex-col">
                <h3 className="mb-2 text-sm font-medium text-foreground">
                  {locale === "sk"
                    ? "Projekty podľa integrácie"
                    : "Projects by integration"}
                </h3>
                {intPieData.length > 0 ? (
                  <>
                    <ChartDataTable
                      caption={
                        locale === "sk"
                          ? "Projekty podľa integrácie"
                          : "Projects by integration"
                      }
                      rows={intPieData}
                    />
                    <div
                      className="h-[340px] overflow-hidden pt-4 sm:h-[280px]"
                      role="img"
                      aria-label={formatChartSummary(intPieData, locale, {
                        en: "projects",
                        sk: "projektov",
                      })}
                    >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 24, right: 8, bottom: 8, left: 8 }}>
                        <Pie
                          data={intPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                        >
                          {intPieData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                              stroke="#e4dfd8"
                              strokeWidth={1}
                            />
                          ))}
                        </Pie>
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{ paddingTop: 8 }}
                          formatter={(value, entry: { payload?: { value?: number } }) => (
                            <span className="text-xs text-muted">
                              {value} ({entry?.payload?.value ?? 0})
                            </span>
                          )}
                        />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #e4dfd8",
                              borderRadius: "8px",
                              color: "#121212",
                            }}
                            itemStyle={{ color: "#121212" }}
                            labelStyle={{ color: "#121212" }}
                            formatter={(value) => [
                              `${value ?? 0} ${locale === "sk" ? "projektov" : "projects"}`,
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                  ) : (
                    <p className="py-12 text-center text-sm text-muted">
                      {locale === "sk"
                        ? "Žiadne integrácie"
                        : "No integrations"}
                    </p>
                  )}
                </div>

              {/* Right: integrations + projects */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">
                  {locale === "sk"
                    ? "Klikni na integráciu – zobrazia sa projekty"
                    : "Click an integration → see its projects"}
                </h3>
                <div className="mb-2 flex flex-wrap gap-2">
                  {stats.projectsByIntegration.map((item) => (
                    <button
                      key={item.intSlug}
                      type="button"
                      aria-pressed={selectedIntSlug === item.intSlug}
                      onClick={() =>
                        setSelectedIntSlug(
                          selectedIntSlug === item.intSlug ? null : item.intSlug
                        )
                      }
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors ${
                        selectedIntSlug === item.intSlug
                          ? "bg-foreground text-background"
                          : "bg-surface-2 text-muted hover:bg-border hover:text-foreground"
                      }`}
                    >
                      {stats.integrations.find((i) => i.slug === item.intSlug)
                        ?.icon && (
                        <img
                          src={
                            stats.integrations.find(
                              (i) => i.slug === item.intSlug
                            )!.icon!
                          }
                          alt=""
                          className="h-3.5 w-3.5"
                        />
                      )}
                      {item.intName} ({item.projects.length})
                    </button>
                  ))}
                </div>
                {selectedInt ? (
                  <div className="rounded border border-border bg-surface-2 p-3">
                    <p className="mb-2 text-xs text-muted">
                      {selectedInt.projects.length}{" "}
                      {locale === "sk" ? "projektov" : "projects"}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {selectedInt.projects.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/projects/${p.slug}`}
                          className="text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:underline"
                        >
                          {getProjectTitle(p)}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="py-2 text-sm text-muted">
                    {locale === "sk"
                      ? "Vyber integráciu vyššie"
                      : "Select an integration above"}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <h3 className="mb-4 text-sm font-medium text-foreground">
                  {locale === "sk"
                    ? "Projekty podľa kategórie"
                    : "Projects by category"}
                </h3>
                {categoryPieData.length > 0 ? (
                  <>
                    <ChartDataTable
                      caption={
                        locale === "sk"
                          ? "Projekty podľa kategórie"
                          : "Projects by category"
                      }
                      rows={categoryPieData}
                    />
                    <div
                      className="overflow-hidden pt-4"
                      role="img"
                      aria-label={formatChartSummary(categoryPieData, locale, {
                        en: "projects",
                        sk: "projektov",
                      })}
                    >
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart margin={{ top: 24, right: 8, bottom: 8, left: 8 }}>
                        <Pie
                          data={categoryPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {categoryPieData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                              stroke="#e4dfd8"
                              strokeWidth={1}
                            />
                          ))}
                        </Pie>
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{ paddingTop: 8 }}
                          formatter={(value, entry: { payload?: { value?: number } }) => (
                            <span className="text-xs text-muted">
                              {value} ({entry?.payload?.value ?? 0})
                            </span>
                          )}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e4dfd8",
                            borderRadius: "8px",
                            color: "#121212",
                          }}
                          itemStyle={{ color: "#121212" }}
                          labelStyle={{ color: "#121212" }}
                          formatter={(value) => [
                            `${value ?? 0} ${locale === "sk" ? "projektov" : "projects"}`,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <p className="py-12 text-center text-muted">
                    {locale === "sk" ? "Žiadne dáta" : "No data"}
                  </p>
                )}
              </div>
              <div>
                <h3 className="mb-4 text-sm font-medium text-foreground">
                  {locale === "sk"
                    ? "Projekty podľa roka"
                    : "Projects by year"}
                </h3>
                {stats.byYear.length > 0 ? (
                  <>
                    <ChartDataTable
                      caption={
                        locale === "sk"
                          ? "Projekty podľa roka"
                          : "Projects by year"
                      }
                      rows={stats.byYear.map((row) => ({
                        name: String(row.year),
                        value: row.count,
                      }))}
                    />
                    <div
                      role="img"
                      aria-label={formatChartSummary(
                        stats.byYear.map((row) => ({
                          name: String(row.year),
                          value: row.count,
                        })),
                        locale,
                        { en: "projects", sk: "projektov" },
                      )}
                    >
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={stats.byYear}
                      margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                    >
                      <XAxis
                        dataKey="year"
                        stroke="#a8a29e"
                        tick={{ fill: "#5c5854", fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#a8a29e"
                        tick={{ fill: "#5c5854", fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Bar
                        dataKey="count"
                        fill="#8a6a48"
                        radius={[4, 4, 0, 0]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e4dfd8",
                          borderRadius: "8px",
                          color: "#121212",
                        }}
                        itemStyle={{ color: "#121212" }}
                        labelStyle={{ color: "#121212" }}
                        formatter={(value) => [
                          `${value ?? 0} ${locale === "sk" ? "projektov" : "projects"}`,
                        ]}
                        labelFormatter={(label) =>
                          locale === "sk" ? `Rok ${label}` : `Year ${label}`
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <p className="py-12 text-center text-muted">
                    {locale === "sk" ? "Žiadne dáta" : "No data"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cursor activity */}
        {cursorProfile ? (
          <div className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
            <h3 className="mb-4 text-sm font-medium text-foreground">
              {locale === "sk" ? "Cursor aktivita" : "Cursor activity"}
            </h3>
            <CursorCalendar
              handle="dadoeodo"
              data={cursorProfile}
              variant="heatmap"
              theme="cursor"
              colorScheme="light"
              framed={false}
              labels={{
                totalCount:
                  locale === "sk"
                    ? `${compactNumber(totalCount(lastMonths(cursorProfile.activityCounts, 12)))} tokenov za posledných 12 mesiacov`
                    : `${compactNumber(totalCount(lastMonths(cursorProfile.activityCounts, 12)))} tokens in the last 12 months`,
              }}
            />
            <p className="mt-3 text-sm text-muted">
              <a
                href="https://cursor.com/@dadoeodo"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:underline"
              >
                cursor.com/@dadoeodo
              </a>
              <OpensInNewTab locale={locale} />
              {" · "}
              <a
                href="https://cursor-profile.stredan.sk"
                className="underline-offset-2 hover:underline"
              >
                {locale === "sk" ? "ďalšie grafy" : "more graphs"}
              </a>
            </p>
          </div>
        ) : null}

        {/* GitHub Contributions */}
        <div className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
          <h3 className="mb-4 text-sm font-medium text-foreground">
            {locale === "sk"
              ? "GitHub príspevky"
              : "GitHub contributions"}
          </h3>
          <a
            href="https://github.com/dadoedo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              locale === "sk"
                ? "GitHub profil dadoedo — príspevky za posledných 12 mesiacov"
                : "dadoedo GitHub profile — contributions in the last 12 months"
            }
            className="block [&_svg]:max-w-full"
          >
            <GitHubCalendar
              username="dadoedo"
              colorScheme="light"
              theme={{
                light: [
                  "#ebedf0",
                  "#9be9a8",
                  "#40c463",
                  "#30a14e",
                  "#216e39",
                ],
              }}
              transformData={(contributions) => {
                const now = new Date();
                const startDate = new Date(
                  now.getFullYear(),
                  now.getMonth() - 11,
                  1
                );
                const endDate = new Date(
                  now.getFullYear(),
                  now.getMonth() + 1,
                  0
                );
                return contributions.filter((activity) => {
                  const date = new Date(activity.date);
                  return date >= startDate && date <= endDate;
                });
              }}
              labels={{
                totalCount:
                  locale === "sk"
                    ? "{{count}} príspevkov za posledných 12 mesiacov"
                    : "{{count}} contributions in the last 12 months",
              }}
            />
            <OpensInNewTab locale={locale} />
          </a>
        </div>
      </div>
    </section>
  );
}
