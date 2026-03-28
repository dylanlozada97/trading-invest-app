import { ScrollView, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useInvestment } from '@/lib/investment-context';
import * as Haptics from 'expo-haptics';

const INVESTMENT_GAIN_PERCENTAGE = 0.60;

export default function InvestScreen() {
  const router = useRouter();
  const { balance, addInvestment } = useInvestment();
  const [amount, setAmount] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const investmentAmount = parseFloat(amount) || 0;
  const expectedGain = investmentAmount * INVESTMENT_GAIN_PERCENTAGE;
  const totalReturn = investmentAmount + expectedGain;

  const isValid = investmentAmount > 0 && investmentAmount <= balance && termsAccepted;

  const handleInvest = async () => {
    if (!isValid) return;

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      addInvestment(investmentAmount);

      Alert.alert(
        '¡Inversión Realizada!',
        `Se invirtieron $${investmentAmount.toFixed(2)}\n\nGanancias esperadas: $${expectedGain.toFixed(2)}\nRetorno total: $${totalReturn.toFixed(2)}\n\nTiempo: 15 días`,
        [
          {
            text: 'Ir al Inicio',
            onPress: () => {
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al realizar la inversión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-primary px-6 pt-6 pb-8">
          <Pressable
            onPress={() => router.back()}
            className="mb-4"
          >
            <Text className="text-white text-base">← Atrás</Text>
          </Pressable>
          <Text className="text-3xl font-bold text-white mb-2">Invertir en China</Text>
          <Text className="text-white/80">Obtén 60% de ganancias en 15 días con productos de China</Text>
        </View>

        {/* Contenido */}
        <View className="px-6 py-6 flex-1">
          {/* Información de saldo */}
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <Text className="text-sm text-muted mb-1">Saldo Disponible</Text>
            <Text className="text-2xl font-bold text-foreground">
              ${balance.toFixed(2)}
            </Text>
          </View>

          {/* Input de monto */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Monto a Invertir
            </Text>
            <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 py-3">
              <Text className="text-xl font-semibold text-foreground mr-2">$</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#9BA1A6"
                keyboardType="decimal-pad"
                className="flex-1 text-lg font-semibold text-foreground"
                editable={!loading}
              />
            </View>
            {investmentAmount > balance && (
              <Text className="text-xs text-error mt-2">
                Monto mayor al saldo disponible
              </Text>
            )}
          </View>

          {/* Resumen de inversión */}
          {investmentAmount > 0 && (
            <View className="bg-success/10 rounded-xl p-4 mb-6 border border-success/30">
              <View className="flex-row justify-between mb-3">
                <Text className="text-sm text-muted">Monto Invertido</Text>
                <Text className="text-sm font-semibold text-foreground">
                  ${investmentAmount.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-3 pb-3 border-b border-success/20">
                <Text className="text-sm text-muted">Ganancias Esperadas (60%)</Text>
                <Text className="text-sm font-semibold text-success">
                  +${expectedGain.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm font-semibold text-foreground">Retorno Total</Text>
                <Text className="text-lg font-bold text-success">
                  ${totalReturn.toFixed(2)}
                </Text>
              </View>
              <Text className="text-xs text-muted mt-3">
                Plazo: 15 días
              </Text>
            </View>
          )}

          {/* Información del plan */}
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-3">Plan de Inversión</Text>
            <View className="space-y-2">
              <View className="flex-row items-start">
                <Text className="text-success font-bold mr-2">✓</Text>
                <Text className="text-sm text-muted flex-1">
                  Retorno garantizado del 60% en 15 días
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-success font-bold mr-2">✓</Text>
                <Text className="text-sm text-muted flex-1">
                  Acceso a tu capital + ganancias después del período
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-success font-bold mr-2">✓</Text>
                <Text className="text-sm text-muted flex-1">
                  Seguimiento en tiempo real de tu inversión
                </Text>
              </View>
            </View>
          </View>

          {/* Términos y condiciones */}
          <Pressable
            onPress={() => setTermsAccepted(!termsAccepted)}
            className="flex-row items-center mb-6"
            disabled={loading}
          >
            <View
              className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                termsAccepted ? 'bg-primary border-primary' : 'border-border'
              }`}
            >
              {termsAccepted && <Text className="text-white text-xs font-bold">✓</Text>}
            </View>
            <Text className="text-sm text-muted flex-1">
              Acepto los términos y condiciones de inversión
            </Text>
          </Pressable>

          {/* Botón de inversión */}
          <Pressable
            onPress={handleInvest}
            disabled={!isValid || loading}
            style={({ pressed }) => [
              { opacity: pressed && isValid ? 0.9 : isValid ? 1 : 0.5 },
            ]}
            className="bg-primary rounded-xl py-4 mb-4"
          >
            <Text className="text-center text-white font-semibold text-base">
              {loading ? 'Procesando...' : 'Confirmar Inversión'}
            </Text>
          </Pressable>

          {/* Botón cancelar */}
          <Pressable
            onPress={() => router.back()}
            disabled={loading}
            className="bg-surface border border-border rounded-xl py-3"
          >
            <Text className="text-center text-foreground font-semibold">Cancelar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
