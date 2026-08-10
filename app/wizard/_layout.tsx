import { Stack } from 'expo-router';

import { WizardProvider } from '@/context/wizard-context';

export default function WizardLayout() {
  return (
    <WizardProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Raça' }} />
        <Stack.Screen name="class" options={{ title: 'Classe' }} />
        <Stack.Screen name="abilities" options={{ title: 'Atributos' }} />
        <Stack.Screen name="background" options={{ title: 'Antecedente' }} />
        <Stack.Screen name="equipment" options={{ title: 'Equipamento' }} />
        <Stack.Screen name="spells" options={{ title: 'Magias' }} />
        <Stack.Screen name="details" options={{ title: 'Detalhes' }} />
      </Stack>
    </WizardProvider>
  );
}
