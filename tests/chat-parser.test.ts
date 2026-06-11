import { strict as assert } from "node:assert";
import { parseChatTransaction } from "../src/lib/chat/parser";
import type {
  ChatAccount,
  ChatAsset,
  ChatCategory,
  ChatLiability,
} from "../src/lib/chat/types";

const now = new Date("2026-06-07T05:00:00.000Z");

const accounts: ChatAccount[] = [
  {
    id: "account-bca",
    name: "BCA",
    type: "bank_account",
    currentBalance: 5_000_000,
  },
  {
    id: "account-gopay",
    name: "GoPay",
    type: "e_wallet",
    currentBalance: 750_000,
  },
  {
    id: "account-jago",
    name: "Jago",
    type: "bank_account",
    currentBalance: 2_000_000,
  },
  {
    id: "account-mandiri",
    name: "Mandiri",
    type: "bank_account",
    currentBalance: 3_000_000,
  },
];

const categories: ChatCategory[] = [
  {
    id: "category-makan",
    name: "Makan",
    transactionType: "expense",
    aliases: ["gofood", "sarapan"],
  },
  { id: "category-jajan", name: "Jajan", transactionType: "expense" },
  { id: "category-kopi", name: "Kopi", transactionType: "expense" },
  { id: "category-listrik", name: "Listrik", transactionType: "expense" },
  { id: "category-transport", name: "Transport", transactionType: "expense" },
  { id: "category-gaji", name: "Gaji", transactionType: "income" },
  { id: "category-freelance", name: "Freelance", transactionType: "income" },
  { id: "category-transfer", name: "Transfer", transactionType: "transfer" },
  { id: "category-investasi", name: "Investasi", transactionType: "investment" },
  { id: "category-hutang", name: "Hutang", transactionType: "debt" },
];

const assets: ChatAsset[] = [
  {
    id: "asset-rdpu",
    name: "RDPU",
    type: "rdpu",
    currentValue: 4_000_000,
  },
  {
    id: "asset-btc",
    name: "BTC",
    type: "crypto",
    currentValue: 3_000_000,
  },
  {
    id: "asset-emas",
    name: "Emas",
    type: "gold",
    currentValue: 2_500_000,
  },
];

const liabilities: ChatLiability[] = [
  {
    id: "liability-andi",
    name: "Andi",
    remainingAmount: 1_000_000,
  },
  {
    id: "liability-laptop",
    name: "cicilan laptop",
    remainingAmount: 5_000_000,
  },
];

type ExpectedDraft = {
  type: string;
  amount?: number;
  adminFeeAmount?: number;
  categoryId?: string;
  accountId?: string;
  transferToAccountId?: string | null;
  assetId?: string | null;
  liabilityId?: string | null;
  merchant?: string | null;
};

function parse(text: string) {
  return parseChatTransaction(
    text,
    categories,
    accounts,
    assets,
    liabilities,
    now,
  );
}

function expectDraft(text: string, expected: ExpectedDraft) {
  const result = parse(text);

  assert.equal(
    result.success,
    true,
    `${text} should parse successfully: ${JSON.stringify(result)}`,
  );

  if (!result.success) {
    throw new Error("Unreachable");
  }

  assert.equal(result.draft.type, expected.type, `${text} type`);

  if (expected.amount !== undefined) {
    assert.equal(result.draft.amount, expected.amount, `${text} amount`);
  }

  if (expected.adminFeeAmount !== undefined) {
    assert.equal(
      result.draft.adminFeeAmount,
      expected.adminFeeAmount,
      `${text} admin fee`,
    );
  }

  if (expected.categoryId !== undefined) {
    assert.equal(result.draft.categoryId, expected.categoryId, `${text} category`);
  }

  if (expected.accountId !== undefined) {
    assert.equal(result.draft.accountId, expected.accountId, `${text} account`);
  }

  if (expected.transferToAccountId !== undefined) {
    assert.equal(
      result.draft.transferToAccountId,
      expected.transferToAccountId,
      `${text} transfer destination`,
    );
  }

  if (expected.assetId !== undefined) {
    assert.equal(result.draft.assetId, expected.assetId, `${text} asset`);
  }

  if (expected.liabilityId !== undefined) {
    assert.equal(
      result.draft.liabilityId,
      expected.liabilityId,
      `${text} liability`,
    );
  }

  if (expected.merchant !== undefined) {
    assert.equal(result.draft.merchant, expected.merchant, `${text} merchant`);
  }
}

function expectFailure(text: string, reason: string) {
  const result = parse(text);

  assert.equal(
    result.success,
    false,
    `${text} should fail: ${JSON.stringify(result)}`,
  );

  if (result.success) {
    throw new Error("Unreachable");
  }

  assert.equal(result.reason, reason, `${text} failure reason`);
}

function runParserRegressionTests() {
  expectDraft("makan 25k", {
    type: "expense",
    amount: 25_000,
    adminFeeAmount: 0,
    categoryId: "category-makan",
    accountId: "account-bca",
    assetId: null,
    merchant: null,
  });
  expectDraft("makan ayam goreng 20k", {
    type: "expense",
    amount: 20_000,
    categoryId: "category-makan",
    merchant: "ayam goreng",
  });
  expectDraft("gofood ayam goreng 20k", {
    type: "expense",
    amount: 20_000,
    categoryId: "category-makan",
  });
  expectDraft("jajan cilok 5k", {
    type: "expense",
    amount: 5_000,
    categoryId: "category-jajan",
    merchant: "cilok",
  });
  expectDraft("transport parkir 2k", {
    type: "expense",
    amount: 2_000,
    categoryId: "category-transport",
    merchant: "parkir",
  });
  expectDraft("transport ganti oli 60k", {
    type: "expense",
    amount: 60_000,
    categoryId: "category-transport",
    merchant: "ganti oli",
  });
  expectDraft("makan ayam goreng 20k dari BCA", {
    type: "expense",
    amount: 20_000,
    categoryId: "category-makan",
    accountId: "account-bca",
    merchant: "ayam goreng",
  });
  expectDraft("kopi 18rb dari GoPay", {
    type: "expense",
    amount: 18_000,
    categoryId: "category-kopi",
    accountId: "account-gopay",
  });
  expectDraft("bayar listrik 150rb", {
    type: "expense",
    amount: 150_000,
    categoryId: "category-listrik",
  });
  expectDraft("beli kopi 25k", {
    type: "expense",
    amount: 25_000,
    categoryId: "category-kopi",
  });

  expectDraft("gaji 4.7jt", {
    type: "income",
    amount: 4_700_000,
    categoryId: "category-gaji",
    merchant: null,
  });
  expectDraft("gaji kantor 4.7jt masuk BCA", {
    type: "income",
    amount: 4_700_000,
    categoryId: "category-gaji",
    accountId: "account-bca",
    merchant: "kantor",
  });
  expectDraft("freelance 800rb masuk BCA", {
    type: "income",
    amount: 800_000,
    categoryId: "category-freelance",
    accountId: "account-bca",
  });

  expectDraft("transfer dari BCA ke GoPay 100rb", {
    type: "transfer",
    amount: 100_000,
    adminFeeAmount: 0,
    accountId: "account-bca",
    transferToAccountId: "account-gopay",
    merchant: null,
  });
  expectDraft("transfer BCA ke GoPay 100rb", {
    type: "transfer",
    amount: 100_000,
    adminFeeAmount: 0,
    accountId: "account-bca",
    transferToAccountId: "account-gopay",
  });
  expectDraft("transfer 100rb dari BCA ke GoPay", {
    type: "transfer",
    amount: 100_000,
    accountId: "account-bca",
    transferToAccountId: "account-gopay",
  });
  expectDraft("isi GoPay dari BCA 100rb", {
    type: "transfer",
    amount: 100_000,
    accountId: "account-bca",
    transferToAccountId: "account-gopay",
  });
  expectDraft("transfer BCA ke GoPay 100rb admin 2500", {
    type: "transfer",
    amount: 100_000,
    adminFeeAmount: 2_500,
    accountId: "account-bca",
    transferToAccountId: "account-gopay",
  });
  expectDraft("transfer dari Mandiri ke BCA 1jt biaya 2500", {
    type: "transfer",
    amount: 1_000_000,
    adminFeeAmount: 2_500,
    accountId: "account-mandiri",
    transferToAccountId: "account-bca",
  });
  expectDraft("transfer BCA ke GoPay 100rb fee 2.500", {
    type: "transfer",
    amount: 100_000,
    adminFeeAmount: 2_500,
  });
  expectDraft("transfer BCA ke GoPay 100rb admin 2.5k", {
    type: "transfer",
    amount: 100_000,
    adminFeeAmount: 2_500,
  });
  expectDraft("transfer BCA ke GoPay 100rb biaya admin 2500", {
    type: "transfer",
    amount: 100_000,
    adminFeeAmount: 2_500,
  });
  expectDraft("transfer BCA ke GoPay 100rb admin 2500rb", {
    type: "transfer",
    amount: 100_000,
    adminFeeAmount: 2_500_000,
  });

  expectDraft("top up RDPU 500rb dari BCA", {
    type: "investment_buy",
    amount: 500_000,
    accountId: "account-bca",
    assetId: "asset-rdpu",
    merchant: null,
  });
  expectDraft("top up RDPU 500rb dari BCA admin 2500", {
    type: "investment_buy",
    amount: 500_000,
    adminFeeAmount: 2_500,
    accountId: "account-bca",
    assetId: "asset-rdpu",
  });
  expectDraft("beli BTC 250rb dari Jago admin 2,5k", {
    type: "investment_buy",
    amount: 250_000,
    adminFeeAmount: 2_500,
    accountId: "account-jago",
    assetId: "asset-btc",
  });
  expectDraft("beli BTC 250rb dari Jago admin 5000", {
    type: "investment_buy",
    amount: 250_000,
    adminFeeAmount: 5_000,
    accountId: "account-jago",
    assetId: "asset-btc",
  });
  expectDraft("topup RDPU 500rb dari BCA", {
    type: "investment_buy",
    amount: 500_000,
    accountId: "account-bca",
    assetId: "asset-rdpu",
  });
  expectDraft("beli BTC 250rb dari Jago", {
    type: "investment_buy",
    amount: 250_000,
    accountId: "account-jago",
    assetId: "asset-btc",
  });
  expectDraft("beli emas 300rb dari GoPay", {
    type: "investment_buy",
    amount: 300_000,
    accountId: "account-gopay",
    assetId: "asset-emas",
  });

  expectDraft("jual BTC 100rb masuk BCA", {
    type: "investment_sell",
    amount: 100_000,
    accountId: "account-bca",
    assetId: "asset-btc",
  });
  expectDraft("jual BTC 500rb masuk BCA admin 10000", {
    type: "investment_sell",
    amount: 500_000,
    adminFeeAmount: 10_000,
    accountId: "account-bca",
    assetId: "asset-btc",
  });
  expectDraft("withdraw RDPU 1jt ke Jago biaya 2500", {
    type: "investment_sell",
    amount: 1_000_000,
    adminFeeAmount: 2_500,
    accountId: "account-jago",
    assetId: "asset-rdpu",
  });
  expectDraft("withdraw RDPU 1jt ke Jago", {
    type: "investment_sell",
    amount: 1_000_000,
    accountId: "account-jago",
    assetId: "asset-rdpu",
  });
  expectDraft("tarik RDPU 1jt ke Jago", {
    type: "investment_sell",
    amount: 1_000_000,
    accountId: "account-jago",
    assetId: "asset-rdpu",
  });

  expectDraft("bayar hutang Andi 300rb dari BCA", {
    type: "debt_payment",
    amount: 300_000,
    adminFeeAmount: 0,
    categoryId: "category-hutang",
    accountId: "account-bca",
    assetId: null,
    liabilityId: "liability-andi",
  });
  expectDraft("bayar utang Andi 300rb dari BCA", {
    type: "debt_payment",
    amount: 300_000,
    accountId: "account-bca",
    liabilityId: "liability-andi",
  });
  expectDraft("bayar cicilan laptop 1jt dari Jago", {
    type: "debt_payment",
    amount: 1_000_000,
    accountId: "account-jago",
    liabilityId: "liability-laptop",
  });
  expectDraft("bayar hutang Andi 300rb dari BCA bunga 20rb", {
    type: "debt_payment",
    amount: 300_000,
    adminFeeAmount: 20_000,
    accountId: "account-bca",
    liabilityId: "liability-andi",
  });
  expectDraft("bayar cicilan laptop 1jt dari Jago biaya 10000", {
    type: "debt_payment",
    amount: 1_000_000,
    adminFeeAmount: 10_000,
    accountId: "account-jago",
    liabilityId: "liability-laptop",
  });
  expectDraft("lunasi hutang Andi 500rb dari BCA", {
    type: "debt_payment",
    amount: 500_000,
    accountId: "account-bca",
    liabilityId: "liability-andi",
  });

  expectFailure("25k", "amount_only");
  expectFailure("makan", "no_amount");
  expectFailure("makan 0", "zero_amount");
  expectFailure("makan -25k", "negative_amount");
  expectFailure(
    "transfer BCA ke GoPay 100rb admin -2500",
    "negative_admin_fee",
  );
  expectFailure(
    "jual BTC 100rb masuk BCA admin 150rb",
    "admin_fee_exceeds_amount",
  );
  expectFailure("transfer dari BCA ke BCA 100rb", "same_transfer_account");
  expectFailure(
    "bayar hutang Budi 300rb dari BCA",
    "liability_not_found",
  );
  expectFailure("xyz 25k", "unknown_category");
}

runParserRegressionTests();
console.log("Chat parser regression tests passed.");
