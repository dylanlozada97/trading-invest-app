import { ScrollView, Text, View, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useWithdrawal } from '@/lib/withdrawal-context';
import { useInvestment } from '@/lib/investment-context';
import { useAuth } from '@/lib/auth-context';
import * as Haptics from 'expo-haptics';

export default function WithdrawScreen() {
  const router = useRouter();
  const { balance } = useInvestment();
  const { user } = useAuth();
  const { requestWithdrawal, canWithdrawNow, getLastWithdrawalDate, getNextWithdrawalDate, getWithdrawalsByUserId } = useWithdrawal();
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [canWithdrawNow_state, setCanWithdrawNow] = useState(true);
  const [nextDate, setNextDate] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setCanWithdrawNow(canWithdrawNow(user.id));
      setNextDate(getNextWithdrawalDate(user.id));
    }
  }, [user]);

  const withdrawAmount = parseFloat(amount) || 0;
  const isValid = withdrawAmount > 0 && withdrawAmount <= balance && bankAccount.trim().length > 0 && canWithdrawNow_state;

  const handleWithdraw = async () => {
    if (!isValid || !user) return;

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await requestWithdrawal(user.id, withdrawAmount, bankAccount);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '¡Retiro Solicitado!',
        `Se ha solicitado un retiro de $${withdrawAmount.toFixed(2)}\n\nPróximo retiro disponible en 15 días`,
        [
          {
            text: 'OK',
            onPress: () => {
              setAmount('');
              setBankAccount('');
              router.push('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al procesar el retiro');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const userWithdrawals = user ? getWithdrawalsByUserId(user.id) : [];
  const lastWithdrawal = userWithdrawals.length > 0 ? userWithdrawals[userWithdrawals.length - 1] : null;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-gradient-to-b from-yellow-500 to-yellow-600 px-6 pt-6 pb-8">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-white text-base">← Atrás</Text>
          </Pressable>
          <Text className="text-3xl font-bold text-white mb-2">Retirar Dinero</Text>
          <Text className="text-white/80">Retira tus ganancias cada 15 días</Text>
        </View>

        {/* Contenido */}
        <View className="px-6 py-6 flex-1">
          {/* Saldo disponible */}
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <Text className="text-sm text-muted mb-1">Saldo Disponible</Text>
            <Text className="text-3xl font-bold text-foreground">
              ${balance.toFixed(2)}
            </Text>
          </View>

          {/* Estado de retiro */}
          {!canWithdrawNow_state && nextDate && (
            <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <Text className="text-sm font-semibold text-red-700 mb-1">⏳ Próximo retiro disponible</Text>
              <Text className="text-base font-bold text-red-700">
                {formatDate(nextDate)}
              </Text>
              <Text className="text-xs text-red-600 mt-2">
                Solo puedes retirar cada 15 días
              </Text>
            </View>
          )}

          {canWithdrawNow_state && (
            <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <Text className="text-sm font-semibold text-green-700">✓ Retiro disponible</Text>
              <Text className="text-xs text-green-600 mt-1">Puedes retirar ahora</Text>
            </View>
          )}

          {/* Monto */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Monto a Retirar</Text>
            <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 py-3">
              <Text className="text-xl font-semibold text-foreground mr-2">$</Text>
              <TextInput
                placeholder="0.00"
                placeholderTextColor="#999"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                editable={!loading && canWithdrawNow_state}
                className="flex-1 text-foreground text-base"
              />
            </View>
            {withdrawAmount > balance && (
              <Text className="text-xs text-red-600 mt-1">Saldo insuficiente</Text>
            )}
          </View>

          {/* Cuenta bancaria */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Número de Cuenta Bancaria</Text>
            <View className="bg-surface border border-border rounded-xl px-4 py-3">
              <TextInput
                placeholder="Ej: 12345678901234567890"
                placeholderTextColor="#999"
                value={bankAccount}
                onChangeText={setBankAccount}
                editable={!loading && canWithdrawNow_state}
                className="text-foreground text-base"
              />
            </View>
          </View>

          {/* Botón de retiro */}
          <Pressable
            onPress={handleWithdraw}
            disabled={!isValid || loading}
            className={`rounded-xl py-4 mb-4 ${
              isValid && !loading ? 'bg-yellow-500' : 'bg-yellow-500/50'
            }`}
          >
            <Text className={`text-center font-bold text-lg ${isValid && !loading ? 'text-white' : 'text-white/50'}`}>
              {loading ? 'Procesando...' : 'Solicitar Retiro'}
            </Text>
          </Pressable>

          {/* Historial de retiros */}
          {userWithdrawals.length > 0 && (
            <View className="mt-8">
              <Text className="text-lg font-bold text-foreground mb-4">Historial de Retiros</Text>
              {userWithdrawals.slice().reverse().map((withdrawal) => (
                <View key={withdrawal.id} className="bg-surface rounded-xl p-4 mb-3 border border-border">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-sm font-semibold text-foreground">
                      ${withdrawal.amount.toFixed(2)}
                    </Text>
                    <View className={`px-2 py-1 rounded-full ${
                      withdrawal.status === 'completed'
                        ? 'bg-green-100'
                        : withdrawal.status === 'pending'
                          ? 'bg-yellow-100'
                          : 'bg-red-100'
                    }`}>
                      <Text className={`text-xs font-semibold ${
                        withdrawal.status === 'completed'
                          ? 'text-green-700'
                          : withdrawal.status === 'pending'
                            ? 'text-yellow-700'
                            : 'text-red-700'
                      }`}>
                        {withdrawal.status === 'completed'
                          ? 'Completado'
                          : withdrawal.status === 'pending'
                            ? 'Pendiente'
                            : 'Rechazado'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-muted">
                    {formatDate(withdrawal.requestedAt)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
