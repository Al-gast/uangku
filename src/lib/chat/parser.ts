import type {
  ChatAccount,
  ChatAsset,
  ChatCategory,
  ChatLiability,
  ChatParseFailureReason,
  ChatParseResult,
  ChatTransactionType,
} from "@/lib/chat/types";

const MAX_AMOUNT = 999_000_000_000_000;
const LIQUID_ACCOUNT_TYPES = new Set(["cash", "bank_account", "e_wallet"]);
const INCOME_KEYWORDS = ["gaji", "bonus", "freelance"];
const INVESTMENT_BUY_KEYWORDS = ["top up", "topup", "beli"];
const INVESTMENT_SELL_KEYWORDS = ["jual", "withdraw", "tarik"];
const DEBT_PAYMENT_KEYWORDS = [
  "bayar hutang",
  "bayar utang",
  "bayar cicilan",
  "lunasi hutang",
  "lunasi utang",
];
const INVESTMENT_SIGNAL_WORDS = [
  "investasi",
  "reksadana",
  "reksa dana",
  "rdpu",
  "rdpt",
  "btc",
  "bitcoin",
  "emas",
  "gold",
  "saham",
  "stock",
  "crypto",
  "kripto",
];
const FILLER_WORDS = new Set([
  "bayar",
  "beli",
  "dari",
  "ke",
  "masuk",
  "pakai",
  "pake",
  "hari",
  "ini",
  "kemarin",
  "rp",
]);

type AmountMatch = {
  amount: number;
  raw: string;
};

type AdminFeeMatch = AmountMatch & {
  clause: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("id-ID")
    .replace(/[^\p{L}\p{N}.,-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fail(
  reason: ChatParseFailureReason,
  suggestions: string[] = [],
): ChatParseResult {
  return { success: false, reason, suggestions };
}

function parseNumericAmount(rawNumber: string, suffix: string) {
  const normalizedSuffix = suffix.toLowerCase();

  if (normalizedSuffix === "jt" || normalizedSuffix === "juta") {
    const decimal = Number(rawNumber.replace(",", "."));
    return decimal * 1_000_000;
  }

  if (
    normalizedSuffix === "k" ||
    normalizedSuffix === "rb" ||
    normalizedSuffix === "ribu"
  ) {
    const decimal = Number(rawNumber.replace(",", "."));
    return decimal * 1_000;
  }

  if (rawNumber.includes(".")) {
    return Number(rawNumber.replaceAll(".", ""));
  }

  return Number(rawNumber.replace(",", "."));
}

function extractAmount(input: string): AmountMatch | null {
  const matches = [
    ...input.matchAll(
      /(^|\s)(-?\d+(?:[.,]\d+)?)\s*(juta|ribu|jt|rb|k)?(?=\s|$)/giu,
    ),
  ];

  for (const match of matches) {
    const rawNumber = match[2];
    const suffix = match[3] ?? "";
    const amount = parseNumericAmount(rawNumber, suffix);

    if (Number.isFinite(amount)) {
      return {
        amount,
        raw: `${rawNumber}${suffix}`,
      };
    }
  }

  return null;
}

function extractAdminFee(input: string): AdminFeeMatch | null {
  const match = input.match(
    /(?:^|\s)(?:biaya\s+admin|admin|biaya|bunga|fee)\s+(-?\d+(?:[.,]\d+)?)\s*(juta|ribu|jt|rb|k)?(?=\s|$)/iu,
  );

  if (!match) {
    return null;
  }

  const rawNumber = match[1];
  const suffix = match[2] ?? "";
  const amount = parseNumericAmount(rawNumber, suffix);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return {
    amount,
    raw: `${rawNumber}${suffix}`,
    clause: match[0],
  };
}

function dateForInput(input: string, now: Date) {
  const value = input.includes("kemarin")
    ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
    : now;

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function sortedAccountMatches(input: string, accounts: ChatAccount[]) {
  return accounts
    .map((account) => ({
      account,
      normalizedName: normalize(account.name),
    }))
    .filter(({ normalizedName }) => normalizedName && input.includes(normalizedName))
    .sort((a, b) => {
      const positionDifference =
        input.indexOf(a.normalizedName) - input.indexOf(b.normalizedName);
      return positionDifference || b.normalizedName.length - a.normalizedName.length;
    });
}

function assetAliases(asset: ChatAsset[]) {
  return asset.flatMap((item) => {
    const aliases = [item.name];

    if (item.type === "rdpu") {
      aliases.push("RDPU", "reksadana pasar uang", "reksa dana pasar uang");
    }

    if (item.type === "rdpt") {
      aliases.push("RDPT", "reksadana pendapatan tetap", "reksa dana pendapatan tetap");
    }

    if (item.type === "gold") {
      aliases.push("emas", "gold");
    }

    if (item.type === "crypto") {
      aliases.push("BTC", "Bitcoin", "crypto", "kripto");
    }

    if (item.type === "stock") {
      aliases.push("saham", "stock");
    }

    return aliases.map((alias) => ({
      asset: item,
      alias: normalize(alias),
    }));
  });
}

function matchAsset(input: string, assets: ChatAsset[]) {
  return (
    assetAliases(assets)
      .filter(({ alias }) => alias && input.includes(alias))
      .sort((a, b) => {
        const positionDifference = input.indexOf(a.alias) - input.indexOf(b.alias);
        return positionDifference || b.alias.length - a.alias.length;
      })[0]?.asset ?? null
  );
}

function matchLiability(input: string, liabilities: ChatLiability[]) {
  return (
    liabilities
      .map((liability) => ({
        liability,
        name: normalize(liability.name),
      }))
      .filter(({ name }) => name && input.includes(name))
      .sort((a, b) => {
        const positionDifference = input.indexOf(a.name) - input.indexOf(b.name);
        return positionDifference || b.name.length - a.name.length;
      })[0]?.liability ?? null
  );
}

function findAccountAfterCue(
  input: string,
  cue: string,
  accounts: ChatAccount[],
) {
  const cuePosition = input.indexOf(cue);

  if (cuePosition < 0) {
    return null;
  }

  const tail = input.slice(cuePosition + cue.length).trim();
  return (
    accounts
      .map((account) => ({
        account,
        name: normalize(account.name),
      }))
      .filter(({ name }) => tail.startsWith(name))
      .sort((a, b) => b.name.length - a.name.length)[0]?.account ?? null
  );
}

function matchCategory(
  input: string,
  categories: ChatCategory[],
  transactionType?: ChatCategory["transactionType"],
) {
  const candidates = categories
    .filter(
      (category) =>
        !transactionType || category.transactionType === transactionType,
    )
    .map((category) => ({
      category,
      name: normalize(category.name),
      aliases: (category.aliases ?? [])
        .map((alias) => normalize(alias))
        .filter(Boolean),
    }))
    .sort((a, b) => b.name.length - a.name.length);
  const withoutLeadingFiller = input
    .split(" ")
    .filter((word, index) => index > 0 || !FILLER_WORDS.has(word))
    .join(" ");

  return (
    candidates.find(
      ({ name }) =>
        input.startsWith(name) || withoutLeadingFiller.startsWith(name),
    )?.category ??
    candidates.find(({ aliases }) =>
      aliases.some(
        (alias) =>
          input.startsWith(alias) ||
          withoutLeadingFiller.startsWith(alias),
      ),
    )?.category ??
    candidates.find(({ name }) => input.includes(name))?.category ??
    candidates.find(({ aliases }) =>
      aliases.some((alias) => input.includes(alias)),
    )?.category ??
    null
  );
}

function hasContext(
  input: string,
  amountRaw: string,
  accounts: ChatAccount[],
) {
  let remaining = input.replace(normalize(amountRaw), " ");

  for (const account of accounts) {
    remaining = remaining.replace(normalize(account.name), " ");
  }

  const words = remaining
    .replace(/\b(hari ini|kemarin)\b/g, " ")
    .split(" ")
    .filter((word) => word && !FILLER_WORDS.has(word));

  return words.length > 0;
}

function isTransferInput(input: string) {
  return /\btransfer\b/.test(input) || /\bisi\b/.test(input);
}

function hasKeyword(input: string, keywords: string[]) {
  return keywords.some((keyword) => {
    const normalizedKeyword = normalize(keyword);
    return new RegExp(`(^|\\s)${normalizedKeyword}(\\s|$)`).test(input);
  });
}

function hasInvestmentSignal(input: string) {
  return INVESTMENT_SIGNAL_WORDS.some((word) => input.includes(normalize(word)));
}

function defaultAccount(accounts: ChatAccount[]) {
  return (
    accounts.find((account) => LIQUID_ACCOUNT_TYPES.has(account.type)) ?? null
  );
}

function resolveTransferAccounts(input: string, accounts: ChatAccount[]) {
  const sourceFromCue = findAccountAfterCue(input, "dari ", accounts);
  const destinationFromCue = findAccountAfterCue(input, "ke ", accounts);

  if (input.includes("isi ")) {
    const destinationAfterIsi = findAccountAfterCue(input, "isi ", accounts);
    return {
      source: sourceFromCue,
      destination: destinationAfterIsi ?? destinationFromCue,
    };
  }

  if (sourceFromCue && destinationFromCue) {
    return { source: sourceFromCue, destination: destinationFromCue };
  }

  const mentions = sortedAccountMatches(input, accounts).map(
    ({ account }) => account,
  );

  return {
    source: sourceFromCue ?? mentions[0] ?? null,
    destination: destinationFromCue ?? mentions[1] ?? null,
  };
}

function extractSimpleDetail({
  input,
  amountRaw,
  category,
  accounts,
}: {
  input: string;
  amountRaw: string;
  category: ChatCategory;
  accounts: ChatAccount[];
}) {
  let detail = ` ${input} `;
  const categoryName = normalize(category.name);
  const amountPattern = escapeRegExp(normalize(amountRaw));

  detail = detail.replace(
    new RegExp(`(^|\\s)${escapeRegExp(categoryName)}(?=\\s|$)`, "iu"),
    " ",
  );
  detail = detail.replace(
    new RegExp(`(^|\\s)${amountPattern}(?=\\s|$)`, "iu"),
    " ",
  );

  for (const account of accounts) {
    const accountName = normalize(account.name);

    if (!accountName) {
      continue;
    }

    detail = detail.replace(
      new RegExp(
        `\\s(?:dari|masuk|pakai|pake)\\s+${escapeRegExp(accountName)}(?=\\s|$)`,
        "giu",
      ),
      " ",
    );
    detail = detail.replace(
      new RegExp(`(^|\\s)${escapeRegExp(accountName)}(?=\\s|$)`, "giu"),
      " ",
    );
  }

  detail = detail
    .replace(/\b(hari ini|kemarin)\b/giu, " ")
    .split(" ")
    .filter((word) => word && !FILLER_WORDS.has(word))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return detail || null;
}

export function parseChatTransaction(
  rawText: string,
  categories: ChatCategory[],
  accounts: ChatAccount[],
  assets: ChatAsset[] = [],
  liabilities: ChatLiability[] = [],
  now = new Date(),
): ChatParseResult {
  const input = normalize(rawText);

  if (!input) {
    return fail("unsupported", ["makan 25k", "gaji 4.7jt"]);
  }

  const adminFeeMatch = extractAdminFee(input);
  const inputWithoutAdminFee = adminFeeMatch
    ? input.replace(adminFeeMatch.clause, " ").replace(/\s+/g, " ").trim()
    : input;
  const amountMatch = extractAmount(inputWithoutAdminFee);

  if (!amountMatch) {
    return fail("no_amount", ["makan 25k", "kopi 18rb"]);
  }

  if (
    amountMatch.amount < 0 ||
    /(^|\s)-\d/.test(inputWithoutAdminFee)
  ) {
    return fail("negative_amount", ["makan 25k"]);
  }

  if (amountMatch.amount === 0) {
    return fail("zero_amount", ["makan 25k"]);
  }

  if (amountMatch.amount > MAX_AMOUNT) {
    return fail("amount_too_large", ["Periksa kembali nominal transaksi."]);
  }

  if (adminFeeMatch && adminFeeMatch.amount < 0) {
    return fail("negative_admin_fee", ["transfer BCA ke GoPay 100rb admin 2500"]);
  }

  if (adminFeeMatch && adminFeeMatch.amount > MAX_AMOUNT) {
    return fail("admin_fee_too_large", ["Periksa kembali biaya admin."]);
  }

  if (!hasContext(inputWithoutAdminFee, amountMatch.raw, accounts)) {
    return fail("amount_only", ["kopi 18k", "gaji 4.7jt"]);
  }

  const adminFeeAmount = adminFeeMatch?.amount ?? 0;
  const transactionDate = dateForInput(input, now);
  const fallbackAccount = defaultAccount(accounts);
  const matchedAsset = matchAsset(input, assets);
  const matchedLiability = matchLiability(input, liabilities);
  const isDebtPaymentInput = hasKeyword(input, DEBT_PAYMENT_KEYWORDS);
  const isSellIntent = hasKeyword(input, INVESTMENT_SELL_KEYWORDS);
  const hasBuyKeyword = hasKeyword(input, INVESTMENT_BUY_KEYWORDS);
  const isBuyIntent =
    hasKeyword(input, ["top up", "topup"]) ||
    (hasBuyKeyword && (matchedAsset || hasInvestmentSignal(input)));
  const isInvestmentInput = isBuyIntent || isSellIntent;

  if (isDebtPaymentInput) {
    const debtCategory =
      categories.find((category) => category.transactionType === "debt") ??
      null;
    const account =
      findAccountAfterCue(input, "dari ", accounts) ??
      sortedAccountMatches(input, accounts)[0]?.account ??
      fallbackAccount;

    if (!matchedLiability) {
      return fail("liability_not_found", [
        "bayar hutang Andi 300rb dari BCA",
        "bayar cicilan laptop 1jt dari Jago",
      ]);
    }

    if (!debtCategory) {
      return fail("unknown_category", ["Gunakan kategori Hutang."]);
    }

    if (!account) {
      return fail("account_not_found", [
        "Tambahkan akun tunai, bank, atau e-wallet terlebih dahulu.",
      ]);
    }

    return {
      success: true,
      draft: {
        type: "debt_payment",
        amount: amountMatch.amount,
        adminFeeAmount,
        categoryId: debtCategory.id,
        accountId: account.id,
        transferToAccountId: null,
        assetId: null,
        liabilityId: matchedLiability.id,
        merchant: null,
        notes: null,
        transactionDate,
        confidence: 0.91,
      },
    };
  }

  if (isInvestmentInput) {
    const investmentCategory =
      categories.find(
        (category) => category.transactionType === "investment",
      ) ?? null;

    if (!matchedAsset) {
      return fail("asset_not_found", [
        "top up RDPU 500rb dari BCA",
        "beli BTC 250rb dari Jago",
      ]);
    }

    if (!investmentCategory) {
      return fail("unknown_category", ["Gunakan kategori Investasi."]);
    }

    const account =
      isSellIntent
        ? findAccountAfterCue(input, "ke ", accounts) ??
          findAccountAfterCue(input, "masuk ", accounts) ??
          sortedAccountMatches(input, accounts)[0]?.account ??
          fallbackAccount
        : findAccountAfterCue(input, "dari ", accounts) ??
          sortedAccountMatches(input, accounts)[0]?.account ??
          fallbackAccount;

    if (!account) {
      return fail("account_not_found", [
        "Tambahkan akun tunai, bank, atau e-wallet terlebih dahulu.",
      ]);
    }

    if (isSellIntent && adminFeeAmount > amountMatch.amount) {
      return fail("admin_fee_exceeds_amount", [
        "Biaya admin tidak boleh lebih besar dari nominal jual.",
      ]);
    }

    return {
      success: true,
      draft: {
        type: isSellIntent ? "investment_sell" : "investment_buy",
        amount: amountMatch.amount,
        adminFeeAmount,
        categoryId: investmentCategory.id,
        accountId: account.id,
        transferToAccountId: null,
        assetId: matchedAsset.id,
        liabilityId: null,
        merchant: null,
        notes: null,
        transactionDate,
        confidence: 0.93,
      },
    };
  }

  if (isTransferInput(input)) {
    const transferCategory =
      matchCategory(input, categories, "transfer") ??
      categories.find(
        (category) => category.transactionType === "transfer",
      ) ??
      null;
    const { source, destination } = resolveTransferAccounts(input, accounts);

    if (!source || !destination) {
      return fail("transfer_accounts_missing", [
        "transfer dari BCA ke GoPay 100rb",
      ]);
    }

    if (source.id === destination.id) {
      return fail("same_transfer_account", [
        "Pilih dua akun yang berbeda untuk transfer.",
      ]);
    }

    if (!transferCategory) {
      return fail("unknown_category", ["Gunakan kategori Transfer."]);
    }

    return {
      success: true,
      draft: {
        type: "transfer",
        amount: amountMatch.amount,
        adminFeeAmount,
        categoryId: transferCategory.id,
        accountId: source.id,
        transferToAccountId: destination.id,
        assetId: null,
        liabilityId: null,
        merchant: null,
        notes: null,
        transactionDate,
        confidence: 0.98,
      },
    };
  }

  const explicitIncome = INCOME_KEYWORDS.some((keyword) =>
    input.includes(keyword),
  );
  const category =
    matchCategory(input, categories, explicitIncome ? "income" : undefined) ??
    null;

  if (!category) {
    return fail("unknown_category", [
      "Pilih template atau gunakan form manual.",
    ]);
  }

  const type: ChatTransactionType =
    explicitIncome || category.transactionType === "income"
      ? "income"
      : "expense";
  const typedCategory =
    category.transactionType === type
      ? category
      : matchCategory(input, categories, type);

  if (!typedCategory) {
    return fail("unknown_category", [
      "Pilih template atau gunakan form manual.",
    ]);
  }

  if (adminFeeAmount > 0) {
    return fail("admin_fee_not_supported", [
      "Biaya admin hanya didukung untuk transfer, investasi, dan bayar hutang.",
    ]);
  }

  const mentionedAccount = sortedAccountMatches(input, accounts)[0]?.account;
  const account = mentionedAccount ?? fallbackAccount;

  if (!account) {
    return fail("account_not_found", [
      "Tambahkan akun tunai, bank, atau e-wallet terlebih dahulu.",
    ]);
  }

  return {
    success: true,
    draft: {
      type,
      amount: amountMatch.amount,
      adminFeeAmount: 0,
      categoryId: typedCategory.id,
      accountId: account.id,
      transferToAccountId: null,
      assetId: null,
      liabilityId: null,
      merchant: extractSimpleDetail({
        input: inputWithoutAdminFee,
        amountRaw: amountMatch.raw,
        category: typedCategory,
        accounts,
      }),
      notes: null,
      transactionDate,
      confidence: mentionedAccount ? 0.96 : 0.88,
    },
  };
}
