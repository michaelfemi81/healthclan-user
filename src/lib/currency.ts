import { Platform } from 'react-native';
import { appConfig } from './config';

export type SupportedCurrency = 'NGN' | 'GHS' | 'KES' | 'RWF' | 'ZAR' | 'SZL' | 'BWP' | 'LRD' | 'GMD' | 'XAF' | 'XOF' | 'CVE' | 'ZWG' | 'MWK' | 'CAD' | 'USD' | 'SSP' | 'ETB' | 'GEL' | 'GBP' | 'PHP' | 'VES' | 'MXN' | 'BRL' | 'BIF';

export type CurrencyOption = {
  code: SupportedCurrency;
  label: string;
  symbol: string;
};

const CURRENCY_KEY = 'healthclan.currency';
const RATES_KEY = 'healthclan.exchangeRates';
const memoryStore = new Map<string, string>();

export const currencyOptions: CurrencyOption[] = [
  { code: 'NGN', label: 'Nigerian Naira', symbol: 'N' },
  { code: 'GHS', label: 'Ghanaian Cedi', symbol: 'GHS' },
  { code: 'KES', label: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'RWF', label: 'Rwandan Franc', symbol: 'RF' },
  { code: 'ZAR', label: 'South African Rand', symbol: 'R' },
  { code: 'SZL', label: 'Swazi Lilangeni', symbol: 'L' },
  { code: 'BWP', label: 'Botswana Pula', symbol: 'P' },
  { code: 'LRD', label: 'Liberian Dollar', symbol: 'L$' },
  { code: 'GMD', label: 'Gambian Dalasi', symbol: 'D' },
  { code: 'XAF', label: 'Central African CFA Franc', symbol: 'FCFA' },
  { code: 'XOF', label: 'West African CFA Franc', symbol: 'CFA' },
  { code: 'CVE', label: 'Cape Verdean Escudo', symbol: 'Esc' },
  { code: 'ZWG', label: 'Zimbabwe Gold', symbol: 'ZiG' },
  { code: 'MWK', label: 'Malawian Kwacha', symbol: 'MK' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'SSP', label: 'South Sudanese Pound', symbol: 'SS£' },
  { code: 'ETB', label: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'GEL', label: 'Georgian Lari', symbol: '₾' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'PHP', label: 'Philippine Peso', symbol: '₱' },
  { code: 'VES', label: 'Venezuelan Bolívar', symbol: 'Bs.' },
  { code: 'MXN', label: 'Mexican Peso', symbol: 'MX$' },
  { code: 'BRL', label: 'Brazilian Real', symbol: 'R$' },
  { code: 'BIF', label: 'Burundian Franc', symbol: 'FBu' },
];

const fallbackRatesFromGbp: Record<SupportedCurrency, number> = {
  GBP: 1,
  NGN: 1900,
  USD: 1.27,
  CAD: 1.74,
  GHS: 15.6,
  KES: 164,
  RWF: 1750,
  ZAR: 23,
  SZL: 23,
  BWP: 17.5,
  LRD: 240,
  GMD: 92,
  XAF: 765,
  XOF: 765,
  CVE: 128,
  ZWG: 33,
  MWK: 2200,
  SSP: 1650,
  ETB: 170,
  GEL: 3.45,
  PHP: 74,
  VES: 46,
  MXN: 23,
  BRL: 7.1,
  BIF: 3700,
};

const countryCurrency: Record<string, SupportedCurrency> = {
  NG: 'NGN',
  GB: 'GBP',
  US: 'USD',
  CA: 'CAD',
  GH: 'GHS',
  KE: 'KES',
  RW: 'RWF',
  ZA: 'ZAR',
  SZ: 'SZL', BW: 'BWP', LR: 'LRD', GM: 'GMD', GA: 'XAF', GQ: 'XAF', CM: 'XAF',
  CI: 'XOF', CV: 'CVE', BJ: 'XOF', TG: 'XOF', ZW: 'ZWG', MW: 'MWK',
  NE: 'XOF', CG: 'XAF', SS: 'SSP', ET: 'ETB', GE: 'GEL', PH: 'PHP', VE: 'VES',
  MX: 'MXN', BR: 'BRL', SN: 'XOF', BF: 'XOF', BI: 'BIF',
};

const dialCurrency: Record<string, SupportedCurrency> = {
  '+234': 'NGN',
  '+44': 'GBP',
  '+1': 'USD',
  '+233': 'GHS',
  '+254': 'KES',
  '+27': 'ZAR',
  '+250': 'RWF', '+268': 'SZL', '+267': 'BWP', '+231': 'LRD', '+220': 'GMD',
  '+241': 'XAF', '+240': 'XAF', '+237': 'XAF', '+225': 'XOF', '+238': 'CVE',
  '+229': 'XOF', '+228': 'XOF', '+263': 'ZWG', '+265': 'MWK', '+227': 'XOF',
  '+242': 'XAF', '+211': 'SSP', '+251': 'ETB', '+995': 'GEL', '+63': 'PHP',
  '+58': 'VES', '+52': 'MXN', '+55': 'BRL', '+221': 'XOF', '+226': 'XOF', '+257': 'BIF',
};

function read(key: string) {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  return memoryStore.get(key) ?? null;
}

function write(key: string, value: string) {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      return;
    }
  }

  memoryStore.set(key, value);
}

function normalizeRatePayload(payload: any) {
  const source = payload?.data || payload || {};
  const rates = source.rates || source.exchangeRates || source;

  if (!rates || typeof rates !== 'object') return null;

  const nextRates = Object.entries(rates).reduce<Partial<Record<SupportedCurrency, number>>>((result, [currency, rate]) => {
    const code = String(currency).toUpperCase();
    const numericRate = Number(rate);

    if (isSupportedCurrency(code) && Number.isFinite(numericRate) && numericRate > 0) {
      result[code] = numericRate;
    }

    return result;
  }, {});

  if (!nextRates.GBP) nextRates.GBP = 1;

  return {
    baseCurrency: isSupportedCurrency(source.baseCurrency || source.base) ? source.baseCurrency || source.base : 'GBP',
    rates: { ...fallbackRatesFromGbp, ...nextRates } as Record<SupportedCurrency, number>,
    updatedAt: source.updatedAt || new Date().toISOString(),
  };
}

function cachedBackendRates() {
  try {
    const cached = read(RATES_KEY);
    const parsed = cached ? JSON.parse(cached) : null;
    return normalizeRatePayload(parsed)?.rates || fallbackRatesFromGbp;
  } catch {
    return fallbackRatesFromGbp;
  }
}

export async function loadBackendExchangeRates() {
  const response = await fetch(`${appConfig.apiBaseUrl}/currency/rates`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to load exchange rates from HealthClan.');
  }

  const payload = await response.json().catch(() => ({}));
  const normalized = normalizeRatePayload(payload);

  if (!normalized) {
    throw new Error('HealthClan returned invalid exchange rates.');
  }

  write(RATES_KEY, JSON.stringify(normalized));
  return normalized;
}

export function isSupportedCurrency(value?: string): value is SupportedCurrency {
  return currencyOptions.some(currency => currency.code === value);
}

export function currencyForCountry(country?: string) {
  return countryCurrency[String(country || '').toUpperCase()] || 'NGN';
}

export function currencyForDialCode(dialCode?: string) {
  return dialCurrency[String(dialCode || '')] || 'NGN';
}

export function getPreferredCurrency() {
  const stored = read(CURRENCY_KEY);
  return isSupportedCurrency(stored || '') ? stored as SupportedCurrency : 'NGN';
}

export function setPreferredCurrency(currency: SupportedCurrency) {
  write(CURRENCY_KEY, currency);
}

export function convertAmount(amount: number, from: string, to: string) {
  const rates = cachedBackendRates();
  const source = isSupportedCurrency(from) ? from : 'GBP';
  const target = isSupportedCurrency(to) ? to : getPreferredCurrency();
  const baseAmount = Number(amount) / rates[source];
  return baseAmount * rates[target];
}

export function formatCurrency(amount: number, currency: string) {
  const code = isSupportedCurrency(currency) ? currency : getPreferredCurrency();

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: ['NGN', 'KES', 'RWF', 'XAF', 'XOF', 'MWK', 'BIF'].includes(code) ? 0 : 2,
  }).format(amount);
}

export function convertedCurrencyLabel(amount: number, from: string, to = getPreferredCurrency()) {
  const converted = convertAmount(amount, from, to);
  return formatCurrency(converted, to);
}
