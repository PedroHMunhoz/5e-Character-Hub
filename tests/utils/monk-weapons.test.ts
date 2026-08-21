// Direct unit tests for utils/monk-weapons.ts's isMonkWeapon - PHB "Martial
// Arts" (Monk, p.78): shortswords and any simple melee weapon lacking the
// two-handed or heavy property count as monk weapons.
import { describe, expect, it } from 'vitest';

import { isMonkWeapon } from '@/utils/monk-weapons';

describe('isMonkWeapon', () => {
  it('conta uma arma simples corpo-a-corpo comum', () => {
    expect(isMonkWeapon({ englishName: 'Club', weaponCategory: 'simple', isRanged: false, propertyCodes: ['L'] })).toBe(
      true
    );
  });

  it('conta a Espada Curta mesmo sendo marcial (exceção nomeada da regra)', () => {
    expect(
      isMonkWeapon({ englishName: 'Shortsword', weaponCategory: 'martial', isRanged: false, propertyCodes: ['F', 'L'] })
    ).toBe(true);
  });

  it('não conta uma arma marcial que não seja a Espada Curta', () => {
    expect(
      isMonkWeapon({ englishName: 'Longsword', weaponCategory: 'martial', isRanged: false, propertyCodes: ['V'] })
    ).toBe(false);
  });

  it('não conta uma arma à distância', () => {
    expect(
      isMonkWeapon({ englishName: 'Shortbow', weaponCategory: 'simple', isRanged: true, propertyCodes: ['A', '2H'] })
    ).toBe(false);
  });

  it('não conta uma arma simples com a propriedade Pesada', () => {
    // Nenhuma arma simples do PHB de fato carrega "Pesada" (é exclusiva de
    // marciais), mas a função verifica o código de qualquer forma - fixture
    // sintética só para exercitar esse ramo.
    expect(
      isMonkWeapon({
        englishName: 'Arma Simples Pesada (fixture)',
        weaponCategory: 'simple',
        isRanged: false,
        propertyCodes: ['H'],
      })
    ).toBe(false);
  });

  it('não conta uma arma simples de duas mãos', () => {
    expect(
      isMonkWeapon({ englishName: 'Greatclub', weaponCategory: 'simple', isRanged: false, propertyCodes: ['2H'] })
    ).toBe(false);
  });
});
