"use client";

import { useState } from "react";
import Link from "next/link";
import { GitHubCalendar } from "react-github-calendar";
import "react-github-calendar/tooltips.css";
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
}

function preparePieData<T extends { name: string; value: number }>(
  items: T[]
): { data: T[]; other: T[] } {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, TOP_IN_CHART);
  const other = sorted.slice(TOP_IN_CHART);
  return { data: top, other };
}

export function StatsDashboard({ stats, locale }: StatsDashboardProps) {
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

        <div className="mt-6 flex gap-1 rounded-lg border border-zinc-600 bg-zinc-900/80 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTechSlug(null);
                setSelectedIntSlug(null);
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-zinc-600 text-white shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {locale === "sk" ? tab.labelSk : tab.labelEn}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-zinc-600 bg-zinc-900/50 p-6 sm:p-8">
          {activeTab === "technologies" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Left: chart + legend only */}
              <div className="flex flex-col">
                <h3 className="mb-2 text-sm font-medium text-zinc-300">
                  {locale === "sk"
                    ? "Projekty podľa technológie"
                    : "Projects by technology"}
                </h3>
                {techPieData.length > 0 ? (
                  <div className="h-[340px] overflow-hidden pt-4 sm:h-[280px]">
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
                              stroke="#52525b"
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
                            <span className="text-xs text-zinc-300">
                              {value} ({entry?.payload?.value ?? 0})
                            </span>
                          )}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #52525b",
                            borderRadius: "8px",
                            color: "#fafafa",
                          }}
                          itemStyle={{ color: "#fafafa" }}
                          labelStyle={{ color: "#fafafa" }}
                          formatter={(value) => [
                            `${value ?? 0} ${locale === "sk" ? "projektov" : "projects"}`,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-12 text-center text-sm text-zinc-500">
                    {locale === "sk" ? "Žiadne dáta" : "No data"}
                  </p>
                )}
              </div>

              {/* Right: technologies + projects */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-zinc-300">
                  {locale === "sk"
                    ? "Klikni na technológiu – zobrazia sa projekty"
                    : "Click a technology → see its projects"}
                </h3>
                <div className="mb-2 flex flex-wrap gap-2">
                  {stats.projectsByTechnology.map((item) => (
                    <button
                      key={item.techSlug}
                      type="button"
                      onClick={() =>
                        setSelectedTechSlug(
                          selectedTechSlug === item.techSlug ? null : item.techSlug
                        )
                      }
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors ${
                        selectedTechSlug === item.techSlug
                          ? "bg-zinc-500 text-white"
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white"
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
                  <div className="rounded border border-zinc-600 bg-zinc-800/50 p-3">
                    <p className="mb-2 text-xs text-zinc-400">
                      {selectedTech.projects.length}{" "}
                      {locale === "sk" ? "projektov" : "projects"}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {selectedTech.projects.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/projects/${p.slug}`}
                          className="text-zinc-400 transition-colors hover:text-white"
                        >
                          {getProjectTitle(p)}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="py-2 text-sm text-zinc-500">
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
                <h3 className="mb-2 text-sm font-medium text-zinc-300">
                  {locale === "sk"
                    ? "Projekty podľa integrácie"
                    : "Projects by integration"}
                </h3>
                {intPieData.length > 0 ? (
                  <div className="h-[340px] overflow-hidden pt-4 sm:h-[280px]">
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
                              stroke="#52525b"
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
                            <span className="text-xs text-zinc-300">
                              {value} ({entry?.payload?.value ?? 0})
                            </span>
                          )}
                        />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#18181b",
                              border: "1px solid #52525b",
                              borderRadius: "8px",
                              color: "#fafafa",
                            }}
                            itemStyle={{ color: "#fafafa" }}
                            labelStyle={{ color: "#fafafa" }}
                            formatter={(value) => [
                              `${value ?? 0} ${locale === "sk" ? "projektov" : "projects"}`,
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="py-12 text-center text-sm text-zinc-500">
                      {locale === "sk"
                        ? "Žiadne integrácie"
                        : "No integrations"}
                    </p>
                  )}
                </div>

              {/* Right: integrations + projects */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-zinc-300">
                  {locale === "sk"
                    ? "Klikni na integráciu – zobrazia sa projekty"
                    : "Click an integration → see its projects"}
                </h3>
                <div className="mb-2 flex flex-wrap gap-2">
                  {stats.projectsByIntegration.map((item) => (
                    <button
                      key={item.intSlug}
                      type="button"
                      onClick={() =>
                        setSelectedIntSlug(
                          selectedIntSlug === item.intSlug ? null : item.intSlug
                        )
                      }
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors ${
                        selectedIntSlug === item.intSlug
                          ? "bg-zinc-500 text-white"
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white"
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
                  <div className="rounded border border-zinc-600 bg-zinc-800/50 p-3">
                    <p className="mb-2 text-xs text-zinc-400">
                      {selectedInt.projects.length}{" "}
                      {locale === "sk" ? "projektov" : "projects"}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {selectedInt.projects.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/projects/${p.slug}`}
                          className="text-zinc-400 transition-colors hover:text-white"
                        >
                          {getProjectTitle(p)}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="py-2 text-sm text-zinc-500">
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
                <h3 className="mb-4 text-sm font-medium text-zinc-300">
                  {locale === "sk"
                    ? "Projekty podľa kategórie"
                    : "Projects by category"}
                </h3>
                {categoryPieData.length > 0 ? (
                  <div className="overflow-hidden pt-4">
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
                              stroke="#52525b"
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
                            <span className="text-xs text-zinc-300">
                              {value} ({entry?.payload?.value ?? 0})
                            </span>
                          )}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #52525b",
                            borderRadius: "8px",
                            color: "#fafafa",
                          }}
                          itemStyle={{ color: "#fafafa" }}
                          labelStyle={{ color: "#fafafa" }}
                          formatter={(value) => [
                            `${value ?? 0} ${locale === "sk" ? "projektov" : "projects"}`,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-12 text-center text-zinc-500">
                    {locale === "sk" ? "Žiadne dáta" : "No data"}
                  </p>
                )}
              </div>
              <div>
                <h3 className="mb-4 text-sm font-medium text-zinc-300">
                  {locale === "sk"
                    ? "Projekty podľa roka"
                    : "Projects by year"}
                </h3>
                {stats.byYear.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={stats.byYear}
                      margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                    >
                      <XAxis
                        dataKey="year"
                        stroke="#71717a"
                        tick={{ fill: "#d4d4d8", fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#71717a"
                        tick={{ fill: "#d4d4d8", fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Bar
                        dataKey="count"
                        fill="#71717a"
                        radius={[4, 4, 0, 0]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "1px solid #52525b",
                          borderRadius: "8px",
                          color: "#fafafa",
                        }}
                        itemStyle={{ color: "#fafafa" }}
                        labelStyle={{ color: "#fafafa" }}
                        formatter={(value) => [
                          `${value ?? 0} ${locale === "sk" ? "projektov" : "projects"}`,
                        ]}
                        labelFormatter={(label) =>
                          locale === "sk" ? `Rok ${label}` : `Year ${label}`
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-12 text-center text-zinc-500">
                    {locale === "sk" ? "Žiadne dáta" : "No data"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* GitHub Contributions */}
        <div className="mt-8 rounded-xl border border-zinc-600 bg-zinc-900/50 p-6 sm:p-8">
          <h3 className="mb-4 text-sm font-medium text-zinc-300">
            {locale === "sk"
              ? "GitHub príspevky"
              : "GitHub contributions"}
          </h3>
          <a
            href="https://github.com/dadoedo"
            target="_blank"
            rel="noopener noreferrer"
            className="block [&_svg]:max-w-full"
          >
            <GitHubCalendar
              username="dadoedo"
              colorScheme="dark"
              theme={{
                dark: [
                  "#161b22",
                  "#0e4429",
                  "#006d32",
                  "#26a641",
                  "#39d353",
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
          </a>
        </div>
      </div>
    </section>
  );
}
