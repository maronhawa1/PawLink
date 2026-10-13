export function parseApiDate(value: string): Date {
  const normalized = value
    .replace(" ", "T")
    .replace(/([+-]\d{2})$/, "$1:00");

  return new Date(normalized);
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = parseApiDate(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export function getAge(birthDate: string | null): string {
  if (!birthDate) {
    return "";
  }

  const birth = parseApiDate(birthDate);

  if (Number.isNaN(birth.getTime())) {
    return "";
  }

  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }

  if (months < 1) {
    return "Under 1 month";
  }

  if (months < 12) {
    return months === 1 ? "1 month" : `${months} months`;
  }

  const years = Math.floor(months / 12);
  return years === 1 ? "1 year" : `${years} years`;
}

export function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

export function toInputDate(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = parseApiDate(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}