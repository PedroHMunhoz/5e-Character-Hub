import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const TOTAL_STEPS = 7;

interface WizardStepHeaderProps {
  step: number;
  title: string;
  subtitle?: string;
}

export function WizardStepHeader({ step, title, subtitle }: WizardStepHeaderProps) {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.stepLabel, { color: goldColor }]}>
        Passo {step} de {TOTAL_STEPS}
      </ThemedText>
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
});
