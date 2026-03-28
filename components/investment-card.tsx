import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/utils';
import { Investment } from '@/types/investment';

interface InvestmentCardProps {
  investment: Investment;
  onPress?: () => void;
}

export function InvestmentCard({ investment, onPress }: InvestmentCardProps) {
  const progressPercentage = Math.min(100, ((15 - investment.daysRemaining) / 15) * 100);
  const isCompleted = investment.status === 'completed';
  const isClaimed = investment.status === 'claimed';

  const statusColor = isClaimed ? 'bg-success' : isCompleted ? 'bg-warning' : 'bg-primary';
  const statusText = isClaimed ? 'Reclamado' : isCompleted ? 'Completado' : 'Activo';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className="mb-4"
    >
      <View className="bg-surface rounded-2xl p-4 border border-border">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">
              ${investment.amount.toFixed(2)}
            </Text>
            <Text className="text-sm text-muted mt-1">
              Invertido
            </Text>
          </View>
          <View className={cn('px-3 py-1 rounded-full', statusColor)}>
            <Text className="text-xs font-semibold text-white">
              {statusText}
            </Text>
          </View>
        </View>

        {/* Ganancias */}
        <View className="mb-3 pb-3 border-b border-border">
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Ganancias Esperadas</Text>
            <Text className="text-sm font-semibold text-success">
              +${investment.expectedGain.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between mt-1">
            <Text className="text-sm text-muted">Ganancias Actuales</Text>
            <Text className="text-sm font-semibold text-primary">
              +${investment.currentGain.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Progreso */}
        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs text-muted">Progreso</Text>
            <Text className="text-xs font-semibold text-foreground">
              {15 - investment.daysRemaining}/15 días
            </Text>
          </View>
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </View>
        </View>

        {/* Fecha */}
        <Text className="text-xs text-muted">
          Finaliza en {investment.daysRemaining} día{investment.daysRemaining !== 1 ? 's' : ''}
        </Text>
      </View>
    </Pressable>
  );
}
