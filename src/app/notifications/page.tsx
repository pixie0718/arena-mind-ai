import { Bell } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function NotificationsPage() {
  return (
    <ComingSoon
      icon={Bell}
      title="No notifications yet"
      description="Match reminders, order updates, and AI recommendations will appear here."
    />
  );
}
