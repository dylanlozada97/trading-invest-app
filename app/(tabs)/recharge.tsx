import { ScrollView, Text, View, Pressable, TextInput, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '@/components/screen-container';
import { useRecharge } from '@/lib/recharge-context';
import { useInvestment } from '@/lib/investment-context';
import * as Haptics from 'expo-haptics';

export default function RechargeScreen() {
  const router = useRouter();
  const { bankAccount, addRecharge } = useRecharge();
  const { balance } = useInvestment();
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rechargeAmount = parseFloat(amount) || 0;
  const isValid = rechargeAmount > 0 && photoUri !== null && reference.trim().length > 0;

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo acceder a la cámara');
    }
  };

  const handleGalleryImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo acceder a la galería');
    }
  };

  const handleRecharge = async () => {
    if (!isValid) return;

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      addRecharge(rechargeAmount, reference, photoUri!);

      Alert.alert(
        '¡Recarga Enviada!',
        `Se ha enviado tu solicitud de recarga por $${rechargeAmount.toFixed(2)}\n\nReferencia: ${reference}\n\nEsperamos validar tu consignación en las próximas 24 horas.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setAmount('');
              setReference('');
              setPhotoUri(null);
              router.push('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Error al procesar la recarga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-primary px-6 pt-6 pb-8">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-white text-base">← Atrás</Text>
          </Pressable>
          <Text className="text-3xl font-bold text-white mb-2">Recargar Saldo</Text>
          <Text className="text-white/80">Consignación Bancaria</Text>
        </View>

        {/* Contenido */}
        <View className="px-6 py-6 flex-1">
          {/* Datos bancarios */}
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-3">
              Datos para Consignación
            </Text>
            <View className="space-y-3">
              <View>
                <Text className="text-xs text-muted mb-1">Banco</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {bankAccount.bankName}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Titular</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {bankAccount.accountHolder}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Número de Cuenta</Text>
                <Text className="text-sm font-semibold font-mono text-primary">
                  {bankAccount.accountNumber}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Tipo de Cuenta</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {bankAccount.accountType}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">NIT</Text>
                <Text className="text-sm font-semibold font-mono text-foreground">
                  {bankAccount.documentNumber}
                </Text>
              </View>
            </View>
          </View>

          {/* Monto */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Monto a Recargar
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
          </View>

          {/* Referencia */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Referencia (Concepto)
            </Text>
            <TextInput
              value={reference}
              onChangeText={setReference}
              placeholder="Ej: Recarga Trading Invest"
              placeholderTextColor="#9BA1A6"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              editable={!loading}
            />
          </View>

          {/* Foto de consignación */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-3">
              Foto de Consignación
            </Text>

            {photoUri ? (
              <View className="mb-4">
                <Image
                  source={{ uri: photoUri }}
                  className="w-full h-48 rounded-xl bg-surface border border-border"
                />
                <Pressable
                  onPress={() => setPhotoUri(null)}
                  className="mt-2 bg-error/10 border border-error rounded-lg py-2"
                >
                  <Text className="text-center text-error text-sm font-semibold">
                    Cambiar Foto
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="bg-surface border-2 border-dashed border-border rounded-xl p-6 mb-3">
                <Text className="text-center text-muted text-sm mb-4">
                  Toma una foto de tu consignación
                </Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={handlePickImage}
                    disabled={loading}
                    className="flex-1 bg-primary rounded-lg py-3"
                  >
                    <Text className="text-center text-white font-semibold">
                      📷 Cámara
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleGalleryImage}
                    disabled={loading}
                    className="flex-1 bg-primary/80 rounded-lg py-3"
                  >
                    <Text className="text-center text-white font-semibold">
                      🖼️ Galería
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Información */}
          <View className="bg-success/10 rounded-xl p-4 mb-6 border border-success/30">
            <Text className="text-xs font-semibold text-success mb-2">
              ℹ️ Información Importante
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              1. Realiza la consignación a la cuenta bancaria indicada{'\n'}
              2. Toma una foto clara del comprobante de consignación{'\n'}
              3. Incluye una referencia en el concepto{'\n'}
              4. Validaremos tu recarga en máximo 24 horas{'\n'}
              5. El saldo se acreditará automáticamente
            </Text>
          </View>

          {/* Botón de recarga */}
          <Pressable
            onPress={handleRecharge}
            disabled={!isValid || loading}
            style={({ pressed }) => [
              { opacity: pressed && isValid ? 0.9 : isValid ? 1 : 0.5 },
            ]}
            className="bg-primary rounded-xl py-4 mb-4"
          >
            <Text className="text-center text-white font-semibold text-base">
              {loading ? 'Procesando...' : 'Enviar Recarga'}
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
