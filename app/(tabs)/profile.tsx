import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useInvestment } from '@/lib/investment-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const { balance, totalGains, investments } = useInvestment();

  const activeInvestments = investments.filter((inv) => inv.status === 'active').length;
  const completedInvestments = investments.filter((inv) => inv.status === 'completed' || inv.status === 'claimed').length;
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-primary px-6 pt-6 pb-8">
          <Text className="text-3xl font-bold text-white mb-2">Mi Perfil</Text>
          <Text className="text-white/80">Resumen de tu actividad</Text>
        </View>

        {/* Contenido */}
        <View className="px-6 py-6 flex-1">
          {/* Saldo */}
          <View className="bg-surface rounded-xl p-6 mb-6 border border-border">
            <Text className="text-sm text-muted mb-2">Saldo Disponible</Text>
            <Text className="text-4xl font-bold text-foreground mb-4">
              ${balance.toFixed(2)}
            </Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs text-muted mb-1">Ganancias Totales</Text>
                <Text className="text-2xl font-bold text-success">
                  +${totalGains.toFixed(2)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-muted mb-1">Total Invertido</Text>
                <Text className="text-2xl font-bold text-primary">
                  ${totalInvested.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Estadísticas */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">Estadísticas</Text>
            <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-muted mb-1">Inversiones Activas</Text>
                  <Text className="text-2xl font-bold text-primary">
                    {activeInvestments}
                  </Text>
                </View>
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="text-lg">📈</Text>
                </View>
              </View>
            </View>

            <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-muted mb-1">Inversiones Completadas</Text>
                  <Text className="text-2xl font-bold text-success">
                    {completedInvestments}
                  </Text>
                </View>
                <View className="w-12 h-12 rounded-full bg-success/10 items-center justify-center">
                  <Text className="text-lg">✓</Text>
                </View>
              </View>
            </View>

            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-muted mb-1">Total de Inversiones</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {investments.length}
                  </Text>
                </View>
                <View className="w-12 h-12 rounded-full bg-foreground/10 items-center justify-center">
                  <Text className="text-lg">💰</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Información */}
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-3">
              Información de Cuenta
            </Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Plan de Inversión</Text>
                <Text className="text-sm font-semibold text-success">60% en 15 días</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Moneda</Text>
                <Text className="text-sm font-semibold text-foreground">USD</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Estado</Text>
                <Text className="text-sm font-semibold text-success">Activo</Text>
              </View>
            </View>
          </View>

          {/* Botones de acción */}
          <Pressable
            onPress={() => router.push('/(tabs)/recharge')}
            className="bg-success rounded-xl py-3 mb-3"
          >
            <Text className="text-center text-white font-semibold">
              + Recargar Saldo
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)')}
            className="bg-primary rounded-xl py-3 mb-3"
          >
            <Text className="text-center text-white font-semibold">
              Ver Inversiones
            </Text>
          </Pressable>

          <Pressable
            onPress={handleLogout}
            className="bg-error/10 border border-error rounded-xl py-3"
          >
            <Text className="text-center text-error font-semibold">
              Cerrar Sesión
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
