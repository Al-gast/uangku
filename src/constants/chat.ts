export type ChatTemplate = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type ChatTemplateGroup = {
  id:
    | "primer"
    | "sekunder"
    | "tagihan"
    | "income"
    | "transfer"
    | "investasi";
  label: string;
  icon: string;
  templates: ChatTemplate[];
};

export const CHAT_TEMPLATE_GROUPS: ChatTemplateGroup[] = [
  {
    id: "primer",
    label: "Primer",
    icon: "🍚",
    templates: [
      { label: "Makan", value: "makan " },
      { label: "Belanja kebutuhan", value: "belanja kebutuhan " },
      { label: "Pulsa", value: "pulsa " },
      { label: "Internet", value: "internet " },
    ],
  },
  {
    id: "sekunder",
    label: "Sekunder",
    icon: "☕",
    templates: [
      { label: "Kopi", value: "kopi " },
      { label: "Jajan", value: "jajan " },
      { label: "Hiburan", value: "hiburan " },
      { label: "Subscription", value: "subscription " },
    ],
  },
  {
    id: "tagihan",
    label: "Tagihan",
    icon: "💸",
    templates: [
      { label: "Listrik", value: "listrik " },
      { label: "Air", value: "air " },
      { label: "Internet rumah", value: "internet rumah " },
    ],
  },
  {
    id: "income",
    label: "Income",
    icon: "💼",
    templates: [
      { label: "Gaji", value: "gaji " },
      { label: "Bonus", value: "bonus " },
      { label: "Freelance", value: "freelance " },
    ],
  },
  {
    id: "transfer",
    label: "Transfer",
    icon: "↔",
    templates: [{ label: "Transfer", value: "transfer " }],
  },
  {
    id: "investasi",
    label: "Investasi",
    icon: "📈",
    templates: [
      { label: "Top up RDPU", value: "", disabled: true },
      { label: "Top up RDPT", value: "", disabled: true },
      { label: "Beli emas", value: "", disabled: true },
      { label: "Beli BTC", value: "", disabled: true },
    ],
  },
];
