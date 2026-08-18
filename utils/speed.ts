const METERS_PER_SQUARE = 1.5;
const FEET_PER_SQUARE = 5;

// The reference database stores race speed in feet (5etools/PHB raw data,
// e.g. 30). Character.speed is always stored in meters (see
// getSpeedInSquares/formatSpeed below) - converted via the pt-BR books'
// square-based abstraction (5ft square = 1.5m), not the literal 0.3048
// feet-to-meters ratio, so 30ft -> 9m (not 9.14m).
export function feetToMeters(feet: number): number {
  return (feet / FEET_PER_SQUARE) * METERS_PER_SQUARE;
}

export function feetToSquares(feet: number): number {
  return feet / FEET_PER_SQUARE;
}

// PHB: wearing armor below its Strength requirement reduces speed by 10 feet.
export const ARMOR_STRENGTH_SPEED_PENALTY_FEET = 10;

export function getSpeedInSquares(speed: string): number | null {
  const trimmed = speed.trim();
  if (trimmed === '') {
    return null;
  }
  const meters = Number(trimmed);
  if (!Number.isFinite(meters)) {
    return null;
  }
  return Math.floor(meters / METERS_PER_SQUARE);
}

export function formatSpeed(speed: string): string {
  const squares = getSpeedInSquares(speed);
  if (squares === null) {
    return '';
  }
  return `${speed}m / ${squares}q`;
}

// Monk's "Unarmored Movement" (PHB p.78, table "O Monge") - the bonus
// speed (in feet in the raw table) while not wearing armor or wielding a
// shield, converted through feetToMeters for consistency with how speed is
// stored/displayed everywhere else.
const UNARMORED_MOVEMENT_TIERS: { minLevel: number; bonusFeet: number }[] = [
  { minLevel: 18, bonusFeet: 30 },
  { minLevel: 14, bonusFeet: 25 },
  { minLevel: 10, bonusFeet: 20 },
  { minLevel: 6, bonusFeet: 15 },
  { minLevel: 2, bonusFeet: 10 },
];

export function getMonkUnarmoredMovementBonusMeters(monkLevel: number): number {
  const tier = UNARMORED_MOVEMENT_TIERS.find((t) => monkLevel >= t.minLevel);
  return tier ? feetToMeters(tier.bonusFeet) : 0;
}
