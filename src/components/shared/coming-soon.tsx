import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
      <span className="glow-secondary flex size-12 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h1 className="font-heading text-xl tracking-wide text-foreground uppercase">{title}</h1>
      <p className="text-sm font-medium text-muted-foreground">{description}</p>
    </div>
  );
}
