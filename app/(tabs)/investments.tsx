import { ScrollView, Text, View, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { InvestmentCard } from '@/components/investment-card';
import { useInvestment } from '@/lib/investment-context';

type FilterType = 'all' | 'active' | 'completed';

export default function InvestmentsScreen() {
  const router = useRouter();
  const { investments } = useInvestment();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredInvestments = investments.filter((inv) => {
    if (filter === 'all') return true;
    if (filter === 'active') return inv.status === 'active';
    if (filter === 'completed') return inv.status === 'completed' || inv.status === 'claimed';
    return true;
  });

  const handleInvestmentPress = (investmentId: string) => {
    router.push({
      pathname: '/(tabs)/investment-detail',
      params: { id: investmentId },
    });
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-primary px-6 pt-6 pb-8">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-white text-base">← Atrás</Text>
          </Pressable>
          <Text className="text-3xl font-bold text-white mb-2">Mis Inversiones</Text>
          <Text className="text-white/80">Total: {investments.length} inversiones</Text>
        </View>

        {/* Filtros */}
        <View className="px-6 py-4 flex-row gap-2">
          {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`px-4 py-2 rounded-full ${
                filter === f ? 'bg-primary' : 'bg-surface border border-border'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  filter === f ? 'text-white' : 'text-foreground'
                }`}
              >
                {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Completadas'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Lista de inversiones */}
        <View className="px-6 py-4 flex-1">
          {filteredInvestments.length > 0 ? (
            <FlatList
              data={filteredInvestments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <InvestmentCard
                  investment={item}
                  onPress={() => handleInvestmentPress(item.id)}
                />
              )}
              scrollEnabled={false}
            />
          ) : (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-lg font-semibold text-foreground mb-2">
                Sin inversiones
              </Text>
              <Text className="text-sm text-muted text-center">
                {filter === 'active'
                  ? 'No tienes inversiones activas'
                  : filter === 'completed'
                  ? 'No tienes inversiones completadas'
                  : 'Comienza a invertir ahora'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
