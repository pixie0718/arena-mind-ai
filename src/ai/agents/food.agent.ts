import type { AgentDefinition, AgentRequest, AgentResponse } from "@/types/agent";
import { getTool } from "@/ai/tool-registry";
import type { Vendor } from "@/types/knowledge";
import { t } from "@/ai/reply-i18n";
import { generateId } from "@/utils/id";

export interface FoodOrder {
  id: string;
  sessionId: string;
  vendorName: string;
  itemName: string;
  price: number;
  createdAt: string;
}

// MVP in-memory order log, session-scoped — mirrors the same pattern
// already used by the Lost & Found agent's report store.
const orders: FoodOrder[] = [];

function menuItemFor(vendor: Vendor, message: string): Vendor["menu"][number] | undefined {
  const normalized = message.toLowerCase();
  return vendor.menu.find((item) => normalized.includes(item.name.toLowerCase()));
}

async function handle(request: AgentRequest): Promise<AgentResponse> {
  const foodTool = getTool("food");
  const toolCalls: AgentResponse["toolCalls"] = [];
  const language = request.context.language;

  let vendors: Vendor[] = [];
  let reply = t.foodClarify(language);

  if (foodTool) {
    const result = await foodTool.execute(
      { query: request.message.content },
      {
        sessionId: request.context.sessionId,
        stadiumId: request.context.stadiumId,
        language: request.context.language,
      },
    );
    toolCalls.push({
      toolName: foodTool.name,
      input: { query: request.message.content },
      output: result.data,
    });
    vendors = (result.data as Vendor[] | undefined) ?? [];
  }

  // Exactly one vendor uniquely resolved (e.g. "Order from Green Bowl
  // Kitchen.") — either confirm a specific menu item if one is also named
  // in this message, or show that vendor's menu so the next message can
  // name one.
  if (vendors.length === 1) {
    const vendor = vendors[0];
    const item = menuItemFor(vendor, request.message.content);

    if (item) {
      const order: FoodOrder = {
        id: generateId("food"),
        sessionId: request.context.sessionId,
        vendorName: vendor.name,
        itemName: item.name,
        price: item.price,
        createdAt: request.context.currentTime,
      };
      orders.push(order);

      return {
        agentId: "food",
        reply: t.foodOrderConfirmed(language, item.name, vendor.name, item.price, order.id),
        toolCalls,
        suggestedActions: [],
        requiresClarification: false,
        metadata: { orderId: order.id },
      };
    }

    return {
      agentId: "food",
      reply: t.foodMenuIntro(language, vendor.name),
      toolCalls,
      suggestedActions: vendor.menu.slice(0, 4).map((menuItem) => ({
        label: `${menuItem.name} — $${menuItem.price.toFixed(2)}`,
        // Must contain a food-intent keyword ("order") or this never
        // reaches the food agent at all — the intent engine classifies
        // fresh messages from scratch, it doesn't know we're mid-menu.
        prompt: `Order the ${menuItem.name} from ${vendor.name}.`,
      })),
      requiresClarification: false,
    };
  }

  const top = vendors[0];
  if (top) {
    reply = t.foodBestPick(language, top.name, top.queueEstimateMinutes, top.location);
    if (top.crowdLevel && top.crowdLevel !== "high") {
      reply += ` ${t.foodReasonLowCrowd(language, top.crowdLevel)}`;
    }
  }

  return {
    agentId: "food",
    reply,
    toolCalls,
    suggestedActions: vendors.slice(0, 2).map((vendor) => ({
      label: t.foodOrderAction(language, vendor.name),
      prompt: `Order from ${vendor.name}.`,
    })),
    requiresClarification: vendors.length === 0,
    clarificationPrompt: vendors.length === 0 ? "What are you in the mood for?" : undefined,
  };
}

export const foodAgent: AgentDefinition = {
  id: "food",
  name: "Food Agent",
  description: "Recommends nearby vendors and menu items ranked by shortest queue.",
  tools: ["food"],
  handle,
};
