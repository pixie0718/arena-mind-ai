/**
 * Configurable demo crowd data — NOT a real crowd-prediction system.
 * Hand-set per record in the knowledge base JSON so agents can factor
 * relative crowding into recommendations (e.g. prefer a quieter exit or
 * vendor). Surfaced to users as clearly-labeled demo data, never implied
 * to be live.
 */
export type CrowdLevel = "low" | "moderate" | "high";

export type Stadium = {
  id: string;
  name: string;
  city: string;
  country: string;
  gates: string[];
  sections: string[];
  emergencyPoints: { id: string; label: string; location: string }[];
};

export type Match = {
  id: string;
  stadiumId: string;
  date: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
};

export type Facility = {
  id: string;
  stadiumId: string;
  type:
    | "restroom"
    | "medical"
    | "merchandise"
    | "prayer_room"
    | "charging_station"
    | "water_station"
    | "elevator";
  name: string;
  floor: string;
  section: string;
  accessible: boolean;
  crowdLevel?: CrowdLevel;
};

export type Vendor = {
  id: string;
  stadiumId: string;
  name: string;
  category: string;
  location: string;
  queueEstimateMinutes: number;
  crowdLevel?: CrowdLevel;
  menu: { id: string; name: string; price: number; dietary?: string[] }[];
};

export type TransportOption = {
  id: string;
  stadiumId: string;
  type: "metro" | "bus" | "taxi" | "rideshare" | "parking" | "walking";
  name: string;
  etaMinutes: number;
  notes: string;
  crowdLevel?: CrowdLevel;
};

export type AccessibilityInfo = {
  id: string;
  stadiumId: string;
  feature: string;
  location: string;
  description: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export type Route = {
  id: string;
  stadiumId: string;
  from: string;
  to: string;
  steps: string[];
  estimatedMinutes: number;
  accessible: boolean;
};
