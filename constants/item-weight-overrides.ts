// Devir's official pt-BR PHB doesn't do a precise lb->kg conversion - it
// rounds to cleaner metric figures in the printed equipment tables (e.g.
// Shield is 6 lb, which converts to 2,7 kg, but the book prints "3 kg").
// Verified against translations/pt-BR/_raw-extracts/PHB.txt (pages 148/151).
// Keyed by English source name since that's stable across re-imports.
export const ITEM_WEIGHT_KG_OVERRIDES: Record<string, string> = {
  'Light Crossbow': '2,5',
  Shortsword: '1',
  Breastplate: '10',
  Shield: '3',
  'Crossbow Bolt': '0,04', // book prices/weighs bolts by the 20-pack: 0,75 kg / 20
};
