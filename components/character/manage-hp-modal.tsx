import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MessageModal } from '@/components/character/message-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const MASSIVE_DAMAGE_DISCLAIMER_PT =
  'Dano maciço pode matar instantaneamente. Quando um dano reduz seus pontos de vida a 0 e ainda há dano sobrando, você morre se o restante do dano que sobrou for igual ou maior do que seu máximo de pontos de vida.';

// Ready for when the app gains a localization system — not rendered yet.
const MASSIVE_DAMAGE_DISCLAIMER_EN =
  'Massive damage can kill you instantly. When damage reduces you to 0 hit points and there is damage remaining, you die if the remaining damage equals or exceeds your hit point maximum.';
void MASSIVE_DAMAGE_DISCLAIMER_EN;

const DAMAGE_PRESETS = [-1, -5, -10];
const HEAL_PRESETS = [1, 5, 10];

const DAMAGE_COLOR = '#8b1e1e';
const HEAL_COLOR = '#2e6b34';

export interface HpOutcome {
  title: string;
  message: string;
}

export interface HpApplyResult {
  current: string;
  temporary: string;
}

interface ManageHpModalProps {
  visible: boolean;
  variant?: 'damage-heal' | 'temp-only';
  current: string;
  temporary?: string;
  max: string;
  onClose: () => void;
  onApply: (result: HpApplyResult, outcome: HpOutcome | null) => void;
}

export function ManageHpModal({
  visible,
  variant = 'damage-heal',
  current,
  temporary,
  max,
  onClose,
  onApply,
}: ManageHpModalProps) {
  const goldColor = useThemeColor({}, 'gold');
  const backgroundColor = useThemeColor({}, 'background');
  const maxHp = parseInt(max, 10) || 0;
  const originalCurrent = parseInt(current, 10) || 0;
  const originalTemp = Math.max(parseInt(temporary ?? '0', 10) || 0, 0);
  const startTotal = variant === 'temp-only' ? originalTemp : originalCurrent + originalTemp;

  const [preview, setPreview] = useState(String(startTotal));
  const [invalidMessage, setInvalidMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setPreview(String(startTotal));
    }
  }, [visible, startTotal]);

  function applyDelta(delta: number) {
    const currentValue = parseInt(preview, 10) || 0;
    setPreview(String(currentValue + delta));
  }

  function handleApply() {
    const rawValue = parseInt(preview, 10) || 0;

    if (variant === 'temp-only') {
      onApply({ current: String(originalCurrent), temporary: String(rawValue) }, null);
      return;
    }

    const ceiling = maxHp + originalTemp;
    if (maxHp > 0 && rawValue > ceiling) {
      setPreview(String(startTotal));
      setInvalidMessage(`Esse valor é inválido pois PV Máximo é ${maxHp}.`);
      return;
    }

    const netDelta = rawValue - startTotal;
    let outcome: HpOutcome | null = null;
    let newCurrent = originalCurrent;
    let newTemp = originalTemp;

    if (netDelta >= 0) {
      newCurrent = maxHp > 0 ? Math.min(originalCurrent + netDelta, maxHp) : originalCurrent + netDelta;
      newTemp = originalTemp;
    } else {
      const magnitude = -netDelta;
      newTemp = Math.max(originalTemp - magnitude, 0);
      const remaining = Math.max(magnitude - originalTemp, 0);

      if (remaining > 0) {
        const currentAfter = originalCurrent - remaining;
        if (currentAfter <= 0) {
          const overflow = -currentAfter;
          outcome =
            maxHp > 0 && overflow >= maxHp
              ? {
                  title: 'Morte por Dano Maciço',
                  message:
                    'O dano restante foi igual ou maior que o máximo de pontos de vida do personagem. Ele morreu instantaneamente.',
                }
              : {
                  title: 'Inconsciente',
                  message: 'Os pontos de vida chegaram a 0. O personagem está inconsciente.',
                };
          newCurrent = 0;
        } else {
          newCurrent = currentAfter;
        }
      } else {
        newCurrent = originalCurrent;
      }
    }

    onApply({ current: String(newCurrent), temporary: String(newTemp) }, outcome);
  }

  const title = variant === 'temp-only' ? 'Adicionar PV Temporário' : 'Aplicar Dano/Cura';
  const applyLabel = variant === 'temp-only' ? 'Atualizar PV Temporário' : 'Atualizar PV';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.cardWrapper}>
          <ThemedView style={[styles.card, { borderColor: goldColor }]}>
            {variant === 'damage-heal' ? (
              <>
                <ThemedText style={styles.disclaimer}>{MASSIVE_DAMAGE_DISCLAIMER_PT}</ThemedText>
                <ThemedText type="subtitle" style={[styles.title, { color: goldColor }]}>
                  {title}
                </ThemedText>
                <ThemedText style={styles.note}>O valor abaixo soma PV Atual + PV Temporário.</ThemedText>
                <ThemedText style={styles.note}>
                  PV Atual: {originalCurrent}
                  {'\n'}
                  PV Temp.: {originalTemp}
                </ThemedText>
              </>
            ) : (
              <ThemedText type="subtitle" style={[styles.title, { color: goldColor }]}>
                {title}
              </ThemedText>
            )}

            <View style={styles.row}>
              {variant === 'damage-heal' ? (
                <View style={styles.column}>
                  {DAMAGE_PRESETS.map((delta) => (
                    <Pressable
                      key={delta}
                      onPress={() => applyDelta(delta)}
                      style={[styles.presetButton, { borderColor: DAMAGE_COLOR }]}
                    >
                      <ThemedText style={[styles.presetLabel, { color: DAMAGE_COLOR }]}>{delta}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {variant === 'damage-heal' ? (
                <TextInput
                  value={preview}
                  onChangeText={setPreview}
                  keyboardType="numbers-and-punctuation"
                  style={[styles.previewBox, { borderColor: goldColor, color: goldColor }]}
                />
              ) : (
                <View style={[styles.previewBox, styles.previewBoxStatic, { borderColor: goldColor }]}>
                  <ThemedText style={[styles.previewText, { color: goldColor }]}>{preview}</ThemedText>
                </View>
              )}

              <View style={styles.column}>
                {HEAL_PRESETS.map((delta) => (
                  <Pressable
                    key={delta}
                    onPress={() => applyDelta(delta)}
                    style={[styles.presetButton, { borderColor: HEAL_COLOR }]}
                  >
                    <ThemedText style={[styles.presetLabel, { color: HEAL_COLOR }]}>+{delta}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable onPress={handleApply} style={[styles.applyButton, { backgroundColor: goldColor }]}>
              <ThemedText style={{ color: backgroundColor }}>{applyLabel}</ThemedText>
            </Pressable>

            <Pressable onPress={onClose} style={[styles.closeButton, { borderColor: goldColor }]}>
              <ThemedText style={{ color: goldColor }}>Fechar</ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Pressable>

      <MessageModal
        visible={invalidMessage !== null}
        title="Valor Inválido"
        message={invalidMessage ?? undefined}
        onClose={() => setInvalidMessage(null)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  disclaimer: {
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.6,
    textAlign: 'center',
  },
  note: {
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.6,
    marginTop: 6,
    textAlign: 'center',
  },
  title: {
    marginTop: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  column: {
    gap: 8,
  },
  presetButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 52,
    alignItems: 'center',
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewBox: {
    width: 84,
    height: 72,
    borderWidth: 2,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  previewBoxStatic: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  applyButton: {
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 18,
  },
  closeButton: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 10,
  },
});
