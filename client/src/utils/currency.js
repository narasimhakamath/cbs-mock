export function getCurrencyPrecision(code) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).resolvedOptions()
      .maximumFractionDigits;
  } catch {
    return 2;
  }
}

export function formatAmount(amount, code) {
  const digits = getCurrencyPrecision(code);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
  return `${formatted} ${code}`;
}
