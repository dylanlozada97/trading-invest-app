import { ScrollView, Text, View, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isValid = username.trim().length > 0 && password.length >= 6;

  const handleLogin = async () => {
    if (!isValid) return;

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await login(username, password);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-gradient-to-b from-red-600 to-red-700">
        {/* Header */}
        <View className="px-6 pt-12 pb-8">
          <Text className="text-5xl font-bold text-white mb-2">🇨🇳</Text>
          <Text className="text-4xl font-bold text-white mb-2">Inversiones China</Text>
          <Text className="text-white/80">Inicia sesión en tu cuenta</Text>
        </View>

        {/* Formulario */}
        <View className="px-6 py-8 flex-1">
          {/* Usuario */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-white mb-2">Usuario</Text>
            <View className="bg-white/20 border border-white/30 rounded-xl px-4 py-3">
              <TextInput
                placeholder="Ingresa tu usuario"
                placeholderTextColor="#ffffff80"
                value={username}
                onChangeText={setUsername}
                editable={!loading}
                className="text-white text-base"
              />
            </View>
          </View>

          {/* Contraseña */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-white mb-2">Contraseña</Text>
            <View className="bg-white/20 border border-white/30 rounded-xl px-4 py-3 flex-row items-center">
              <TextInput
                placeholder="Ingresa tu contraseña"
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

          {/* Botón de login */}
          <Pressable
            onPress={handleLogin}
            disabled={!isValid || loading}
            className={`rounded-xl py-4 mb-4 ${
              isValid && !loading ? 'bg-yellow-400' : 'bg-yellow-400/50'
            }`}
          >
            <Text className={`text-center font-bold text-lg ${isValid && !loading ? 'text-red-700' : 'text-red-700/50'}`}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Text>
          </Pressable>

          {/* Enlace a registro */}
          <View className="flex-row justify-center items-center">
            <Text className="text-white/80">¿No tienes cuenta? </Text>
            <Pressable onPress={() => router.push('/auth/register')}>
              <Text className="text-yellow-400 font-bold">Regístrate aquí</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
