import { ScrollView, Text, View, Pressable, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useReferral } from '@/lib/referral-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export default function ReferralsScreen() {
  const router = useRouter();
  const { userReferralInfo, levels, generateReferralCode, getReferralsByUserId } = useReferral();
  const [referralCode, setReferralCode] = useState<string>('');
  const [userLevel, setUserLevel] = useState<any>(null);

  useEffect(() => {
    // Generar código de referido si no existe
    if (!userReferralInfo?.referralCode) {
      const code = generateReferralCode('user123'); // En producción, usar el ID real del usuario
      setReferralCode(code);
    } else {
      setReferralCode(userReferralInfo.referralCode);
    }

    // Obtener nivel actual
    if (userReferralInfo) {
      const currentLevel = levels.find((l) => l.level === userReferralInfo.level);
      setUserLevel(currentLevel);
    }
  }, [userReferralInfo]);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Código copiado', `Tu código ${referralCode} ha sido copiado al portapapeles`);
  };

  const handleShareCode = async () => {
    try {
      const message = `¡Únete a Trading Invest App! Usa mi código de referido: ${referralCode} y obtén comisiones en cada inversión. ¡Gana hasta 30% de comisión!`;
      await Share.share({
        message,
        title: 'Comparte mi código de referido',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const referrals = userReferralInfo ? getReferralsByUserId(userReferralInfo.userId) : [];
  const activeReferrals = referrals.filter((r) => r.status === 'active').length;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-primary px-6 pt-6 pb-8">
          <Text className="text-3xl font-bold text-white mb-2">Referidos</Text>
          <Text className="text-white/80">Gana comisiones compartiendo tu código</Text>
        </View>

        {/* Contenido */}
        <View className="px-6 py-6 flex-1">
          {/* Código de referido */}
          <View className="bg-surface rounded-xl p-6 mb-6 border border-border">
            <Text className="text-sm font-semibold text-muted mb-3">Tu Código de Referido</Text>
            <View className="bg-primary/10 rounded-lg p-4 mb-4 border border-primary/30">
              <Text className="text-2xl font-bold text-primary text-center font-mono">
                {referralCode}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleCopyCode}
                className="flex-1 bg-primary rounded-lg py-3"
              >
                <Text className="text-center text-white font-semibold">📋 Copiar</Text>
              </Pressable>
              <Pressable
                onPress={handleShareCode}
                className="flex-1 bg-primary/80 rounded-lg py-3"
              >
                <Text className="text-center text-white font-semibold">📤 Compartir</Text>
              </Pressable>
            </View>
          </View>

          {/* Nivel actual */}
          {userLevel && (
            <View className="bg-surface rounded-xl p-6 mb-6 border border-border">
              <Text className="text-sm font-semibold text-muted mb-3">Tu Nivel Actual</Text>
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-3xl font-bold text-primary">{userLevel.name}</Text>
                  <Text className="text-sm text-muted mt-1">Nivel {userLevel.level}</Text>
                </View>
                <View className="bg-primary/10 rounded-full w-16 h-16 items-center justify-center">
                  <Text className="text-2xl">⭐</Text>
                </View>
              </View>
              <View className="bg-success/10 rounded-lg p-3 border border-success/30">
                <Text className="text-sm font-semibold text-success">
                  Comisión: {userLevel.commissionPercentage}%
                </Text>
                <Text className="text-xs text-success/80 mt-1">
                  {userLevel.description}
                </Text>
              </View>
            </View>
          )}

          {/* Estadísticas */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">Tus Estadísticas</Text>
            <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-muted mb-1">Total de Referidos</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {userReferralInfo?.totalReferrals || 0}
                  </Text>
                </View>
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="text-lg">👥</Text>
                </View>
              </View>
            </View>

            <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-muted mb-1">Referidos Activos</Text>
                  <Text className="text-2xl font-bold text-success">{activeReferrals}</Text>
                </View>
                <View className="w-12 h-12 rounded-full bg-success/10 items-center justify-center">
                  <Text className="text-lg">✓</Text>
                </View>
              </View>
            </View>

            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-muted mb-1">Ganancias por Referidos</Text>
                  <Text className="text-2xl font-bold text-primary">
                    ${(userReferralInfo?.totalEarningsFromReferrals || 0).toFixed(2)}
                  </Text>
                </View>
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="text-lg">💰</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Próximos niveles */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">Próximos Niveles</Text>
            {levels.map((level) => {
              const isCurrentLevel = userReferralInfo?.level === level.level;
              const isUnlocked = (userReferralInfo?.totalReferrals || 0) >= level.minReferrals;

              return (
                <View
                  key={level.level}
                  className={`rounded-xl p-4 mb-3 border ${
                    isCurrentLevel
                      ? 'bg-primary/10 border-primary'
                      : isUnlocked
                        ? 'bg-success/10 border-success'
                        : 'bg-surface border-border'
                  }`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text
                        className={`text-lg font-bold ${
                          isCurrentLevel
                            ? 'text-primary'
                            : isUnlocked
                              ? 'text-success'
                              : 'text-foreground'
                        }`}
                      >
                        {level.name}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        {level.minReferrals} referidos requeridos
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text
                        className={`text-lg font-bold ${
                          isCurrentLevel
                            ? 'text-primary'
                            : isUnlocked
                              ? 'text-success'
                              : 'text-muted'
                        }`}
                      >
                        {level.commissionPercentage}%
                      </Text>
                      {isCurrentLevel && (
                        <Text className="text-xs text-primary font-semibold mt-1">
                          Actual
                        </Text>
                      )}
                      {isUnlocked && !isCurrentLevel && (
                        <Text className="text-xs text-success font-semibold mt-1">
                          Desbloqueado
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Información */}
          <View className="bg-info/10 rounded-xl p-4 border border-info/30 mb-6">
            <Text className="text-xs font-semibold text-info mb-2">ℹ️ Cómo Funciona</Text>
            <Text className="text-xs text-muted leading-relaxed">
              1. Comparte tu código de referido{'\n'}
              2. Cuando alguien se registre con tu código, se convierte en tu referido{'\n'}
              3. Ganas comisión en cada inversión que realice{'\n'}
              4. Sube de nivel con más referidos y gana más comisión
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
