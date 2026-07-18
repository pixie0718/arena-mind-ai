import { Goal } from "lucide-react";
import { HeroSearch } from "@/components/home/hero-search";
import { QuickActionsGrid } from "@/components/home/quick-actions-grid";
import { DynamicMatchSection } from "@/components/home/dynamic-match-section";
import { RecentActivity } from "@/components/home/recent-activity";
import { FloatingFootballLayer } from "@/components/shared/floating-football-layer";

export default function HomePage() {
  return (
    <>
      <FloatingFootballLayer />
      <div className="mx-auto flex max-w-2xl flex-col pb-10 sm:px-6">
        <div className="relative overflow-hidden px-4 pt-8 pb-14 sm:rounded-b-4xl sm:px-6">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-primary/25 via-background to-secondary/10"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 [background-image:repeating-linear-gradient(115deg,oklch(1_0_0/4%)_0px,oklch(1_0_0/4%)_2px,transparent_2px,transparent_42px)]"
          />
          <div className="relative flex flex-col gap-5">
            <header className="flex flex-col gap-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary">
                <Goal className="size-3.5" aria-hidden="true" />
                Welcome to ArenaMind AI
              </p>
              <h1 className="font-heading text-4xl leading-none tracking-wide text-foreground">
                How can I help you today?
              </h1>
            </header>

            <HeroSearch />
          </div>
        </div>

        <div className="flex flex-col gap-8 px-4 pt-6 sm:px-6">
          <div className="-mt-16">
            <DynamicMatchSection />
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-base tracking-wide text-foreground uppercase">
              Quick Actions
            </h2>
            <QuickActionsGrid />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-base tracking-wide text-foreground uppercase">
              Recent Activity
            </h2>
            <RecentActivity />
          </section>
        </div>
      </div>
    </>
  );
}
