import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";

export function RecentActivity() {
  return (
    <Card className="items-center gap-2 rounded-2xl border-dashed border-white/15 bg-card/40 p-6 text-center text-muted-foreground shadow-none backdrop-blur-xl">
      <Inbox className="size-6" aria-hidden="true" />
      <p className="text-sm font-medium">No recent activity yet</p>
      <p className="text-xs">Your conversations and requests with ArenaMind will show up here.</p>
    </Card>
  );
}
