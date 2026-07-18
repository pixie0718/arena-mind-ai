import { QuickActionsGrid } from "@/components/home/quick-actions-grid";

export default function QuickActionsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pb-10 pt-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl tracking-wide text-foreground uppercase">
          Quick Actions
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Jump straight into a task — every action starts a conversation with
          ArenaMind AI.
        </p>
      </header>
      <QuickActionsGrid />
    </div>
  );
}
