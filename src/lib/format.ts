import dayjs from 'dayjs';

/** Money is stored in integer minor units; render with 2 decimals. */
export function money(minor: number | null | undefined, currency = 'INR'): string {
  if (minor == null) return '—';
  const value = minor / 100;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export function date(d: string | Date | null | undefined): string {
  return d ? dayjs(d).format('DD MMM YYYY') : '—';
}

export function dateTime(d: string | Date | null | undefined): string {
  return d ? dayjs(d).format('DD MMM YYYY HH:mm') : '—';
}

/** Weight is stored in grams. */
export function kg(grams: number | null | undefined): string {
  return grams == null ? '—' : `${(grams / 1000).toFixed(2)} kg`;
}

const BATCH_COLORS: Record<string, string> = {
  PLANNED: 'default',
  PLACED: 'cyan',
  ACTIVE: 'green',
  READY_FOR_HARVEST: 'gold',
  HARVESTING: 'orange',
  SOLD: 'blue',
  SETTLEMENT_PENDING: 'volcano',
  SETTLED: 'geekblue',
  CLOSED: 'default',
};
export function batchColor(status: string): string {
  return BATCH_COLORS[status] ?? 'default';
}

const CAP_COLORS: Record<string, string> = { FARMER: 'green', DISTRIBUTOR: 'blue', SUPPLIER: 'purple' };
export function capColor(cap: string): string {
  return CAP_COLORS[cap] ?? 'default';
}
