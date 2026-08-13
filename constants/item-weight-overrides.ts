// Galápagos's official pt-BR PHB rounds weights to a flat "1 kg ≈ 2 lb" rule
// rather than converting precisely (see formatWeightKg in
// data/queries/base-items.ts, which applies that rule as the default
// fallback). This table only holds the items that print something other than
// that rule: values needing 2 decimals of precision (the 20-packs of ammo),
// or a book value that's a genuine outlier - see DUVIDAS.md for Pike/Heavy
// Crossbow/Viol, which keep the English dataset's weight instead of the
// printed one.
// Verified against translations/pt-BR/_raw-extracts/PHB.txt (pages 148/151/152).
// Keyed by English source name since that's stable across re-imports.
//
// No entry for singular "Crossbow Bolt" (or Arrow/Blowgun Needle/Sling
// Bullet) on purpose - formatWeightKg's default weight_lb-based calculation
// already reconstructs the printed pack weight exactly once multiplied by
// the owned quantity (see its doc comment), and a rounded per-unit override
// here would compound rounding error instead.
export const ITEM_WEIGHT_KG_OVERRIDES: Record<string, string> = {
  'Light Crossbow': '2,5',
  Shortsword: '1',
  Breastplate: '10',
  Shield: '3',
  'Crossbow Bolts (20)': '0,75',
  'Sling Bullets (20)': '0,75',
};
