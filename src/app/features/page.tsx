// src/app/features/page.tsx
import { Metadata } from "next";
import FeaturesForm from "@/app/components/FeaturesForm";

export const metadata: Metadata = {
  title: "Proposer une fonctionnalité | PlanniKeeper",
  description:
    "Proposez de nouvelles fonctionnalités ou signalez des bugs pour PlanniKeeper",
};

export default function FeaturesPage() {
  return (
    <div className="container max-w-3xl px-4 py-8 mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-[color:var(--foreground)]">
        Proposer une amélioration
      </h1>

      <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-6 shadow-sm mb-6">
        <p className="text-[color:var(--foreground)] mb-4">
          Nous sommes constamment à la recherche de moyens d&apos;améliorer
          PlanniKeeper. Si vous avez une idée de fonctionnalité ou si vous avez
          rencontré un bug, n&apos;hésitez pas à nous en faire part !
        </p>

        <FeaturesForm />
      </div>

      <div className="bg-[color:var(--muted)] border border-[color:var(--border)] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3 text-[color:var(--foreground)]">
          À propos du processus
        </h2>
        <ul className="space-y-2 text-[color:var(--foreground)]">
          <li className="flex items-start gap-2">
            <span className="text-[color:var(--primary)] flex-shrink-0 mt-1">
              •
            </span>
            <span>
              Toutes les propositions sont examinées par notre équipe.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[color:var(--primary)] flex-shrink-0 mt-1">
              •
            </span>
            <span>
              Nous priorisons les fonctionnalités en fonction de leur impact
              global et de leur faisabilité.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[color:var(--primary)] flex-shrink-0 mt-1">
              •
            </span>
            <span>
              Les bugs signalés sont traités en priorité selon leur gravité.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[color:var(--primary)] flex-shrink-0 mt-1">
              •
            </span>
            <span>
              Vous pouvez également nous contacter directement à{" "}
              <a
                href="mailto:support@plannikeeper.ch"
                className="text-[color:var(--primary)] hover:underline"
              >
                support@plannikeeper.ch
              </a>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
