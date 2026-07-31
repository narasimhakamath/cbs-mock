// Mock FX rates for spot quotes, keyed by "FROM/TO" symbol.
const BASE_RATES = {
  'GBP/AED': 5.0011,
  'USD/AED': 3.6725,
  'EUR/AED': 4.05,
  'GBP/USD': 1.27,
  'EUR/USD': 1.09,
  'GBP/BHD': 0.4756,
  'USD/BHD': 0.376,
  'EUR/BHD': 0.4073,
  'AED/BHD': 0.1024,
};

// Applies small random jitter so repeated quotes for the same pair aren't identical.
export function mockFxRate(symbol) {
  const inverse = symbol?.split('/').reverse().join('/');
  const base = BASE_RATES[symbol] ?? (BASE_RATES[inverse] ? 1 / BASE_RATES[inverse] : 1 + Math.random() * 4);
  const jitter = 1 + (Math.random() - 0.5) * 0.01;
  return Number((base * jitter).toFixed(7));
}
