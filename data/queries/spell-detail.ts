import type { SQLiteDatabase } from 'expo-sqlite';

import {
  SPELL_CASTING_TIME_UNIT_LABELS,
  SPELL_DURATION_TYPE_LABELS,
  SPELL_DURATION_UNIT_LABELS,
  SPELL_LEVEL_LABELS,
  SPELL_RANGE_SHAPE_LABELS,
  SPELL_SCHOOL_LABELS,
} from '@/constants/spells';
import type { Spell } from '@/types/reference';
import { convertRangeToMeters } from './base-items';
import { getSpellById } from './spells';

export interface SpellDetail extends Spell {
  levelLabel: string;
  schoolLabel: string;
  castingTimeLabel: string;
  rangeLabel: string;
  componentsLabel: string;
  durationLabel: string;
}

// Raw 5etools JSON shapes stored in the spells table's castingTime/range/
// components/duration columns (see scripts/import-5e-data.mjs) - confirmed
// against real rows in assets/data/dnd5e.db.
interface CastingTimeEntry {
  number: number;
  unit: string;
}

interface SpellDistance {
  type: string;
  amount?: number;
}

interface SpellRange {
  type: string;
  distance: SpellDistance;
}

interface SpellComponents {
  v?: boolean;
  s?: boolean;
  m?: boolean | string | { text?: string };
}

interface SpellDurationEntry {
  type: string;
  duration?: { type: string; amount: number };
  concentration?: boolean;
}

function pluralize(amount: number, labels: { singular: string; plural: string }): string {
  return amount === 1 ? labels.singular : labels.plural;
}

function formatCastingTime(castingTime: unknown): string {
  const entries = (castingTime as CastingTimeEntry[] | null) ?? [];
  return entries
    .map((entry) => {
      const unitLabels = SPELL_CASTING_TIME_UNIT_LABELS[entry.unit];
      const label = unitLabels ? pluralize(entry.number, unitLabels) : entry.unit;
      return `${entry.number} ${label}`;
    })
    .join(' ou ');
}

// A converted value of exactly 1,5 prints with a singular unit ("1,5 metro",
// "1,5 quilômetro") in the book, while every other observed value (including
// other non-integers like 4,5 or 7,5) uses the plural - verified against
// Cordão de Flechas/Palavra de Recordação (5 pés -> "1,5 metro") and
// Clarividência (1 milha -> "1,5 quilômetro") in
// translations/pt-BR/_raw-extracts/PHB.txt.
function formatMeasurement(numberText: string, singular: string, plural: string): string {
  return `${numberText} ${numberText === '1,5' ? singular : plural}`;
}

function formatDistance(distance: SpellDistance | undefined): string {
  switch (distance?.type) {
    case 'touch':
      return 'Toque';
    case 'self':
      return 'Pessoal';
    case 'unlimited':
      return 'Ilimitado';
    case 'sight':
      return 'Visão';
    case 'feet':
      return distance.amount != null
        ? formatMeasurement(convertRangeToMeters(String(distance.amount)), 'metro', 'metros')
        : '—';
    case 'miles': {
      // The book uses a flat x1,5 factor here (not the real-world x1,609) -
      // verified exactly against Clarividência (1 mi -> 1,5 km), Chuva de
      // Meteoros/Projetar Imagem (500 mi -> 750 km) and Controlar o Clima
      // (5 mi de raio -> 7,5 km de raio).
      if (distance.amount == null) return '—';
      const km = Math.round(distance.amount * 1.5 * 100) / 100;
      return formatMeasurement(String(km).replace('.', ','), 'quilômetro', 'quilômetros');
    }
    default:
      return distance?.type ?? '—';
  }
}

function formatRange(range: unknown): string {
  const value = range as SpellRange | null;
  if (!value) return '—';

  // The only range.type in the whole reference db without a `distance`
  // (Dream) - guard before touching value.distance.
  if (value.type === 'special') return 'Especial';

  const shape = SPELL_RANGE_SHAPE_LABELS[value.type];
  if (!shape) return formatDistance(value.distance);

  // Area shapes (cone/line/cube/radius/sphere/hemisphere) originate from the
  // caster - the book prints them as "Pessoal (<forma> de X metros)" and/or
  // "Pessoal (X metros de raio)", with hemisphere alone taking both a
  // leading shape word and the trailing "de raio".
  const measurement = formatDistance(value.distance);
  const inner = [shape.prefix, measurement, shape.suffix].filter(Boolean).join(' ');
  return `Pessoal (${inner})`;
}

function formatComponents(components: unknown, materialText: string | undefined): string {
  const value = components as SpellComponents | null;
  if (!value) return '—';

  const parts: string[] = [];
  if (value.v) parts.push('V');
  if (value.s) parts.push('S');

  let materialSuffix = '';
  if (value.m) {
    parts.push('M');
    if (materialText) materialSuffix = ` (${materialText})`;
    else if (typeof value.m === 'string') materialSuffix = ` (${value.m})`;
    else if (typeof value.m === 'object' && value.m.text) materialSuffix = ` (${value.m.text})`;
  }

  return parts.join(', ') + materialSuffix;
}

function formatDurationEntry(entry: SpellDurationEntry): string {
  let label: string;
  if (entry.type === 'timed' && entry.duration) {
    const unitLabels = SPELL_DURATION_UNIT_LABELS[entry.duration.type];
    const unitLabel = unitLabels ? pluralize(entry.duration.amount, unitLabels) : entry.duration.type;
    label = `${entry.duration.amount} ${unitLabel}`;
  } else {
    label = SPELL_DURATION_TYPE_LABELS[entry.type] ?? entry.type;
  }
  return entry.concentration ? `Concentração, até ${label}` : label;
}

function formatDuration(duration: unknown): string {
  const entries = (duration as SpellDurationEntry[] | null) ?? [];
  return entries.map(formatDurationEntry).join(' ou ');
}

export async function getSpellDetailById(db: SQLiteDatabase, id: number): Promise<SpellDetail | null> {
  const spell = await getSpellById(db, id);
  if (!spell) return null;

  const levelLabel = SPELL_LEVEL_LABELS.find((entry) => entry.level === spell.level)?.label ?? `Nível ${spell.level}`;
  const schoolLabel = SPELL_SCHOOL_LABELS[spell.school] ?? spell.school;

  return {
    ...spell,
    levelLabel,
    schoolLabel: spell.ritual ? `${schoolLabel} (Ritual)` : schoolLabel,
    castingTimeLabel: formatCastingTime(spell.castingTime),
    rangeLabel: formatRange(spell.range),
    componentsLabel: formatComponents(spell.components, spell.materialText),
    durationLabel: formatDuration(spell.duration),
  };
}
