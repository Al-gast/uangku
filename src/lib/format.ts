export function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPrivateAmount(value: number, privacyEnabled: boolean) {
  return privacyEnabled ? "Rp••••••" : formatIdr(value);
}

export function formatDateId(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function formatCompactDateId(value: string, now = new Date()) {
  const date = new Date(value);
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(now);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(yesterday);

  if (dateKey === todayKey) {
    return "Hari ini";
  }

  if (dateKey === yesterdayKey) {
    return "Kemarin";
  }

  const currentYear = new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(now);
  const dateYear = new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: dateYear === currentYear ? undefined : "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function toJakartaDateInput(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(value);
}
