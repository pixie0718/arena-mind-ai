import type { StadiumSectionConfig } from "@/types/stadium-config";

export function buildWalkingDirections(section: StadiumSectionConfig): string[] {
  const steps = [`Enter through Gate ${section.gate}`, `Head to ${section.label}`];
  if (section.nearby.restroom) steps.push(`Restroom on the way: ${section.nearby.restroom}`);
  if (section.nearby.food) steps.push(`Food nearby: ${section.nearby.food}`);
  return steps;
}
