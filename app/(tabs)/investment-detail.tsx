import { ScrollView, Text, View, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useInvestment } from '@/lib/investment-context';
import * as Haptics from 'expo-haptics';

export default function InvestmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { investments, claimGains } = useInvestment();
  const [claiming, setClaiming] = useState(false);

  const investment = useMemo(
    () => investments.find((inv) => inv.id === id),
    [investments, id]
  );

  if (!investment) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg font-semibold text-foreground">
            Inversión no encontrada
          </Text>
          <Pressable onPress={() => router.back()} className="mt-6">
            <Text className="text-primary font-semibold">Volver</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const investmentDate = new Date(investment.investmentDate);
  const completionDate = new Date(investment.completionDate);
  const isCompleted = investment.status === 'completed';
  const isClaimed = investment.status === 'claimed';

  const handleClaimGains = () => {
    if (!isCompleted) return;

    Alert.alert(
      'Reclamar Ganancias',
      `¿Deseas reclamar $${investment.expectedGain.toFixed(2)} en ganancias?\n\nTambién recuperarás tu inversión de $${investment.amount.toFixed(2)}`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Reclamar',
          style: 'default',
          onPress: async () => {
            setClaiming(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            claimGains(investment.id);
            setTimeout(() => {
              setClaiming(false);
              Alert.alert(
                '¡Éxito!',
                `Se han acreditado $${(investment.amount + investment.expectedGain).toFixed(2)} a tu saldo`,
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
            }, 500);
          },
        },
      ]
    );
  };

  const progressPercentage = Math.min(100, ((15 - investment.daysRemaining) / 15) * 100);
  const statusColor = isClaimed ? 'bg-success' : isCompleted ? 'bg-warning' : 'bg-primary';
  const statusText = isClaimed ? 'Reclamado' : isCompleted ? 'Completado' : 'Activo';

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-primary px-6 pt-6 pb-8">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-white text-base">← Atrás</Text>
          </Pressable>
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-white/80 text-sm mb-2">Monto Invertido</Text>
              <Text className="text-4xl font-bold text-white">
                ${investment.amount.toFixed(2)}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${statusColor}`}>
              <Text className="text-xs font-semibold text-white">{statusText}</Text>
            </View>
          </View>
        </View>

        {/* Contenido */}
        <View className="px-6 py-6 flex-1">
          {/* Ganancias */}
          <View className="bg-success/10 rounded-xl p-4 mb-6 border border-success/30">
            <View className="flex-row justify-between mb-3">
              <Text className="text-sm text-muted">Ganancias Esperadas</Text>
              <Text className="text-sm font-semibold text-success">
                +${investment.expectedGain.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between pb-3 border-b border-success/20">
              <Text className="text-sm text-muted">Ganancias Actuales</Text>
              <Text className="text-sm font-semibold text-primary">
                +${investment.currentGain.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between pt-3">
              <Text className="text-sm font-semibold text-foreground">Retorno Total</Text>
              <Text className="text-lg font-bold text-success">
                ${(investment.amount + investment.expectedGain).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Progreso */}
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-semibold text-foreground">Progreso</Text>
              <Text className="text-sm font-semibold text-primary">
                {15 - investment.daysRemaining}/15 días
              </Text>
            </View>
            <View className="h-3 bg-border rounded-full overflow-hidden mb-3">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </View>
            <Text className="text-xs text-muted">
              {investment.daysRemaining === 0
                ? 'Inversión completada'
                : `Falta ${investment.daysRemaining} día${investment.daysRemaining !== 1 ? 's' : ''}`}
            </Text>
          </View>

          {/* Fechas */}
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <View className="flex-row justify-between mb-3">
              <Text className="text-sm text-muted">Fecha de Inicio</Text>
              <Text className="text-sm font-semibold text-foreground">
                {investmentDate.toLocaleDateString('es-ES')}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Fecha de Finalización</Text>
              <Text className="text-sm font-semibold text-foreground">
                {completionDate.toLocaleDateString('es-ES')}
              </Text>
            </View>
          </View>

          {/* Información */}
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-3">
              Información de la Inversión
            </Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">ID de Inversión</Text>
                <Text className="text-xs font-mono text-foreground">
                  {investment.id.slice(0, 8)}...
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Porcentaje de Ganancia</Text>
                <Text className="text-sm font-semibold text-success">60%</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Plazo</Text>
                <Text className="text-sm font-semibold text-foreground">15 días</Text>
              </View>
            </View>
          </View>

          {/* Botón de reclamar */}
          {isCompleted && !isClaimed && (
            <Pressable
              onPress={handleClaimGains}
              disabled={claiming}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              className="bg-success rounded-xl py-4 mb-4"
            >
              <Text className="text-center text-white font-semibold text-base">
                {claiming ? 'Procesando...' : 'Reclamar Ganancias'}
              </Text>
            </Pressable>
          )}

          {isClaimed && (
            <View className="bg-success/10 rounded-xl py-4 mb-4 border border-success/30">
              <Text className="text-center text-success font-semibold">
                ✓ Ganancias Reclamadas
              </Text>
            </View>
          )}

          {/* Botón volver */}
          <Pressable
            onPress={() => router.back()}
            className="bg-surface border border-border rounded-xl py-3"
          >
            <Text className="text-center text-foreground font-semibold">Volver</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
