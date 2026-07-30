export function getCurrencyPrecision(code) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).resolvedOptions()
      .maximumFractionDigits;
  } catch {
    return 2;
  }
}

export function roundToCurrencyPrecision(amount, code) {
  const digits = getCurrencyPrecision(code);
  return Number(amount.toFixed(digits));
}
