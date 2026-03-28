import { ScrollView, Text, View, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import * as Haptics from 'expo-haptics';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isValid =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleRegister = async () => {
    if (!isValid) return;

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await register(username, email, password, referralCode || undefined);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Éxito!', 'Cuenta creada exitosamente', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-gradient-to-b from-red-600 to-red-700">
        {/* Header */}
        <View className="px-6 pt-8 pb-6">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-white text-base">← Atrás</Text>
          </Pressable>
          <Text className="text-4xl font-bold text-white mb-2">Crear Cuenta</Text>
          <Text className="text-white/80">Únete a Inversiones China</Text>
        </View>

        {/* Formulario */}
        <View className="px-6 py-6 flex-1">
          {/* Usuario */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-white mb-2">Usuario</Text>
            <View className="bg-white/20 border border-white/30 rounded-xl px-4 py-3">
              <TextInput
                placeholder="Elige un usuario"
                placeholderTextColor="#ffffff80"
                value={username}
                onChangeText={setUsername}
                editable={!loading}
                className="text-white text-base"
              />
            </View>
          </View>

          {/* Correo */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-white mb-2">Correo Electrónico</Text>
            <View className="bg-white/20 border border-white/30 rounded-xl px-4 py-3">
              <TextInput
                placeholder="tu@correo.com"
                placeholderTextColor="#ffffff80"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!loading}
                className="text-white text-base"
              />
            </View>
          </View>

          {/* Contraseña */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-white mb-2">Contraseña</Text>
            <View className="bg-white/20 border border-white/30 rounded-xl px-4 py-3 flex-row items-center">
              <TextInput
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#ffffff80"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                className="flex-1 text-white text-base"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} className="ml-2">
                <Text className="text-white text-lg">{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Confirmar Contraseña */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-white mb-2">Confirmar Contraseña</Text>
            <View className="bg-white/20 border border-white/30 rounded-xl px-4 py-3">
              <TextInput
                placeholder="Confirma tu contraseña"
                placeholderTextColor="#ffffff80"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                className="text-white text-base"
              />
            </View>
          </View>

          {/* Código de Referido (Opcional) */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-white mb-2">Código de Referido (Opcional)</Text>
            <View className="bg-white/20 border border-white/30 rounded-xl px-4 py-3">
              <TextInput
                placeholder="Si tienes un código de referido"
                placeholderTextColor="#ffffff80"
                value={referralCode}
                onChangeText={setReferralCode}
                editable={!loading}
                className="text-white text-base"
              />
            </View>
            <Text className="text-xs text-white/60 mt-1">
              Si alguien te invitó, ingresa su código para ganar comisiones
            </Text>
          </View>

          {/* Botón de registro */}
          <Pressable
            onPress={handleRegister}
            disabled={!isValid || loading}
            className={`rounded-xl py-4 mb-4 ${
              isValid && !loading ? 'bg-yellow-400' : 'bg-yellow-400/50'
            }`}
          >
            <Text className={`text-center font-bold text-lg ${isValid && !loading ? 'text-red-700' : 'text-red-700/50'}`}>
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </Text>
          </Pressable>

          {/* Enlace a login */}
          <View className="flex-row justify-center items-center">
            <Text className="text-white/80">¿Ya tienes cuenta? </Text>
            <Pressable onPress={() => router.back()}>
              <Text className="text-yellow-400 font-bold">Inicia sesión</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
