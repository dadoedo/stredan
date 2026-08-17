"use client";

import { useLayoutEffect, useState } from "react";
import { ui, type Locale } from "@/lib/translations";
import {
  CompactProject,
  JobEntry,
  ProjectCard,
  type PortfolioJob,
  type PortfolioProject,
} from "@/components/portfolio";

type Tab = "work" | "experience";

interface WorkExperienceSectionProps {
  locale: Locale;
  featured: PortfolioProject[];
  other: PortfolioProject[];
  legacy: PortfolioProject[];
  jobs: PortfolioJob[];
}

function scrollToWorkSection() {
  const el = document.getElementById("work");
  if (!el) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
}

export function WorkExperienceSection({
  locale,
  featured,
  other,
  legacy,
  jobs,
}: WorkExperienceSectionProps) {
  const t = ui[locale];
  const [activeTab, setActiveTab] = useState<Tab>("work");

  useLayoutEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash === "experience") setActiveTab("experience");
      else if (hash === "work") setActiveTab("work");
      if (hash === "work" || hash === "experience") {
        scrollToWorkSection();
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    const hash = tab === "work" ? "#work" : "#experience";
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  };

  const workBlock = (
    <div>
      <h2 className="font-heading text-3xl font-semibold tracking-tight">
        {t.selectedWork}
      </h2>
      <div className="mt-12 columns-1 gap-4 sm:columns-2">
        {featured.map((project) => (
          <ProjectCard key={project.slug} project={project} locale={locale} />
        ))}
      </div>

      <div className="mt-16">
        <h3 className="font-heading text-2xl font-semibold tracking-tight">
          {t.otherProjects}
        </h3>
        <div className="mt-8 divide-y divide-border">
          {other.map((project) => (
            <CompactProject key={project.slug} project={project} locale={locale} />
          ))}
        </div>

        {legacy.length > 0 && (
          <>
            <h4 className="mt-12 font-heading text-lg font-medium text-muted">
              {t.legacy}
            </h4>
            <div className="mt-4 divide-y divide-border/50">
              {legacy.map((project) => (
                <CompactProject key={project.slug} project={project} locale={locale} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const experienceBlock = (
    <div id="experience">
      <h2 className="font-heading text-3xl font-semibold tracking-tight">
        {t.experience}
      </h2>
      <div className="mt-12 space-y-12">
        {jobs.map((job) => (
          <JobEntry key={job.slug} job={job} locale={locale} />
        ))}
      </div>
    </div>
  );

  return (
    <section id="work" className="px-6 py-24" aria-labelledby="work-experience-heading">
      <div className="mx-auto max-w-5xl">
        <h2 id="work-experience-heading" className="sr-only">
          {t.workExperienceGroup}
        </h2>

        <div
          className="flex gap-1 rounded-lg border border-border p-1"
          role="group"
          aria-label={t.workExperienceGroup}
        >
          <button
            type="button"
            aria-pressed={activeTab === "work"}
            aria-label={t.showWorkFirst}
            onClick={() => selectTab("work")}
            className={`min-h-11 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "work"
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.selectedWork}
          </button>
          <button
            type="button"
            aria-pressed={activeTab === "experience"}
            aria-label={t.showExperienceFirst}
            onClick={() => selectTab("experience")}
            className={`min-h-11 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "experience"
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.experience}
          </button>
        </div>

        <div className="mt-12 flex flex-col gap-24">
          {activeTab === "work" ? (
            <>
              {workBlock}
              {experienceBlock}
            </>
          ) : (
            <>
              {experienceBlock}
              {workBlock}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
