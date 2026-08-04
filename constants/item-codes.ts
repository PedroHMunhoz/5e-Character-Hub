// Static pt-BR labels for 5e base-item taxonomy codes (weapon category,
// weapon properties, armor weight class). These are fixed rules terms, not
// book prose, so they don't need to come from the `translations` table.

export const WEAPON_CATEGORY_LABELS: Record<string, string> = {
  simple: 'Simples',
  martial: 'Marcial',
};

export const WEAPON_PROPERTY_LABELS: Record<string, string> = {
  F: 'Precisão',
  H: 'Pesada',
  L: 'Leve',
  LD: 'Recarregar',
  R: 'Alcance',
  S: 'Especial',
  T: 'Arremessável',
  V: 'Versátil',
};

export const ARMOR_TYPE_LABELS: Record<string, string> = {
  LA: 'Leve',
  MA: 'Média',
  HA: 'Pesada',
  S: 'Escudo',
};
