import type { AgentDefinition, AgentRequest, AgentResponse, SuggestedAction } from "@/types/agent";
import type { EmergencyCategory } from "@/types/intent";
import { getTool } from "@/ai/tool-registry";
import { parseSeatQuery } from "@/ai/seat-query-parser";
import { generateId } from "@/utils/id";
import type { EmergencyDispatchResult } from "@/tools/emergency.tool";
import type { EmergencyMetadata } from "@/features/emergency/types/emergency-metadata.types";
import { resolveReplyLanguage, t, type ReplyLanguage } from "@/ai/reply-i18n";

export interface EmergencyReport {
  id: string;
  sessionId: string;
  category: EmergencyCategory | "unspecified";
  stadiumId: string;
  sectionId?: string;
  reportedAt: string;
}

// In-memory incident log, MVP — harmless, unread elsewhere, mirrors the
// original file's scope exactly.
const emergencyLog: EmergencyReport[] = [];

type Category = EmergencyCategory | "unspecified";

interface CategoryScript {
  acknowledge: string;
  instructions: string;
  contactInstructions: string;
  primaryAction: SuggestedAction;
  secondaryAction: SuggestedAction;
  suggestedActions: SuggestedAction[];
}

type ActionKey =
  | "call_volunteer"
  | "show_medical_room"
  | "navigate_exit"
  | "share_location"
  | "find_security"
  | "translate_phrase";

const ACTION_PROMPTS: Record<ActionKey, string> = {
  call_volunteer: "Connect me with a volunteer near my section.",
  show_medical_room: "Show me the nearest medical room.",
  navigate_exit: "Guide me to the nearest exit.",
  share_location: "Share my location with the emergency team.",
  find_security: "Connect me with stadium security.",
  translate_phrase: "Translate 'I need help' for someone nearby.",
};

// Action button labels never change intent routing (only `prompt` is
// re-sent as the next user message, and stays English so the
// keyword-based intent engine keeps matching) — only the visible `label`
// is localized.
const ACTION_LABELS: Record<ActionKey, Record<ReplyLanguage, string>> = {
  call_volunteer: { en: "Call Volunteer", es: "Llamar a un Voluntario", fr: "Appeler un Bénévole" },
  show_medical_room: { en: "Show Nearest Medical Room", es: "Ver Sala Médica Más Cercana", fr: "Voir la Salle Médicale la Plus Proche" },
  navigate_exit: { en: "Navigate to Exit", es: "Ir a la Salida", fr: "Aller à la Sortie" },
  share_location: { en: "Share My Location", es: "Compartir Mi Ubicación", fr: "Partager Ma Position" },
  find_security: { en: "Find Security", es: "Buscar Seguridad", fr: "Trouver la Sécurité" },
  translate_phrase: { en: "Translate Emergency Phrase", es: "Traducir Frase de Emergencia", fr: "Traduire une Phrase d'Urgence" },
};

function action(key: ActionKey, language: ReplyLanguage): SuggestedAction {
  return { label: ACTION_LABELS[key][language], prompt: ACTION_PROMPTS[key] };
}

interface CategoryText {
  acknowledge: string;
  instructions: string;
  contactInstructions: string;
}

const CATEGORY_TEXT: Record<Category, Record<ReplyLanguage, CategoryText>> = {
  medical: {
    en: { acknowledge: "Medical help is being notified.", instructions: "Stay where you are if it's safe to do so.", contactInstructions: "A stadium volunteer has been notified and is heading to your section. Wave down any staff member in a yellow vest if you need help sooner." },
    es: { acknowledge: "Se está notificando a ayuda médica.", instructions: "Quédate donde estás si es seguro hacerlo.", contactInstructions: "Un voluntario del estadio ha sido notificado y se dirige a tu sección. Haz señas a cualquier miembro del personal con chaleco amarillo si necesitas ayuda antes." },
    fr: { acknowledge: "L'aide médicale a été notifiée.", instructions: "Restez où vous êtes si c'est sans danger.", contactInstructions: "Un bénévole du stade a été notifié et se dirige vers votre section. Faites signe à tout membre du personnel en gilet jaune si vous avez besoin d'aide plus tôt." },
  },
  injury: {
    en: { acknowledge: "I've flagged this as an injury.", instructions: "Try to keep the injured person still and comfortable.", contactInstructions: "A medical team has been alerted to your section. Flag down any staff member in a yellow vest if the situation changes." },
    es: { acknowledge: "He marcado esto como una lesión.", instructions: "Intenta mantener a la persona lesionada quieta y cómoda.", contactInstructions: "Un equipo médico ha sido alertado en tu sección. Haz señas a cualquier miembro del personal con chaleco amarillo si la situación cambia." },
    fr: { acknowledge: "J'ai signalé ceci comme une blessure.", instructions: "Essayez de garder la personne blessée immobile et confortable.", contactInstructions: "Une équipe médicale a été alertée dans votre section. Faites signe à tout membre du personnel en gilet jaune si la situation change." },
  },
  fire: {
    en: { acknowledge: "Fire response has been alerted.", instructions: "Move calmly toward the nearest marked exit — do not use elevators.", contactInstructions: "Stadium safety staff have been notified. Follow any instructions from staff or public address announcements." },
    es: { acknowledge: "Se ha alertado a la respuesta contra incendios.", instructions: "Muévete con calma hacia la salida marcada más cercana — no uses los elevadores.", contactInstructions: "El personal de seguridad del estadio ha sido notificado. Sigue las instrucciones del personal o los anuncios por altavoz." },
    fr: { acknowledge: "L'équipe incendie a été alertée.", instructions: "Dirigez-vous calmement vers la sortie balisée la plus proche — n'utilisez pas les ascenseurs.", contactInstructions: "Le personnel de sécurité du stade a été notifié. Suivez les instructions du personnel ou les annonces au haut-parleur." },
  },
  crowd: {
    en: { acknowledge: "Crowd safety has been alerted.", instructions: "Move sideways out of the crowd flow rather than against it, toward the nearest marked exit.", contactInstructions: "Stadium safety staff have been notified of the crowding in your area." },
    es: { acknowledge: "Se ha alertado a seguridad de multitudes.", instructions: "Muévete lateralmente para salir del flujo de la multitud, en lugar de contra él, hacia la salida marcada más cercana.", contactInstructions: "El personal de seguridad del estadio ha sido notificado de la aglomeración en tu área." },
    fr: { acknowledge: "La sécurité de la foule a été alertée.", instructions: "Déplacez-vous latéralement hors du flux de la foule plutôt qu'à contre-courant, vers la sortie balisée la plus proche.", contactInstructions: "Le personnel de sécurité du stade a été informé de l'affluence dans votre zone." },
  },
  security: {
    en: { acknowledge: "Security has been alerted.", instructions: "Move away from the situation if you can do so safely.", contactInstructions: "Stadium security has been notified and is responding to your section." },
    es: { acknowledge: "Se ha alertado a seguridad.", instructions: "Aléjate de la situación si puedes hacerlo de forma segura.", contactInstructions: "La seguridad del estadio ha sido notificada y está respondiendo a tu sección." },
    fr: { acknowledge: "La sécurité a été alertée.", instructions: "Éloignez-vous de la situation si vous pouvez le faire en toute sécurité.", contactInstructions: "La sécurité du stade a été notifiée et intervient dans votre section." },
  },
  suspicious_activity: {
    en: { acknowledge: "This has been flagged to security.", instructions: "Do not touch or approach anything suspicious — keep a safe distance.", contactInstructions: "Stadium security has been notified and will assess your section." },
    es: { acknowledge: "Esto ha sido reportado a seguridad.", instructions: "No toques ni te acerques a nada sospechoso — mantén una distancia segura.", contactInstructions: "La seguridad del estadio ha sido notificada y evaluará tu sección." },
    fr: { acknowledge: "Ceci a été signalé à la sécurité.", instructions: "Ne touchez ni n'approchez rien de suspect — gardez une distance de sécurité.", contactInstructions: "La sécurité du stade a été notifiée et évaluera votre section." },
  },
  lost_child: {
    en: { acknowledge: "Lost-child alert sent to staff.", instructions: "Stay in a visible, well-lit spot near your section so staff can find you.", contactInstructions: "Stadium staff have been alerted and will begin checking nearby family/help points." },
    es: { acknowledge: "Alerta de niño perdido enviada al personal.", instructions: "Permanece en un lugar visible y bien iluminado cerca de tu sección para que el personal pueda encontrarte.", contactInstructions: "El personal del estadio ha sido alertado y comenzará a revisar los puntos de ayuda familiar cercanos." },
    fr: { acknowledge: "Alerte enfant perdu envoyée au personnel.", instructions: "Restez dans un endroit visible et bien éclairé près de votre section pour que le personnel puisse vous trouver.", contactInstructions: "Le personnel du stade a été alerté et va vérifier les points d'aide famille à proximité." },
  },
  volunteer_request: {
    en: { acknowledge: "A volunteer is being sent your way.", instructions: "Stay near your section so the volunteer can find you.", contactInstructions: "A stadium volunteer has been notified of your request." },
    es: { acknowledge: "Se está enviando un voluntario hacia ti.", instructions: "Permanece cerca de tu sección para que el voluntario pueda encontrarte.", contactInstructions: "Un voluntario del estadio ha sido notificado de tu solicitud." },
    fr: { acknowledge: "Un bénévole est envoyé vers vous.", instructions: "Restez près de votre section pour que le bénévole puisse vous trouver.", contactInstructions: "Un bénévole du stade a été notifié de votre demande." },
  },
  wheelchair_assistance: {
    en: { acknowledge: "Wheelchair assistance is being arranged.", instructions: "Stay where you are — an accessible route will be arranged to meet you.", contactInstructions: "A stadium volunteer trained in accessibility assistance has been notified." },
    es: { acknowledge: "Se está organizando asistencia en silla de ruedas.", instructions: "Permanece donde estás — se organizará una ruta accesible para encontrarte.", contactInstructions: "Un voluntario del estadio capacitado en asistencia de accesibilidad ha sido notificado." },
    fr: { acknowledge: "Une assistance en fauteuil roulant est organisée.", instructions: "Restez où vous êtes — un itinéraire accessible sera organisé pour vous rejoindre.", contactInstructions: "Un bénévole du stade formé à l'assistance accessibilité a été notifié." },
  },
  unspecified: {
    en: { acknowledge: "Emergency assistance has been requested.", instructions: "Stay where you are if it's safe to do so.", contactInstructions: "A stadium volunteer has been notified and is heading your way." },
    es: { acknowledge: "Se ha solicitado asistencia de emergencia.", instructions: "Quédate donde estás si es seguro hacerlo.", contactInstructions: "Un voluntario del estadio ha sido notificado y se dirige hacia ti." },
    fr: { acknowledge: "Une assistance d'urgence a été demandée.", instructions: "Restez où vous êtes si c'est sans danger.", contactInstructions: "Un bénévole du stade a été notifié et se dirige vers vous." },
  },
};

const CATEGORY_ACTIONS: Record<Category, { primary: ActionKey; secondary: ActionKey; extra: ActionKey[] }> = {
  medical: { primary: "show_medical_room", secondary: "call_volunteer", extra: ["share_location", "translate_phrase"] },
  injury: { primary: "show_medical_room", secondary: "call_volunteer", extra: ["share_location"] },
  fire: { primary: "navigate_exit", secondary: "share_location", extra: ["call_volunteer"] },
  crowd: { primary: "navigate_exit", secondary: "share_location", extra: ["call_volunteer"] },
  security: { primary: "find_security", secondary: "share_location", extra: ["call_volunteer"] },
  suspicious_activity: { primary: "find_security", secondary: "share_location", extra: [] },
  lost_child: { primary: "find_security", secondary: "call_volunteer", extra: ["share_location"] },
  volunteer_request: { primary: "call_volunteer", secondary: "share_location", extra: [] },
  wheelchair_assistance: { primary: "call_volunteer", secondary: "navigate_exit", extra: ["share_location"] },
  unspecified: { primary: "call_volunteer", secondary: "share_location", extra: ["find_security", "translate_phrase"] },
};

function buildCategoryScript(category: Category, language: ReplyLanguage): CategoryScript {
  const text = CATEGORY_TEXT[category][language];
  const actions = CATEGORY_ACTIONS[category];
  return {
    ...text,
    primaryAction: action(actions.primary, language),
    secondaryAction: action(actions.secondary, language),
    suggestedActions: actions.extra.map((key) => action(key, language)),
  };
}

async function handle(request: AgentRequest): Promise<AgentResponse> {
  const category: Category = request.emergencyCategory ?? "unspecified";
  const language = resolveReplyLanguage(request.context.language);
  const script = buildCategoryScript(category, language);
  const toolCalls: AgentResponse["toolCalls"] = [];
  const incidentId = generateId("incident");

  // Fresh mention in this message always wins over a previously linked
  // location — only fall back to memory when nothing was said this turn.
  const freshQuery = parseSeatQuery(request.message.content);
  const sectionId = freshQuery.sectionId ?? request.context.linkedTicket?.block ?? undefined;
  const row = freshQuery.row ?? request.context.linkedTicket?.row ?? undefined;
  const seat = freshQuery.seatNumber ?? request.context.linkedTicket?.seat ?? undefined;
  const stadiumId = request.context.stadiumId;

  const tool = getTool("emergency_dispatch");
  let dispatch: EmergencyDispatchResult | undefined;
  if (tool) {
    const result = await tool.execute(
      { stadiumId, sectionId },
      { sessionId: request.context.sessionId, stadiumId, language: request.context.language },
    );
    toolCalls.push({ toolName: tool.name, input: { stadiumId, sectionId }, output: result.data });
    dispatch = result.data as EmergencyDispatchResult | undefined;
  }

  emergencyLog.push({
    id: incidentId,
    sessionId: request.context.sessionId,
    category,
    stadiumId,
    sectionId,
    reportedAt: request.context.currentTime,
  });

  if (dispatch?.status === "section_known") {
    const { section, nearestMedicalLabel, nearestExitLabel, etaMinutes } = dispatch;
    const seatBits = t.seatBits(language, row, seat);
    const routingExplanation = t.emergencyExitReason(language, nearestExitLabel, section.label);
    const reply = t.emergencyHelpSummary(
      language,
      script.acknowledge,
      section.label,
      seatBits,
      nearestMedicalLabel,
      etaMinutes,
      script.instructions,
      routingExplanation,
    );

    const metadata: EmergencyMetadata = {
      kind: "emergency",
      status: "resolved",
      category,
      location: {
        stadiumId,
        sectionId: section.id,
        sectionLabel: section.label,
        row: row || undefined,
        seat: seat || undefined,
      },
      nearestMedicalTeam: { name: nearestMedicalLabel, etaMinutes },
      nearestExit: { label: nearestExitLabel, gate: section.gate },
      instructions: script.instructions,
      contactInstructions: script.contactInstructions,
      routingExplanation,
      primaryAction: script.primaryAction,
      secondaryAction: script.secondaryAction,
      incidentId,
    };

    return {
      agentId: "emergency",
      reply,
      toolCalls,
      suggestedActions: script.suggestedActions,
      requiresClarification: false,
      metadata: metadata as unknown as Record<string, unknown>,
    };
  }

  // section_not_found / stadium_only / unsupported_stadium / no tool —
  // never fabricate a medical team or exit, ask only for the section.
  const notFoundBit =
    dispatch?.status === "section_not_found" ? t.emergencyNotFoundBit(language, dispatch.query) : "";
  const venueBit =
    dispatch?.status === "stadium_only" ? t.emergencyVenueBit(language, dispatch.stadiumName) : "";
  const reply = t.emergencyLocationUnknown(language, script.acknowledge, venueBit, notFoundBit, script.instructions);

  const metadata: EmergencyMetadata = {
    kind: "emergency",
    status: "location_unknown",
    category,
    instructions: script.instructions,
    incidentId,
  };

  return {
    agentId: "emergency",
    reply,
    toolCalls,
    suggestedActions: script.suggestedActions,
    requiresClarification: true,
    clarificationPrompt: t.emergencyClarifyPrompt(language),
    metadata: metadata as unknown as Record<string, unknown>,
  };
}

export const emergencyAgent: AgentDefinition = {
  id: "emergency",
  name: "Emergency Agent",
  description:
    "Handles medical, fire, security, lost-child, crowd, injury, suspicious-activity, volunteer-request, and wheelchair-assistance requests with the highest priority.",
  tools: ["emergency_dispatch"],
  handle,
};
