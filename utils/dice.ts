function rollDie(faces: number): number {
  return Math.floor(Math.random() * faces) + 1;
}

// PHB ability score method: roll 4d6, drop the lowest die, sum the rest.
export function roll4d6DropLowest(): number {
  const rolls = [rollDie(6), rollDie(6), rollDie(6), rollDie(6)].sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
}

// One full set of 6 ability scores via the "Rolagem 4d6" method - the player
// then assigns each result to an ability in the wizard's abilities step.
export function rollAbilityScoreSet(): number[] {
  return Array.from({ length: 6 }, () => roll4d6DropLowest());
}

interface GoldFormula {
  count: number;
  faces: number;
  multiplier: number;
}

// classes.starting_equipment.goldAlternative arrives as a raw 5etools tag,
// e.g. "{@dice 4d4 × 10|4d4 × 10|Starting Gold}" - the NdM×mult numbers are
// always embedded somewhere inside it, so a plain regex extraction (rather
// than a full 5etools tag parser) is enough for both rolling and display.
function parseGoldFormula(formula: string): GoldFormula | null {
  const match = formula.match(/(\d+)\s*d\s*(\d+)(?:\s*[×x]\s*(\d+))?/i);
  if (!match) return null;

  const [, countStr, facesStr, multiplierStr] = match;
  return {
    count: Number(countStr),
    faces: Number(facesStr),
    multiplier: multiplierStr ? Number(multiplierStr) : 1,
  };
}

// Parses/rolls a class's starting-gold formula, e.g. "5d4 × 10" (Fighter) or
// "5d4" (Monk, no multiplier) - confirmed shapes from classes.starting_
// equipment.goldAlternative across the PHB. Rolls NdM, multiplying the sum
// by the trailing factor when present.
export function rollGoldFormula(formula: string): number {
  const parsed = parseGoldFormula(formula);
  if (!parsed) return 0;

  let total = 0;
  for (let i = 0; i < parsed.count; i++) total += rollDie(parsed.faces);
  return total * parsed.multiplier;
}

// Clean display text for a raw goldAlternative tag, e.g. "4d4 × 10" or "5d4"
// (no multiplier) - strips the surrounding {@dice ...} wrapper the raw DSL
// carries, which the wizard was previously showing verbatim.
export function formatGoldFormula(formula: string): string {
  const parsed = parseGoldFormula(formula);
  if (!parsed) return formula;
  return parsed.multiplier > 1
    ? `${parsed.count}d${parsed.faces} × ${parsed.multiplier}`
    : `${parsed.count}d${parsed.faces}`;
}
