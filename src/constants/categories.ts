import type {
  CategoryGroup,
  CategoryTransactionType,
} from "@/types/category";

export type DefaultCategory = {
  name: string;
  group: CategoryGroup;
  transactionType: CategoryTransactionType;
};

export const defaultCategories = [
  { name: "Makan", group: "primer", transactionType: "expense" },
  {
    name: "Belanja kebutuhan",
    group: "primer",
    transactionType: "expense",
  },
  { name: "Pulsa", group: "primer", transactionType: "expense" },
  { name: "Internet", group: "primer", transactionType: "expense" },
  { name: "Kopi", group: "sekunder", transactionType: "expense" },
  { name: "Jajan", group: "sekunder", transactionType: "expense" },
  { name: "Hiburan", group: "sekunder", transactionType: "expense" },
  { name: "Subscription", group: "sekunder", transactionType: "expense" },
  { name: "Baju", group: "lifestyle", transactionType: "expense" },
  { name: "Skincare", group: "lifestyle", transactionType: "expense" },
  { name: "Gadget", group: "lifestyle", transactionType: "expense" },
  { name: "Hobi", group: "lifestyle", transactionType: "expense" },
  { name: "Bensin", group: "transport", transactionType: "expense" },
  { name: "Parkir", group: "transport", transactionType: "expense" },
  { name: "Ojek online", group: "transport", transactionType: "expense" },
  { name: "Tol", group: "transport", transactionType: "expense" },
  {
    name: "Servis kendaraan",
    group: "transport",
    transactionType: "expense",
  },
  { name: "Listrik", group: "tagihan", transactionType: "expense" },
  { name: "Air", group: "tagihan", transactionType: "expense" },
  { name: "Internet rumah", group: "tagihan", transactionType: "expense" },
  { name: "Cicilan", group: "tagihan", transactionType: "debt" },
  { name: "Kesehatan", group: "kesehatan", transactionType: "expense" },
  { name: "Pendidikan", group: "pendidikan", transactionType: "expense" },
  { name: "RDPU", group: "investasi", transactionType: "investment" },
  { name: "RDPT", group: "investasi", transactionType: "investment" },
  { name: "Emas", group: "investasi", transactionType: "investment" },
  { name: "Bitcoin", group: "investasi", transactionType: "investment" },
  { name: "Saham", group: "investasi", transactionType: "investment" },
  { name: "Transfer", group: "transfer", transactionType: "transfer" },
  { name: "Gaji", group: "income", transactionType: "income" },
  { name: "Bonus", group: "income", transactionType: "income" },
  { name: "Freelance", group: "income", transactionType: "income" },
  { name: "Hadiah", group: "income", transactionType: "income" },
  { name: "Hutang", group: "debt", transactionType: "debt" },
  { name: "Lainnya", group: "other", transactionType: "expense" },
] as const satisfies readonly DefaultCategory[];
