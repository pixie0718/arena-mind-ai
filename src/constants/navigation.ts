import type { LucideIcon } from "lucide-react";
import { Home, MessageCircle, Grid2x2, Bell, User } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Assistant", href: "/chat", icon: MessageCircle },
  { label: "Quick Actions", href: "/quick-actions", icon: Grid2x2 },
  { label: "Alerts", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: User },
];
