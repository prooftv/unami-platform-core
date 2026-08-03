// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

export function formatPhoneNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return `+27${digits.slice(1)}`;
  }
  if (digits.startsWith('27') && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.startsWith('27') && digits.length === 12) {
    return `+${digits}`;
  }
  return raw.startsWith('+') ? raw : null;
}

export function maskPhoneNumber(phone: string): string {
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 3)}...${phone.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Region
// ---------------------------------------------------------------------------

export function normaliseRegion(input: string): string {
  const upper = input.trim().toUpperCase();
  const map: Record<string, string> = {
    'KWAZULU-NATAL': 'KZN',
    'KWAZULU NATAL': 'KZN',
    'WESTERN CAPE': 'WC',
    'GAUTENG': 'GP',
    'EASTERN CAPE': 'EC',
    'FREE STATE': 'FS',
    'LIMPOPO': 'LP',
    'MPUMALANGA': 'MP',
    'NORTHERN CAPE': 'NC',
    'NORTH WEST': 'NW',
    'NATIONAL': 'National',
  };
  return map[upper] ?? input.trim();
}

// ---------------------------------------------------------------------------
// Control flow
// ---------------------------------------------------------------------------

export function failOpen<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
}

export function formatPercentage(decimal: number): string {
  return `${(decimal * 100).toFixed(1)}%`;
}
