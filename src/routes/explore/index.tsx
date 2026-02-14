import { Link, createFileRoute } from "@tanstack/react-router";

import { SectionHeader } from "@/components/section-header";

export const Route = createFileRoute("/explore/")({
  component: ExploreHubPage,
});

type ExploreDestination = {
  title: string;
  tag: string;
  question: string;
  description: string;
  to: "/explore/crosstab" | "/columns" | "/profile" | "/relationships" | "/data-quality";
  cta: string;
  featured?: boolean;
};

const DESTINATIONS: ExploreDestination[] = [
  {
    title: "Compare Questions",
    tag: "Most popular",
    question: "\"How does political orientation break down by gender?\"",
    description: "Pick any two questions, compare their distributions side-by-side, and drill into specific cells.",
    to: "/explore/crosstab",
    cta: "Open Compare Questions",
    featured: true,
  },
  {
    title: "Browse Topics",
    tag: "Catalog",
    question: "\"What questions does this survey actually ask?\"",
    description: "Search all 365 questions by keyword or topic, and inspect answer distributions and metadata.",
    to: "/columns",
    cta: "Open Browse Topics",
  },
  {
    title: "Build a Profile",
    tag: "Cohorts",
    question: "\"What makes bisexual women different from the rest of the sample?\"",
    description: "Define a group with filters and see which answers over-index compared with everyone else.",
    to: "/profile",
    cta: "Open Profile Builder",
  },
  {
    title: "What's Connected?",
    tag: "Associations",
    question: "\"Which questions correlate most strongly with age?\"",
    description: "Start from one question and find the strongest statistical relationships across the survey.",
    to: "/relationships",
    cta: "Open Relationships",
  },
  {
    title: "Data Quality",
    tag: "Reliability",
    question: "\"Can I trust the results for this question?\"",
    description: "Check missingness, caveats, and completeness before making stronger claims.",
    to: "/data-quality",
    cta: "Open Data Quality",
  },
];

function ExploreHubPage() {
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Explore the Data</h1>
        <p className="page-subtitle">
          Start where your question is: compare answers directly, inspect topics, build cohorts, or audit reliability.
        </p>
      </header>

      <section className="space-y-4">
        <SectionHeader number="01" title="Pick a path" subtitle="Each page answers a different kind of question." />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DESTINATIONS.map((destination) => {
            const isFeatured = destination.featured === true;

            return (
              <article
                key={destination.title}
                className={`h-full border p-4 ${isFeatured ? "border-[var(--ink)] bg-[var(--paper-warm)]" : "border-[var(--rule)] bg-[var(--paper)]"}`}
              >
                <div className="flex h-full flex-col gap-3">
                  <p className={`mono-label ${isFeatured ? "text-[var(--accent)]" : "text-[var(--ink-faded)]"}`}>
                    {destination.tag}
                  </p>
                  <h2 className="font-['Fraunces',Georgia,serif] text-[1.35rem] leading-tight">
                    {destination.title}
                  </h2>
                  <p className="font-['Source_Serif_4',Georgia,serif] text-[0.95rem] italic text-[var(--ink)]">
                    {destination.question}
                  </p>
                  <p className="text-[0.88rem] text-[var(--ink-light)]">{destination.description}</p>
                  <div className="mt-auto pt-1">
                    <Link
                      to={destination.to}
                      className={`editorial-button inline-flex w-full justify-center text-center ${isFeatured ? "editorial-button--filled" : ""}`}
                    >
                      {destination.cta}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
