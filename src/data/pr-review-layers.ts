/**
 * Hierarchical data for PR review sunburst.
 * Maps to Code Rabbit–style layers: Schema → Wiring → UI → Tests.
 * Each node: { name, value? (for leaves), children? }.
 */
export interface SunburstNode {
  name: string;
  value?: number;
  children?: SunburstNode[];
}

export const prReviewLayersData: SunburstNode = {
  name: "PR",
  children: [
    {
      name: "Schema",
      children: [
        { name: "schema.ts", value: 24 },
        { name: "types.ts", value: 18 },
      ],
    },
    {
      name: "Wiring",
      children: [
        { name: "api.ts", value: 32 },
        { name: "handlers.ts", value: 28 },
        { name: "reviewer.ts", value: 20 },
      ],
    },
    {
      name: "UI",
      children: [
        { name: "Component.tsx", value: 45 },
        { name: "page.tsx", value: 22 },
        { name: "layout.tsx", value: 12 },
      ],
    },
    {
      name: "Tests",
      children: [
        { name: "api.test.ts", value: 15 },
        { name: "component.test.tsx", value: 18 },
      ],
    },
  ],
};
