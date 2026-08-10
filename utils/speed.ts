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
