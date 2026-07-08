export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function isValidPhone(value: string) {
  const digits = digitsOnly(value);
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const [year, month, day] = value.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day && date < new Date();
}

export function isValidToken(value: string) {
  return /^\d{6}$/.test(digitsOnly(value));
}

export function isStrongEnoughPassword(value: string) {
  return value.length >= 8;
}

export function isValidCardExpiry(value: string) {
  if (!/^\d{2}\/\d{2}$/.test(value)) return false;

  const month = Number(value.slice(0, 2));
  const year = Number(`20${value.slice(3)}`);
  if (month < 1 || month > 12) return false;

  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth > new Date();
}
