import { strict as assert } from "node:assert";
import { parseChatTransaction } from "../src/lib/chat/parser";
import type { ChatAccount, ChatAsset, ChatCategory } from "../src/lib/chat/types";

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
  { id: "category-makan", name: "Makan", transactionType: "expense" },
  { id: "category-kopi", name: "Kopi", transactionType: "expense" },
  { id: "category-listrik", name: "Listrik", transactionType: "expense" },
  { id: "category-gaji", name: "Gaji", transactionType: "income" },
  { id: "category-freelance", name: "Freelance", transactionType: "income" },
  { id: "category-transfer", name: "Transfer", transactionType: "transfer" },
  { id: "category-investasi", name: "Investasi", transactionType: "investment" },
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

type ExpectedDraft = {
  type: string;
  amount?: number;
  adminFeeAmount?: number;
  categoryId?: string;
  accountId?: string;
  transferToAccountId?: string | null;
  assetId?: string | null;
};

function parse(text: string) {
  return parseChatTransaction(text, categories, accounts, assets, now);
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
  expectFailure("xyz 25k", "unknown_category");
}

runParserRegressionTests();
console.log("Chat parser regression tests passed.");
