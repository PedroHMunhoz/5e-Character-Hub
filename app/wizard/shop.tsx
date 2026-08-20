import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ItemShop } from '@/components/character/item-shop';
import { ThemedText } from '@/components/themed-text';
import { useWizardDraft } from '@/context/wizard-context';

// Reached from the Equipamento step's 'gold' mode ("Abrir Loja" button, see
// app/wizard/equipment.tsx) - a routed screen rather than something
// equipment.tsx mounts inline, so the shop gets its own full-screen space
// instead of competing with the rest of that step's content.
export default function WizardShopStep() {
  const router = useRouter();
  const { draft, setPurchaseCart, setPurchasedEquipment, setGoldSpentCp } = useWizardDraft();

  if (draft.goldRolled === null) {
    // Not reachable through the normal "Abrir Loja" button (only shown once
    // gold has been rolled) - only via manual back/forward navigation, same
    // defensive backstop as assemble-character.ts's missingChoices check.
    return (
      <View style={styles.emptyState}>
        <ThemedText>Role o ouro inicial antes de abrir a loja.</ThemedText>
      </View>
    );
  }

  return (
    <ItemShop
      availableCp={draft.goldRolled * 100}
      initialCart={draft.purchaseCart}
      onCartChange={(cart, grants, totalCostCp) => {
        setPurchaseCart(cart);
        setPurchasedEquipment(grants);
        setGoldSpentCp(totalCostCp);
      }}
      confirmLabel="Comprar"
      onConfirm={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
