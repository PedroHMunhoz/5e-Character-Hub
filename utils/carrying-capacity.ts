// Same flat "1 kg ~= 2 lb" rule used everywhere else in the app (see
// getWeightKg/formatWeightKg in data/queries/base-items.ts).
const KG_PER_LB = 0.5;
// RAW carrying capacity (PHB): Strength score x 15 lb, no optional
// encumbrance variant - see docs/TODO.md.
export const CARRY_CAPACITY_KG_PER_STR = 15 * KG_PER_LB;
// RAW (PHB): every 50 coins, of any denomination, weigh 1 lb.
const COINS_PER_LB = 50;

export function getCarryingCapacityKg(strTotal: number): number {
  return strTotal * CARRY_CAPACITY_KG_PER_STR;
}

export interface WeighableItem {
  weightKg: number;
  quantity: number;
}

export function getTotalCarriedWeightKg(items: WeighableItem[], coinCount: number): number {
  const itemsWeightKg = items.reduce((sum, item) => sum + item.weightKg * item.quantity, 0);
  const coinsWeightKg = (coinCount / COINS_PER_LB) * KG_PER_LB;
  return itemsWeightKg + coinsWeightKg;
}
