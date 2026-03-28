import { View, Text } from 'react-native';
import { Investment } from '@/types/investment';

const INVESTMENT_DURATION_DAYS = 15;

export function InvestmentProgress({ investment }: { investment: Investment }) {
  const progressPercentage = (investment.currentGain / investment.expectedGain) * 100;
  const progressWidth = `${Math.min(progressPercentage, 100)}%`;

  const daysElapsed = Math.floor(
    (Date.now() - new Date(investment.investmentDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const dailyGain = investment.expectedGain / INVESTMENT_DURATION_DAYS;

  return (
    <View className="mb-4">
      {/* Progreso en porcentaje */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-semibold text-foreground">
          Progreso: {Math.round(progressPercentage)}%
        </Text>
        <Text className="text-xs text-muted">
          Día {Math.min(daysElapsed + 1, INVESTMENT_DURATION_DAYS)}/{INVESTMENT_DURATION_DAYS}
        </Text>
      </View>

      {/* Barra de progreso */}
      <View className="bg-surface border border-border rounded-full h-2 overflow-hidden">
        <View
          className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full"
          style={{ width: `${Math.min(progressPercentage, 100)}%` } as any}
        />
      </View>

      {/* Información de ganancias diarias */}
      <View className="mt-3 bg-primary/10 rounded-lg p-3">
        <View className="flex-row justify-between mb-2">
          <Text className="text-xs text-muted">Ganancia diaria aproximada:</Text>
          <Text className="text-sm font-bold text-primary">
            ${dailyGain.toFixed(2)}/día
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-muted">Ganancia acumulada:</Text>
          <Text className="text-sm font-bold text-success">
            ${investment.currentGain.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
}
