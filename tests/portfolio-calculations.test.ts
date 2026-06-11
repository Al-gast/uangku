import { strict as assert } from "node:assert";
import {
  buildPortfolioRecommendations,
  calculatePortfolio,
  getAssetFreshnessStatus,
  getAssetReturnSummary,
  getLiabilityReminderStatus,
  getPortfolioFreshnessSummary,
  mapPortfolioAccounts,
  mapPortfolioAssets,
  mapPortfolioLiabilities,
  type PortfolioAssetRow,
} from "../src/lib/portfolio/calculations";
import {
  parseAssetForm,
  parseLiabilityForm,
} from "../src/lib/portfolio/validation";

function assetRow(
  overrides: Partial<PortfolioAssetRow> & Pick<PortfolioAssetRow, "id" | "type">,
): PortfolioAssetRow {
  return {
    name: overrides.id,
    platform: null,
    quantity: null,
    unit: null,
    last_price: null,
    last_price_updated_at: null,
    total_cost: null,
    current_value: 0,
    notes: null,
    ...overrides,
  };
}

function runPortfolioMappingTests() {
  const accounts = mapPortfolioAccounts([
    {
      id: "account-wallet",
      name: "GoPay",
      type: "e_wallet",
      current_balance: "150000",
    },
    {
      id: "account-bank-b",
      name: "Jago",
      type: "bank_account",
      current_balance: 1_000_000,
    },
    {
      id: "account-cash",
      name: "Cash",
      type: "cash",
      current_balance: "100000",
    },
    {
      id: "account-bank-a",
      name: "BCA",
      type: "bank_account",
      current_balance: "2500000",
    },
    {
      id: "account-investment",
      name: "Bibit",
      type: "investment_account",
      current_balance: "10000000",
    },
    {
      id: "account-asset",
      name: "Akun Aset",
      type: "asset_account",
      current_balance: "5000000",
    },
    {
      id: "account-liability",
      name: "Kartu Kredit",
      type: "liability",
      current_balance: "-1000000",
    },
  ]);

  assert.deepEqual(
    accounts.map((account) => ({
      id: account.id,
      balance: account.currentBalance,
    })),
    [
      { id: "account-cash", balance: 100_000 },
      { id: "account-bank-a", balance: 2_500_000 },
      { id: "account-bank-b", balance: 1_000_000 },
      { id: "account-wallet", balance: 150_000 },
    ],
  );
  assert.equal(
    accounts.some((account) => account.id === "account-investment"),
    false,
  );

  const assets = mapPortfolioAssets([
    assetRow({
      id: "asset-stock",
      type: "stock",
      current_value: "1500000",
    }),
    assetRow({
      id: "asset-rdpt",
      type: "rdpt",
      name: "RDPT",
      current_value: "2000000",
    }),
    assetRow({
      id: "asset-rdpu",
      type: "rdpu",
      name: "RDPU",
      platform: "Bibit",
      quantity: "12.5",
      unit: "unit",
      last_price: "100000",
      last_price_updated_at: "2026-06-11T00:00:00.000Z",
      total_cost: "1000000",
      current_value: "1250000",
    }),
    assetRow({
      id: "asset-gold",
      type: "gold",
      current_value: 3_000_000,
    }),
  ]);

  assert.deepEqual(
    assets.map((asset) => asset.id),
    ["asset-rdpu", "asset-rdpt", "asset-gold", "asset-stock"],
  );
  assert.deepEqual(
    {
      quantity: assets[0].quantity,
      unitPrice: assets[0].unitPrice,
      totalCost: assets[0].totalCost,
      currentValue: assets[0].currentValue,
    },
    {
      quantity: 12.5,
      unitPrice: 100_000,
      totalCost: 1_000_000,
      currentValue: 1_250_000,
    },
  );

  const liabilities = mapPortfolioLiabilities([
    {
      id: "liability-no-date-small",
      name: "Tanpa tanggal kecil",
      amount: "1000000",
      remaining_amount: "200000",
      due_date: null,
      reminder_enabled: false,
      notes: null,
    },
    {
      id: "liability-later",
      name: "Jatuh tempo nanti",
      amount: 4_000_000,
      remaining_amount: "3000000",
      due_date: "2026-12-01",
      reminder_enabled: true,
      notes: null,
    },
    {
      id: "liability-earlier",
      name: "Jatuh tempo dulu",
      amount: "2000000",
      remaining_amount: "1500000",
      due_date: "2026-07-15",
      reminder_enabled: true,
      notes: "Prioritas",
    },
    {
      id: "liability-no-date-large",
      name: "Tanpa tanggal besar",
      amount: "5000000",
      remaining_amount: "4000000",
      due_date: null,
      reminder_enabled: false,
      notes: null,
    },
  ]);

  assert.deepEqual(
    liabilities.map((liability) => liability.id),
    [
      "liability-earlier",
      "liability-later",
      "liability-no-date-large",
      "liability-no-date-small",
    ],
  );
  assert.equal(liabilities[0].remainingAmount, 1_500_000);
  assert.equal(liabilities[0].reminderEnabled, true);
  assert.equal(liabilities[2].reminderEnabled, false);
}

function runPortfolioCalculationTests() {
  const accounts = mapPortfolioAccounts([
    {
      id: "account-cash",
      name: "Cash",
      type: "cash",
      current_balance: 1_000_000,
    },
    {
      id: "account-bank",
      name: "BCA",
      type: "bank_account",
      current_balance: 2_000_000,
    },
  ]);
  const assets = mapPortfolioAssets([
    assetRow({
      id: "asset-rdpu",
      type: "rdpu",
      current_value: 4_000_000,
    }),
    assetRow({
      id: "asset-rdpt",
      type: "rdpt",
      current_value: 1_000_000,
    }),
    assetRow({
      id: "asset-gold",
      type: "gold",
      current_value: 2_000_000,
    }),
    assetRow({
      id: "asset-crypto",
      type: "crypto",
      current_value: 1_000_000,
    }),
    assetRow({
      id: "asset-stock",
      type: "stock",
      current_value: 1_500_000,
    }),
    assetRow({
      id: "asset-other",
      type: "other_asset",
      current_value: 500_000,
    }),
  ]);
  const liabilities = mapPortfolioLiabilities([
    {
      id: "liability-a",
      name: "Hutang A",
      amount: 5_000_000,
      remaining_amount: 3_000_000,
      due_date: null,
      reminder_enabled: false,
      notes: null,
    },
    {
      id: "liability-b",
      name: "Hutang B",
      amount: 2_000_000,
      remaining_amount: 1_000_000,
      due_date: null,
      reminder_enabled: false,
      notes: null,
    },
  ]);
  const portfolio = calculatePortfolio(accounts, assets, liabilities);

  assert.equal(portfolio.totalAccountBalances, 3_000_000);
  assert.equal(portfolio.totalAssetValues, 10_000_000);
  assert.equal(portfolio.totalAsset, 13_000_000);
  assert.equal(portfolio.totalLiability, 4_000_000);
  assert.equal(portfolio.netWorth, 9_000_000);
  assert.deepEqual(
    portfolio.allocation.map((slice) => ({
      key: slice.key,
      value: slice.value,
    })),
    [
      { key: "cash", value: 3_000_000 },
      { key: "reksadana", value: 5_000_000 },
      { key: "gold", value: 2_000_000 },
      { key: "crypto", value: 1_000_000 },
      { key: "stock", value: 1_500_000 },
      { key: "other", value: 500_000 },
    ],
  );
  assert.ok(
    Math.abs(
      portfolio.allocation.reduce(
        (total, slice) => total + slice.percentage,
        0,
      ) - 100,
    ) < 0.000_001,
  );

  const empty = calculatePortfolio([], [], []);
  assert.deepEqual(empty, {
    totalAccountBalances: 0,
    totalAssetValues: 0,
    totalAsset: 0,
    totalLiability: 0,
    netWorth: 0,
    allocation: [],
  });

  const negativeNetWorth = calculatePortfolio(
    accounts,
    [],
    mapPortfolioLiabilities([
      {
        id: "liability-large",
        name: "Hutang besar",
        amount: 10_000_000,
        remaining_amount: 8_000_000,
        due_date: null,
        reminder_enabled: false,
        notes: null,
      },
    ]),
  );
  assert.equal(negativeNetWorth.netWorth, -5_000_000);
}

function runLiabilityReminderTests() {
  const now = new Date("2026-06-11T03:00:00.000Z");

  assert.deepEqual(
    getLiabilityReminderStatus(
      {
        dueDate: "2026-06-15",
        reminderEnabled: true,
        remainingAmount: 500_000,
      },
      now,
    ),
    { state: "due_soon", daysUntilDue: 4 },
  );
  assert.deepEqual(
    getLiabilityReminderStatus(
      {
        dueDate: "2026-06-01",
        reminderEnabled: true,
        remainingAmount: 500_000,
      },
      now,
    ),
    { state: "overdue", daysUntilDue: -10 },
  );
  assert.deepEqual(
    getLiabilityReminderStatus(
      {
        dueDate: "2026-07-15",
        reminderEnabled: true,
        remainingAmount: 500_000,
      },
      now,
    ),
    { state: "scheduled", daysUntilDue: 34 },
  );
  assert.deepEqual(
    getLiabilityReminderStatus(
      {
        dueDate: "2026-06-15",
        reminderEnabled: false,
        remainingAmount: 500_000,
      },
      now,
    ),
    { state: "inactive", daysUntilDue: null },
  );
  assert.deepEqual(
    getLiabilityReminderStatus(
      {
        dueDate: "2026-06-15",
        reminderEnabled: true,
        remainingAmount: 0,
      },
      now,
    ),
    { state: "inactive", daysUntilDue: null },
  );
}

function runAssetReturnTests() {
  assert.deepEqual(
    getAssetReturnSummary({
      totalCost: 1_000_000,
      currentValue: 1_250_000,
    }),
    {
      profit: 250_000,
      returnPercent: 25,
      direction: "gain",
    },
  );
  assert.deepEqual(
    getAssetReturnSummary({
      totalCost: 2_000_000,
      currentValue: 1_500_000,
    }),
    {
      profit: -500_000,
      returnPercent: -25,
      direction: "loss",
    },
  );
  assert.deepEqual(
    getAssetReturnSummary({
      totalCost: 1_000_000,
      currentValue: 1_000_000,
    }),
    {
      profit: 0,
      returnPercent: 0,
      direction: "flat",
    },
  );
  assert.equal(
    getAssetReturnSummary({
      totalCost: null,
      currentValue: 1_000_000,
    }),
    null,
  );
  assert.equal(
    getAssetReturnSummary({
      totalCost: 0,
      currentValue: 1_000_000,
    }),
    null,
  );
}

function runPortfolioFreshnessTests() {
  const now = new Date("2026-06-11T03:00:00.000Z");

  assert.deepEqual(
    getAssetFreshnessStatus(
      {
        unitPriceUpdatedAt: null,
        updatedAt: "2026-06-01T03:00:00.000Z",
      },
      now,
    ),
    {
      state: "fresh",
      daysSinceUpdate: 10,
      updatedAt: "2026-06-01T03:00:00.000Z",
    },
  );
  assert.deepEqual(
    getAssetFreshnessStatus(
      {
        unitPriceUpdatedAt: "2026-04-30T03:00:00.000Z",
        updatedAt: "2026-06-10T03:00:00.000Z",
      },
      now,
    ),
    {
      state: "stale",
      daysSinceUpdate: 42,
      updatedAt: "2026-04-30T03:00:00.000Z",
    },
  );
  assert.deepEqual(
    getAssetFreshnessStatus(
      {
        unitPriceUpdatedAt: null,
        updatedAt: "not-a-date",
      },
      now,
    ),
    {
      state: "unknown",
      daysSinceUpdate: null,
      updatedAt: null,
    },
  );

  const summary = getPortfolioFreshnessSummary(
    [{ updatedAt: "2026-06-09T03:00:00.000Z" }],
    [
      {
        unitPriceUpdatedAt: null,
        updatedAt: "2026-05-01T03:00:00.000Z",
      },
      {
        unitPriceUpdatedAt: "2026-06-10T03:00:00.000Z",
        updatedAt: "2026-05-15T03:00:00.000Z",
      },
    ],
    [{ updatedAt: "2026-06-11T01:00:00.000Z" }],
    now,
  );

  assert.deepEqual(summary, {
    lastUpdatedAt: "2026-06-11T01:00:00.000Z",
    staleAssetCount: 1,
  });
  assert.deepEqual(
    getPortfolioFreshnessSummary([], [], [], now),
    {
      lastUpdatedAt: null,
      staleAssetCount: 0,
    },
  );
}

function runPortfolioRecommendationTests() {
  const now = new Date("2026-06-11T03:00:00.000Z");
  const accounts = mapPortfolioAccounts([
    {
      id: "account-cash",
      name: "Cash",
      type: "cash",
      current_balance: 1_000_000,
      updated_at: "2026-06-10T03:00:00.000Z",
    },
  ]);
  const staleAssets = mapPortfolioAssets([
    assetRow({
      id: "asset-rdpu",
      type: "rdpu",
      name: "RDPU lama",
      total_cost: 1_000_000,
      current_value: 1_100_000,
      updated_at: "2026-05-01T03:00:00.000Z",
    }),
  ]);
  const urgentLiabilities = mapPortfolioLiabilities([
    {
      id: "liability-overdue",
      name: "Hutang lewat",
      amount: 5_000_000,
      remaining_amount: 4_000_000,
      due_date: "2026-06-01",
      reminder_enabled: true,
      notes: null,
      updated_at: "2026-06-10T03:00:00.000Z",
    },
  ]);
  const riskPortfolio = {
    accounts,
    assets: staleAssets,
    liabilities: urgentLiabilities,
    ...calculatePortfolio(accounts, staleAssets, urgentLiabilities),
  };

  assert.deepEqual(
    buildPortfolioRecommendations(riskPortfolio, now).map(
      (recommendation) => recommendation.id,
    ),
    [
      "negative-net-worth",
      "overdue-liability",
      "stale-asset-values",
    ],
  );

  const cashOnlyPortfolio = {
    accounts,
    assets: [],
    liabilities: [],
    ...calculatePortfolio(accounts, [], []),
  };
  assert.deepEqual(
    buildPortfolioRecommendations(cashOnlyPortfolio, now).map(
      (recommendation) => recommendation.id,
    ),
    ["concentrated-allocation", "no-investment-assets"],
  );

  const healthyAssets = mapPortfolioAssets([
    assetRow({
      id: "asset-rdpu",
      type: "rdpu",
      current_value: 500_000,
      updated_at: "2026-06-10T03:00:00.000Z",
    }),
    assetRow({
      id: "asset-gold",
      type: "gold",
      current_value: 500_000,
      updated_at: "2026-06-10T03:00:00.000Z",
    }),
  ]);
  const healthyPortfolio = {
    accounts: [],
    assets: healthyAssets,
    liabilities: [],
    ...calculatePortfolio([], healthyAssets, []),
  };

  assert.deepEqual(
    buildPortfolioRecommendations(healthyPortfolio, now).map(
      (recommendation) => recommendation.id,
    ),
    ["portfolio-looks-ok"],
  );
}

function runPortfolioValidationTests() {
  const assetForm = new FormData();
  assetForm.set("type", "crypto");
  assetForm.set("name", " Bitcoin ");
  assetForm.set("platform", " Pintu ");
  assetForm.set("quantity", "0,001");
  assetForm.set("unit", " BTC ");
  assetForm.set("unit_price", "1.500.000.000");
  assetForm.set("current_value", "1.500.000");
  assetForm.set("notes", " Investasi jangka panjang ");

  assert.deepEqual(parseAssetForm(assetForm), {
    name: "Bitcoin",
    type: "crypto",
    platform: "Pintu",
    quantity: 0.001,
    unit: "BTC",
    unitPrice: 1_500_000_000,
    totalCost: null,
    currentValue: 1_500_000,
    notes: "Investasi jangka panjang",
  });

  const zeroValueAsset = new FormData();
  zeroValueAsset.set("type", "stock");
  zeroValueAsset.set("name", "BBCA");
  zeroValueAsset.set("current_value", "0");
  assert.equal(parseAssetForm(zeroValueAsset).currentValue, 0);

  const invalidType = new FormData();
  invalidType.set("type", "cash");
  invalidType.set("name", "Cash");
  invalidType.set("current_value", "1000");
  assert.throws(
    () => parseAssetForm(invalidType),
    /Jenis aset tidak valid/,
  );

  const invalidAssetValue = new FormData();
  invalidAssetValue.set("type", "gold");
  invalidAssetValue.set("name", "Emas");
  invalidAssetValue.set("current_value", "-1");
  assert.throws(
    () => parseAssetForm(invalidAssetValue),
    /Nilai aset harus berupa angka 0 atau lebih/,
  );

  const liabilityForm = new FormData();
  liabilityForm.set("name", " Cicilan laptop ");
  liabilityForm.set("amount", "12.000.000");
  liabilityForm.set("remaining_amount", "7.500.000");
  liabilityForm.set("due_date", "2026-12-01");
  liabilityForm.set("reminder_enabled", "true");
  liabilityForm.set("notes", " Cicilan tanpa bunga ");

  assert.deepEqual(parseLiabilityForm(liabilityForm), {
    name: "Cicilan laptop",
    amount: 12_000_000,
    remainingAmount: 7_500_000,
    dueDate: "2026-12-01",
    reminderEnabled: true,
    notes: "Cicilan tanpa bunga",
  });

  const paidLiability = new FormData();
  paidLiability.set("name", "Hutang lunas");
  paidLiability.set("amount", "1.000.000");
  paidLiability.set("remaining_amount", "0");
  assert.deepEqual(
    {
      remainingAmount: parseLiabilityForm(paidLiability).remainingAmount,
      reminderEnabled: parseLiabilityForm(paidLiability).reminderEnabled,
    },
    {
      remainingAmount: 0,
      reminderEnabled: false,
    },
  );

  const excessiveRemaining = new FormData();
  excessiveRemaining.set("name", "Hutang");
  excessiveRemaining.set("amount", "1.000.000");
  excessiveRemaining.set("remaining_amount", "1.500.000");
  assert.throws(
    () => parseLiabilityForm(excessiveRemaining),
    /Sisa hutang tidak boleh lebih dari total hutang awal/,
  );

  const invalidDate = new FormData();
  invalidDate.set("name", "Hutang");
  invalidDate.set("amount", "1.000.000");
  invalidDate.set("remaining_amount", "500.000");
  invalidDate.set("due_date", "2026-02-30");
  assert.throws(
    () => parseLiabilityForm(invalidDate),
    /Tanggal jatuh tempo belum valid/,
  );

  const reminderWithoutDate = new FormData();
  reminderWithoutDate.set("name", "Hutang");
  reminderWithoutDate.set("amount", "1.000.000");
  reminderWithoutDate.set("remaining_amount", "500.000");
  reminderWithoutDate.set("reminder_enabled", "true");
  assert.throws(
    () => parseLiabilityForm(reminderWithoutDate),
    /Isi tanggal jatuh tempo sebelum mengaktifkan pengingat/,
  );
}

runPortfolioMappingTests();
runPortfolioCalculationTests();
runLiabilityReminderTests();
runAssetReturnTests();
runPortfolioFreshnessTests();
runPortfolioRecommendationTests();
runPortfolioValidationTests();
console.log("Portfolio calculation and validation tests passed.");
