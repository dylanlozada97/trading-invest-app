import { ScrollView, Text, View, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { InvestmentCard } from '@/components/investment-card';
import { useInvestment } from '@/lib/investment-context';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const router = useRouter();
  const { balance, totalGains, investments, updateInvestments } = useInvestment();
  const [refreshing, setRefreshing] = useState(false);

  const activeInvestments = investments.filter((inv) => inv.status === 'active');
  const completedInvestments = investments.filter((inv) => inv.status === 'completed');

  const onRefresh = () => {
    setRefreshing(true);
    updateInvestments();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleInvestPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/invest');
  };

  const handleInvestmentPress = (investmentId: string) => {
    router.push({
      pathname: '/(tabs)/investment-detail',
      params: { id: investmentId },
    });
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header con saldo */}
        <View className="bg-gradient-to-b from-primary to-primary/80 px-6 pt-6 pb-8">
          <Text className="text-sm text-white/80 mb-2">Saldo Disponible</Text>
          <Text className="text-5xl font-bold text-white mb-6">
            ${balance.toFixed(2)}
          </Text>

          {/* Ganancias totales */}
          <View className="bg-white/20 rounded-xl p-4 mb-4">
            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs text-white/80 mb-1">Ganancias Totales</Text>
                <Text className="text-2xl font-bold text-white">
                  ${totalGains.toFixed(2)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-white/80 mb-1">Inversiones Activas</Text>
                <Text className="text-2xl font-bold text-white">
                  {activeInvestments.length}
                </Text>
              </View>
            </View>
          </View>

          {/* Botones de acción */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleInvestPress}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              className="flex-1 bg-white rounded-xl py-3 active:scale-95"
            >
              <Text className="text-center font-semibold text-primary text-base">
                Invertir
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/recharge')}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              className="flex-1 bg-white/20 border border-white rounded-xl py-3 active:scale-95"
            >
              <Text className="text-center font-semibold text-white text-base">
                Recargar
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Contenido principal */}
        <View className="px-6 py-6 flex-1">
          {/* Inversiones activas */}
          {activeInvestments.length > 0 && (
            <View className="mb-8">
              <Text className="text-lg font-bold text-foreground mb-4">
                Inversiones Activas
              </Text>
              {activeInvestments.slice(0, 3).map((investment) => (
                <InvestmentCard
                  key={investment.id}
                  investment={investment}
                  onPress={() => handleInvestmentPress(investment.id)}
                />
              ))}
              {activeInvestments.length > 3 && (
                <Pressable
                  onPress={() => router.push('/(tabs)/investments')}
                  className="py-3"
                >
                  <Text className="text-center text-primary font-semibold">
                    Ver todas ({activeInvestments.length})
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Inversiones completadas */}
          {completedInvestments.length > 0 && (
            <View className="mb-8">
              <Text className="text-lg font-bold text-foreground mb-4">
                Listas para Reclamar
              </Text>
              {completedInvestments.map((investment) => (
                <InvestmentCard
                  key={investment.id}
                  investment={investment}
                  onPress={() => handleInvestmentPress(investment.id)}
                />
              ))}
            </View>
          )}

          {/* Estado vacío */}
          {investments.length === 0 && (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-lg font-semibold text-foreground mb-2">
                Sin inversiones
              </Text>
              <Text className="text-sm text-muted text-center mb-6">
                Comienza a invertir en productos de China y obtén ganancias del 60% en 15 días
              </Text>
              <Pressable
                onPress={handleInvestPress}
                className="bg-primary px-8 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Crear Inversión</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
