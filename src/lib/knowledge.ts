import type {
  AccessibilityInfo,
  Facility,
  FaqItem,
  Match,
  Route,
  Stadium,
  TransportOption,
  Vendor,
} from "@/types/knowledge";

import metlife from "@/knowledge/stadiums/metlife.json";
import hardrock from "@/knowledge/stadiums/hardrock.json";
import azteca from "@/knowledge/stadiums/azteca.json";
import demoMatches from "@/knowledge/matches/demo-matches.json";
import metlifeFacilities from "@/knowledge/facilities/metlife-facilities.json";
import metlifeVendors from "@/knowledge/vendors/metlife-vendors.json";
import metlifeTransport from "@/knowledge/transport/metlife-transport.json";
import metlifeAccessibility from "@/knowledge/accessibility/metlife-accessibility.json";
import generalFaq from "@/knowledge/faq/general-faq.json";
import metlifeRoutes from "@/knowledge/routes/metlife-routes.json";

const stadiums: Stadium[] = [metlife, hardrock, azteca];
const matches: Match[] = demoMatches;
const facilities: Facility[] = metlifeFacilities as Facility[];
const vendors: Vendor[] = metlifeVendors as Vendor[];
const transportOptions: TransportOption[] = metlifeTransport as TransportOption[];
const accessibilityInfo: AccessibilityInfo[] = metlifeAccessibility;
const faqs: FaqItem[] = generalFaq;
const routes: Route[] = metlifeRoutes;

export function getStadium(stadiumId: string): Stadium | undefined {
  return stadiums.find((stadium) => stadium.id === stadiumId);
}

export function getUpcomingMatch(stadiumId: string): Match | undefined {
  return matches.find((match) => match.stadiumId === stadiumId);
}

export function getFacilities(stadiumId: string): Facility[] {
  return facilities.filter((facility) => facility.stadiumId === stadiumId);
}

export function getVendors(stadiumId: string): Vendor[] {
  return vendors.filter((vendor) => vendor.stadiumId === stadiumId);
}

export function getTransportOptions(stadiumId: string): TransportOption[] {
  return transportOptions.filter((option) => option.stadiumId === stadiumId);
}

export function getAccessibilityInfo(stadiumId: string): AccessibilityInfo[] {
  return accessibilityInfo.filter((info) => info.stadiumId === stadiumId);
}

export function getFaqs(): FaqItem[] {
  return faqs;
}

export function getRoutes(stadiumId: string): Route[] {
  return routes.filter((route) => route.stadiumId === stadiumId);
}

/**
 * Finds the best-matching route to a destination for a given stadium.
 * Falls back to the stadium's first route so agents always have grounded
 * directions to work with, even for a destination not yet in the demo
 * dataset.
 */
export function findRoute(stadiumId: string, to: string): Route | undefined {
  const stadiumRoutes = getRoutes(stadiumId);
  const normalizedTo = to.toLowerCase();
  return (
    stadiumRoutes.find((route) => route.to.toLowerCase().includes(normalizedTo)) ??
    stadiumRoutes[0]
  );
}
