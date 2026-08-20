export interface CurrencyBreakdown {
  po: number;
  pp: number;
  pc: number;
}

// Splits a cp amount into whole PO (100cp)/PP (10cp)/PC (1cp) - PHB item
// prices are always given in gp/sp/cp, never pp/ep (see "Peças de Moeda",
// PHB p.143: "a peça de ouro vale dez peças de prata... a peça de prata
// vale dez peças de cobre"), so those three denominations are enough to
// represent any shop price or purchase total without ever needing a
// fractional PO.
export function breakdownCp(valueCp: number): CurrencyBreakdown {
  const po = Math.floor(valueCp / 100);
  const remainder = valueCp % 100;
  const pp = Math.floor(remainder / 10);
  const pc = remainder % 10;
  return { po, pp, pc };
}

// "4 PO, 9 PP, 6 PC" - only the denominations that are actually non-zero, so
// a 2-gp dagger just shows "2 PO" instead of "2 PO, 0 PP, 0 PC". Falls back
// to "0 PC" for a zero amount (nothing else would be non-zero).
export function formatCurrencyBreakdown(valueCp: number): string {
  const { po, pp, pc } = breakdownCp(valueCp);
  const parts: string[] = [];
  if (po > 0) parts.push(`${po} PO`);
  if (pp > 0) parts.push(`${pp} PP`);
  if (pc > 0 || parts.length === 0) parts.push(`${pc} PC`);
  return parts.join(', ');
}
