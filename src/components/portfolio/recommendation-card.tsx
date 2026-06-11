"use client";

import Link from "next/link";
import { usePrivacy } from "@/components/providers/privacy-provider";
import type {
  PortfolioRecommendation,
  PortfolioRecommendationSeverity,
} from "@/lib/portfolio/types";

export function PortfolioRecommendationCard({
  recommendations,
}: {
  recommendations: PortfolioRecommendation[];
}) {
  const { privacyEnabled } = usePrivacy();

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-bold">Rekomendasi Portfolio</h2>
        <p className="mt-1 text-sm text-muted">
          Tindakan singkat dari kondisi aset, hutang, dan alokasi kamu.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-5 text-sm text-muted shadow-card">
          Belum ada rekomendasi portfolio khusus.
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((recommendation) => {
            const tone = getSeverityTone(recommendation.severity);
            const body =
              privacyEnabled && recommendation.privacyBody
                ? recommendation.privacyBody
                : recommendation.body;

            return (
              <article
                key={recommendation.id}
                className={`rounded-card border p-5 shadow-card ${tone.card}`}
              >
                <p className={`text-xs font-bold uppercase ${tone.label}`}>
                  {tone.labelText}
                </p>
                <h3 className="mt-2 font-bold">{recommendation.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
                {recommendation.actionHref && recommendation.actionLabel && (
                  <Link
                    href={recommendation.actionHref}
                    className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-accent-strong"
                  >
                    {recommendation.actionLabel} →
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getSeverityTone(severity: PortfolioRecommendationSeverity) {
  if (severity === "danger") {
    return {
      labelText: "Prioritas",
      label: "text-expense",
      card: "border-expense/30 bg-expense/10",
    };
  }

  if (severity === "warning") {
    return {
      labelText: "Perhatian",
      label: "text-expense/90",
      card: "border-expense/20 bg-expense/5",
    };
  }

  if (severity === "good") {
    return {
      labelText: "Bagus",
      label: "text-income",
      card: "border-income/20 bg-income/10",
    };
  }

  return {
    labelText: "Insight",
    label: "text-accent-strong",
    card: "border-border bg-surface",
  };
}
