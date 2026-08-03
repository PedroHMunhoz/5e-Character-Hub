const METERS_PER_SQUARE = 1.5;

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
