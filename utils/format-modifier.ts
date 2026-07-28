export function formatModifier(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.startsWith('+') || trimmed.startsWith('-')) {
    return trimmed;
  }
  return /^\d+$/.test(trimmed) ? `+${trimmed}` : trimmed;
}
