const MAX_SAFE_INPUT_LENGTH = 80;

function cleanNumericInput(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("id-ID")
    .replace(/rp\.?/g, "")
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");
}

export function parseIdrInput(value: string) {
  const raw = cleanNumericInput(value);

  if (!raw || raw.length > MAX_SAFE_INPUT_LENGTH) {
    return Number.NaN;
  }

  return Number(raw.replace(/\./g, "").replace(",", "."));
}

export function parseLocaleDecimalInput(value: string) {
  const raw = cleanNumericInput(value);

  if (!raw || raw.length > MAX_SAFE_INPUT_LENGTH) {
    return Number.NaN;
  }

  const commaIndex = raw.lastIndexOf(",");
  const dotIndex = raw.lastIndexOf(".");
  const decimalIndex = Math.max(commaIndex, dotIndex);

  if (commaIndex >= 0 && dotIndex >= 0) {
    const integerPart = raw.slice(0, decimalIndex).replace(/[,.]/g, "");
    const decimalPart = raw.slice(decimalIndex + 1).replace(/[,.]/g, "");
    return Number(`${integerPart}.${decimalPart}`);
  }

  const separator = commaIndex >= 0 ? "," : dotIndex >= 0 ? "." : null;

  if (!separator) {
    return Number(raw);
  }

  const parts = raw.split(separator);

  if (parts.length > 2) {
    return Number(parts.join(""));
  }

  const [integerPart, decimalPart] = parts;

  if (
    separator === "." &&
    decimalPart.length === 3 &&
    integerPart !== "0" &&
    integerPart.length <= 3
  ) {
    return Number(`${integerPart}${decimalPart}`);
  }

  return Number(`${integerPart}.${decimalPart}`);
}
