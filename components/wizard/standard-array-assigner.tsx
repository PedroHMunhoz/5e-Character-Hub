import { ValuePoolAssigner, type ValuePoolAssignments } from '@/components/wizard/value-pool-assigner';

// PHB standard array, in printed order (not sorted) - purely cosmetic since
// ValuePoolAssigner assigns by index either way.
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

interface StandardArrayAssignerProps {
  assignments: ValuePoolAssignments;
  onChange: (next: ValuePoolAssignments) => void;
}

export function StandardArrayAssigner({ assignments, onChange }: StandardArrayAssignerProps) {
  return <ValuePoolAssigner pool={STANDARD_ARRAY} assignments={assignments} onChange={onChange} />;
}
