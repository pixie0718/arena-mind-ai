import type { CrowdLevel } from "@/types/knowledge";

/**
 * Small, hand-maintained phrase templates for the visitor's preferred
 * language — the same "demo phrasebook" approach `translation.tool.ts`
 * already established, applied to each agent's own canned reply
 * scaffolding instead of a separate translated phrase. Proper nouns
 * (vendor/facility/gate names) are never translated — only the fixed
 * English sentence shape around them, so nothing is ever fabricated.
 *
 * Falls back to English for any language code outside this set (matches
 * `preferredLanguageAtom`'s three supported codes: en/es/fr).
 */
export type ReplyLanguage = "en" | "es" | "fr";

export function resolveReplyLanguage(language: string | undefined): ReplyLanguage {
  return language === "es" || language === "fr" ? language : "en";
}

const CROWD_LABEL: Record<ReplyLanguage, Record<CrowdLevel, string>> = {
  en: { low: "Low", moderate: "Moderate", high: "High" },
  es: { low: "Bajo", moderate: "Moderado", high: "Alto" },
  fr: { low: "Faible", moderate: "Modéré", high: "Élevé" },
};

export function crowdLabel(level: CrowdLevel, language: string | undefined): string {
  return CROWD_LABEL[resolveReplyLanguage(language)][level];
}

// Feminine agreement for "afluencia" ("moderado" would be grammatically
// wrong Spanish next to a feminine noun — the standalone badge label
// stays masculine since it has no noun to agree with).
const CROWD_ADJECTIVE_ES: Record<CrowdLevel, string> = { low: "baja", moderate: "moderada", high: "alta" };

export function crowdAdjective(level: CrowdLevel, language: string | undefined): string {
  const resolved = resolveReplyLanguage(language);
  if (resolved === "es") return CROWD_ADJECTIVE_ES[level];
  return crowdLabel(level, language).toLowerCase();
}

const CROWD_LEVEL_NOTE: Record<ReplyLanguage, (adjective: string) => string> = {
  en: (adjective) => `${adjective[0].toUpperCase()}${adjective.slice(1)} crowd level (demo data).`,
  es: (adjective) => `Afluencia ${adjective} (datos de demostración).`,
  fr: (adjective) => `Affluence ${adjective} (données de démonstration).`,
};

export function crowdLevelNote(level: CrowdLevel, language: string | undefined): string {
  const resolved = resolveReplyLanguage(language);
  return CROWD_LEVEL_NOTE[resolved](crowdAdjective(level, language));
}

const CROWD_RANK: Record<CrowdLevel, number> = { low: 0, moderate: 1, high: 2 };

/** Ranks lower crowd levels first; entries without a level sort last (unknown, not assumed low). */
export function byCrowdThen<T extends { crowdLevel?: CrowdLevel }>(
  secondary: (a: T, b: T) => number,
) {
  return (a: T, b: T): number => {
    const rankA = a.crowdLevel ? CROWD_RANK[a.crowdLevel] : 3;
    const rankB = b.crowdLevel ? CROWD_RANK[b.crowdLevel] : 3;
    if (rankA !== rankB) return rankA - rankB;
    return secondary(a, b);
  };
}

type Phrases = Record<ReplyLanguage, string>;

function pick(phrases: Phrases, language: string | undefined): string {
  return phrases[resolveReplyLanguage(language)];
}

export const t = {
  foodBestPick: (language: string | undefined, name: string, minutes: number, location: string) =>
    pick(
      {
        en: `${name} is your best bet — about ${minutes} min wait at ${location}.`,
        es: `${name} es tu mejor opción — espera de unos ${minutes} min en ${location}.`,
        fr: `${name} est votre meilleure option — environ ${minutes} min d'attente à ${location}.`,
      },
      language,
    ),
  foodReasonLowCrowd: (language: string | undefined, level: CrowdLevel) =>
    pick(
      {
        en: `Recommended because it currently has the shortest queue and ${crowdAdjective(level, language)} crowd levels (demo data).`,
        es: `Recomendado porque tiene la fila más corta y afluencia ${crowdAdjective(level, language)} (datos de demostración).`,
        fr: `Recommandé car la file est la plus courte avec une affluence ${crowdAdjective(level, language)} (données de démonstration).`,
      },
      language,
    ),
  foodClarify: (language: string | undefined) =>
    pick(
      {
        en: "Tell me what you're craving and I'll find the nearest stall.",
        es: "Dime qué se te antoja y buscaré el puesto más cercano.",
        fr: "Dites-moi ce qui vous ferait envie et je trouverai le stand le plus proche.",
      },
      language,
    ),
  foodOrderAction: (language: string | undefined, name: string) =>
    pick(
      {
        en: `Order from ${name}`,
        es: `Pedir en ${name}`,
        fr: `Commander chez ${name}`,
      },
      language,
    ),
  foodMenuIntro: (language: string | undefined, vendorName: string) =>
    pick(
      {
        en: `Here's the menu at ${vendorName} — tap an item or tell me what you'd like.`,
        es: `Este es el menú de ${vendorName} — toca un artículo o dime qué te gustaría.`,
        fr: `Voici le menu de ${vendorName} — touchez un article ou dites-moi ce que vous voulez.`,
      },
      language,
    ),
  foodOrderConfirmed: (
    language: string | undefined,
    itemName: string,
    vendorName: string,
    price: number,
    orderId: string,
  ) =>
    pick(
      {
        en: `Order confirmed: ${itemName} from ${vendorName} ($${price.toFixed(2)}). Order ID: ${orderId}. Show this at the counter to collect it.`,
        es: `Pedido confirmado: ${itemName} de ${vendorName} ($${price.toFixed(2)}). ID de pedido: ${orderId}. Muestra esto en el mostrador para recogerlo.`,
        fr: `Commande confirmée : ${itemName} chez ${vendorName} (${price.toFixed(2)} $). N° de commande : ${orderId}. Montrez ceci au comptoir pour le récupérer.`,
      },
      language,
    ),
  venueNearest: (language: string | undefined, name: string, section: string, floor: string) =>
    pick(
      {
        en: `${name} is at ${section}, ${floor}.`,
        es: `${name} está en ${section}, ${floor}.`,
        fr: `${name} se trouve à ${section}, ${floor}.`,
      },
      language,
    ),
  venueReasonLowCrowd: (language: string | undefined) =>
    pick(
      {
        en: "Suggested first since it's the least crowded option nearby (demo data).",
        es: "Sugerido primero por ser la opción con menos afluencia cercana (datos de demostración).",
        fr: "Suggéré en premier car c'est l'option la moins fréquentée à proximité (données de démonstration).",
      },
      language,
    ),
  venueClarify: (language: string | undefined) =>
    pick(
      {
        en: "Tell me which facility you're looking for — restroom, charging station, or something else.",
        es: "Dime qué instalación buscas: baño, estación de carga u otra cosa.",
        fr: "Dites-moi quelle installation vous cherchez : toilettes, borne de recharge ou autre.",
      },
      language,
    ),
  venueClarifyPrompt: (language: string | undefined) =>
    pick(
      {
        en: "Which facility are you looking for?",
        es: "¿Qué instalación estás buscando?",
        fr: "Quelle installation recherchez-vous ?",
      },
      language,
    ),
  transportBestPick: (language: string | undefined, name: string, minutes: number, reason: string) =>
    pick(
      {
        en: `${name} is your fastest option — about ${minutes} min. ${reason}`,
        es: `${name} es tu opción más rápida — unos ${minutes} min. ${reason}`,
        fr: `${name} est votre option la plus rapide — environ ${minutes} min. ${reason}`,
      },
      language,
    ),
  transportAlsoConsider: (language: string | undefined) =>
    pick(
      {
        en: "Also worth considering:",
        es: "También puedes considerar:",
        fr: "À considérer également :",
      },
      language,
    ),
  transportClarify: (language: string | undefined) =>
    pick(
      {
        en: "I can help with parking, metro, bus, taxi, rideshare, or walking directions — what are you looking for?",
        es: "Puedo ayudarte con estacionamiento, metro, autobús, taxi, viaje compartido o indicaciones a pie — ¿qué necesitas?",
        fr: "Je peux vous aider avec le stationnement, le métro, le bus, le taxi, le covoiturage ou les indications à pied — que cherchez-vous ?",
      },
      language,
    ),
  sustainabilityLow: (language: string | undefined) =>
    pick(
      {
        en: "Lower-emissions choice — shared or human-powered transit.",
        es: "Opción de menores emisiones — transporte compartido o humano.",
        fr: "Choix à faibles émissions — transport partagé ou à propulsion humaine.",
      },
      language,
    ),
  seatBits: (language: string | undefined, row: string | undefined, seat: string | undefined) => {
    const rowLabel = pick({ en: "Row", es: "Fila", fr: "Rangée" }, language);
    const seatLabel = pick({ en: "Seat", es: "Asiento", fr: "Siège" }, language);
    return [row && `${rowLabel} ${row}`, seat && `${seatLabel} ${seat}`].filter(Boolean).join(", ");
  },
  emergencyExitReason: (language: string | undefined, exitLabel: string, sectionLabel: string) =>
    pick(
      {
        en: `I recommend ${exitLabel} because it's the closest marked exit to ${sectionLabel}.`,
        es: `Recomiendo ${exitLabel} porque es la salida marcada más cercana a ${sectionLabel}.`,
        fr: `Je recommande ${exitLabel} car c'est la sortie balisée la plus proche de ${sectionLabel}.`,
      },
      language,
    ),
  emergencyHelpSummary: (
    language: string | undefined,
    acknowledge: string,
    sectionLabel: string,
    seatBits: string,
    medicalLabel: string,
    etaMinutes: number,
    instructions: string,
    routingExplanation: string,
  ) =>
    pick(
      {
        en: `${acknowledge} You're at ${sectionLabel}${seatBits ? ` — ${seatBits}` : ""}. Nearest help: ${medicalLabel}, about ${etaMinutes} min away. ${instructions} ${routingExplanation}`,
        es: `${acknowledge} Estás en ${sectionLabel}${seatBits ? ` — ${seatBits}` : ""}. Ayuda más cercana: ${medicalLabel}, a unos ${etaMinutes} min. ${instructions} ${routingExplanation}`,
        fr: `${acknowledge} Vous êtes à ${sectionLabel}${seatBits ? ` — ${seatBits}` : ""}. Aide la plus proche : ${medicalLabel}, à environ ${etaMinutes} min. ${instructions} ${routingExplanation}`,
      },
      language,
    ),
  emergencyLocationUnknown: (
    language: string | undefined,
    acknowledge: string,
    venueBit: string,
    notFoundBit: string,
    instructions: string,
  ) =>
    pick(
      {
        en: `${acknowledge} Help is being notified${venueBit}.${notFoundBit} ${instructions} What section are you in, so I can send the nearest team directly to you?`,
        es: `${acknowledge} Se está notificando a ayuda${venueBit}.${notFoundBit} ${instructions} ¿En qué sección estás, para poder enviar al equipo más cercano directamente a ti?`,
        fr: `${acknowledge} L'aide est notifiée${venueBit}.${notFoundBit} ${instructions} Dans quelle section êtes-vous, afin que je puisse envoyer l'équipe la plus proche directement vers vous ?`,
      },
      language,
    ),
  emergencyNotFoundBit: (language: string | undefined, query: string) =>
    pick(
      {
        en: ` I couldn't find "${query}" in this stadium.`,
        es: ` No pude encontrar "${query}" en este estadio.`,
        fr: ` Je n'ai pas trouvé "${query}" dans ce stade.`,
      },
      language,
    ),
  emergencyVenueBit: (language: string | undefined, stadiumName: string) =>
    pick(
      {
        en: ` at ${stadiumName}`,
        es: ` en ${stadiumName}`,
        fr: ` à ${stadiumName}`,
      },
      language,
    ),
  emergencyClarifyPrompt: (language: string | undefined) =>
    pick(
      {
        en: "Which section are you in?",
        es: "¿En qué sección estás?",
        fr: "Dans quelle section êtes-vous ?",
      },
      language,
    ),
  navSectionFound: (
    language: string | undefined,
    sectionLabel: string,
    seatBits: string,
    gate: string,
    minutes: number,
  ) =>
    pick(
      {
        en: `${sectionLabel}${seatBits ? ` — ${seatBits}` : ""} is closest to Gate ${gate}. Estimated walking time: ${minutes} minutes.`,
        es: `${sectionLabel}${seatBits ? ` — ${seatBits}` : ""} está más cerca de la Puerta ${gate}. Tiempo estimado caminando: ${minutes} minutos.`,
        fr: `${sectionLabel}${seatBits ? ` — ${seatBits}` : ""} est le plus proche de la Porte ${gate}. Temps de marche estimé : ${minutes} minutes.`,
      },
      language,
    ),
  navAskRowSeat: (language: string | undefined) =>
    pick(
      {
        en: ' Want exact seat directions? Tell me your row and seat number, e.g. "Row F, Seat 18".',
        es: ' ¿Quieres indicaciones exactas hasta tu asiento? Dime tu fila y número de asiento, p. ej. "Fila F, Asiento 18".',
        fr: ' Vous voulez un itinéraire précis jusqu\'à votre siège ? Indiquez-moi votre rangée et votre numéro de siège, ex. « Rangée F, Siège 18 ».',
      },
      language,
    ),
  navRestroomFound: (language: string | undefined, section: string, floor: string) =>
    pick(
      {
        en: `The nearest restroom is at ${section}, ${floor}.`,
        es: `El baño más cercano está en ${section}, ${floor}.`,
        fr: `Les toilettes les plus proches se trouvent à ${section}, ${floor}.`,
      },
      language,
    ),
  navRestroomReason: (language: string | undefined) =>
    pick(
      {
        en: "Recommended because it currently has the lowest crowd level nearby (demo data).",
        es: "Recomendado porque tiene la menor afluencia cercana (datos de demostración).",
        fr: "Recommandé car il a actuellement la plus faible affluence à proximité (données de démonstration).",
      },
      language,
    ),
  fallbackUnknownIntent: (language: string | undefined) =>
    pick(
      {
        en: "I'm not sure I understood that yet. You can ask me to find your seat, order food, get emergency help, translate a phrase, or check transport options.",
        es: "Aún no estoy seguro de haber entendido eso. Puedes pedirme que encuentre tu asiento, pidas comida, obtengas ayuda de emergencia, traduzca una frase o revise opciones de transporte.",
        fr: "Je ne suis pas certain d'avoir compris. Vous pouvez me demander de trouver votre siège, commander à manger, obtenir de l'aide d'urgence, traduire une phrase ou consulter les options de transport.",
      },
      language,
    ),
  fallbackValidationFailed: (language: string | undefined) =>
    pick(
      {
        en: "I ran into an issue putting together a safe response. Could you rephrase that?",
        es: "Tuve un problema al preparar una respuesta segura. ¿Podrías reformular eso?",
        fr: "J'ai rencontré un problème en préparant une réponse fiable. Pourriez-vous reformuler ?",
      },
      language,
    ),
  sustainabilityHigh: (language: string | undefined) =>
    pick(
      {
        en: "Higher-emissions choice — consider metro or the shuttle bus if timing allows.",
        es: "Opción de mayores emisiones — considera el metro o el autobús lanzadera si el tiempo lo permite.",
        fr: "Choix à émissions plus élevées — envisagez le métro ou la navette si le temps le permet.",
      },
      language,
    ),
} as const;
