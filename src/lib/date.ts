export type JakartaMonthRange = {
  start: string;
  end: string;
  startDate: string;
  nextMonthDate: string;
  label: string;
};

export function getJakartaMonthRange(now = new Date()): JakartaMonthRange {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonthDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  return {
    start: new Date(`${startDate}T00:00:00+07:00`).toISOString(),
    end: new Date(`${nextMonthDate}T00:00:00+07:00`).toISOString(),
    startDate,
    nextMonthDate,
    label: new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(now),
  };
}
