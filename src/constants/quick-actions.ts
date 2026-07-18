import type { LucideIcon } from "lucide-react";
import {
  MapPin,
  Siren,
  UtensilsCrossed,
  Languages,
  PackageSearch,
  Info,
  ToiletIcon,
  DoorOpen,
} from "lucide-react";

export type QuickAction = {
  id: string;
  label: string;
  prompt: string;
  icon: LucideIcon;
  tone?: "default" | "emergency";
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "find-seat",
    label: "Find My Seat",
    prompt: "Take me to my seat.",
    icon: MapPin,
  },
  {
    id: "order-food",
    label: "Order Food",
    prompt: "I'm hungry, what's nearby?",
    icon: UtensilsCrossed,
  },
  {
    id: "emergency",
    label: "Emergency SOS",
    prompt: "I need emergency assistance.",
    icon: Siren,
    tone: "emergency",
  },
  {
    id: "translate",
    label: "Translate",
    prompt: "Help me translate something.",
    icon: Languages,
  },
  {
    id: "lost-item",
    label: "Lost Item",
    prompt: "I lost an item.",
    icon: PackageSearch,
  },
  {
    id: "match-info",
    label: "Match Info",
    prompt: "Tell me about today's match.",
    icon: Info,
  },
  {
    id: "find-restroom",
    label: "Find Restroom",
    prompt: "Where is the nearest restroom?",
    icon: ToiletIcon,
  },
  {
    id: "exit-guide",
    label: "Exit Guide",
    prompt: "What's the fastest exit?",
    icon: DoorOpen,
  },
];
