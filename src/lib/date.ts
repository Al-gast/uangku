export type JakartaMonthRange = {
  key: string;
  start: string;
  end: string;
  startDate: string;
  nextMonthDate: string;
  label: string;
  previousKey: string;
  nextKey: string;
  isCurrentMonth: boolean;
};

export type JakartaMonthProgress = {
  elapsedDays: number;
  totalDays: number;
};

export function getJakartaMonthRange(now = new Date()): JakartaMonthRange {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return buildJakartaMonthRange(year, month, year, month);
}

export function resolveJakartaMonthRange(
  monthKey: string | null | undefined,
  now = new Date(),
): JakartaMonthRange {
  const current = getJakartaMonthRange(now);

  if (!monthKey || !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) {
    return current;
  }

  const [year, month] = monthKey.split("-").map(Number);

  if (monthKey > current.key) {
    return current;
  }

  return buildJakartaMonthRange(
    year,
    month,
    Number(current.key.slice(0, 4)),
    Number(current.key.slice(5, 7)),
  );
}

export function getJakartaMonthProgress(
  month: JakartaMonthRange,
  now = new Date(),
): JakartaMonthProgress {
  const [year, monthNumber] = month.key.split("-").map(Number);
  const totalDays = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  if (!month.isCurrentMonth) {
    return { elapsedDays: totalDays, totalDays };
  }

  const day = Number(
    new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(now),
  );

  return {
    elapsedDays: Math.min(totalDays, Math.max(1, day)),
    totalDays,
  };
}

function buildJakartaMonthRange(
  year: number,
  month: number,
  currentYear: number,
  currentMonth: number,
): JakartaMonthRange {
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const startDate = `${key}-01`;
  const nextMonthDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  return {
    key,
    start: new Date(`${startDate}T00:00:00+07:00`).toISOString(),
    end: new Date(`${nextMonthDate}T00:00:00+07:00`).toISOString(),
    startDate,
    nextMonthDate,
    label: new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(new Date(`${startDate}T12:00:00+07:00`)),
    previousKey: `${previousYear}-${String(previousMonth).padStart(2, "0")}`,
    nextKey: `${nextYear}-${String(nextMonth).padStart(2, "0")}`,
    isCurrentMonth: year === currentYear && month === currentMonth,
  };
}
