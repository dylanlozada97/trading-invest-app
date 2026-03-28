import React, { useState } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export default function WelcomeScreen() {
  const { register, login, getCurrentUser } = useAuth();
  const colors = useColors();
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReferralCode, setShowReferralCode] = useState('');

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password, referralCode || undefined);
      const newUser = getCurrentUser();
      if (newUser) {
        setShowReferralCode(newUser.referralCode);
      }
      Alert.alert('¡Éxito!', `Tu código de referido es: ${newUser?.referralCode}\n\nComparte este código con tus amigos para ganar comisiones`);
      setUsername('');
      setEmail('');
      setPassword('');
      setReferralCode('');
      setIsLogin(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-gradient-to-b from-red-600 to-red-900">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 justify-center items-center px-6 py-8">
          {/* Logo Section */}
          <View className="mb-8">
            <Text className="text-5xl font-bold text-white text-center mb-2">🏮</Text>
            <Text className="text-3xl font-bold text-white text-center">Inversiones China</Text>
            <Text className="text-sm text-red-100 text-center mt-2">Gana 60% en 15 días</Text>
          </View>

          {/* Card */}
          <View className="w-full bg-white rounded-2xl shadow-lg p-6 mb-6">
            {showReferralCode ? (
              // Mostrar código de referido
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-800 mb-4">¡Bienvenido!</Text>
                <View className="bg-red-50 border-2 border-red-600 rounded-lg p-4 w-full mb-4">
                  <Text className="text-xs text-gray-600 text-center mb-2">Tu Código de Referido</Text>
                  <Text className="text-2xl font-bold text-red-600 text-center">{showReferralCode}</Text>
                </View>
                <Text className="text-sm text-gray-600 text-center mb-6">
                  Comparte este código con tus amigos. Cuando se registren, ganarás comisión de sus inversiones.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowReferralCode('');
                    setIsLogin(true);
                  }}
                  className="bg-red-600 w-full py-3 rounded-lg"
                >
                  <Text className="text-white font-semibold text-center">Continuar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Toggle */}
                <View className="flex-row bg-gray-100 rounded-lg p-1 mb-6">
                  <TouchableOpacity
                    onPress={() => setIsLogin(false)}
                    className={cn('flex-1 py-2 rounded', !isLogin ? 'bg-white shadow' : '')}
                  >
                    <Text className={cn('text-center font-semibold', !isLogin ? 'text-red-600' : 'text-gray-600')}>
                      Registrarse
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsLogin(true)}
                    className={cn('flex-1 py-2 rounded', isLogin ? 'bg-white shadow' : '')}
                  >
                    <Text className={cn('text-center font-semibold', isLogin ? 'text-red-600' : 'text-gray-600')}>
                      Iniciar Sesión
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Form */}
                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Usuario</Text>
                    <TextInput
                      placeholder="Ej: juan_123"
                      value={username}
                      onChangeText={setUsername}
                      className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                      editable={!loading}
                    />
                  </View>

                  {!isLogin && (
                    <View>
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</Text>
                      <TextInput
                        placeholder="tu@email.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                        editable={!loading}
                      />
                    </View>
                  )}

                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Contraseña</Text>
                    <TextInput
                      placeholder="••••••••"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                      editable={!loading}
                    />
                  </View>

                  {!isLogin && (
                    <View>
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Código de Referido (Opcional)</Text>
                      <TextInput
                        placeholder="Si alguien te invitó, pega su código"
                        value={referralCode}
                        onChangeText={setReferralCode}
                        className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                        editable={!loading}
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={isLogin ? handleLogin : handleRegister}
                    disabled={loading}
                    className={cn('py-3 rounded-lg', loading ? 'bg-gray-400' : 'bg-red-600')}
                  >
                    <Text className="text-white font-semibold text-center">
                      {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Info */}
          <View className="bg-white/10 rounded-lg p-4">
            <Text className="text-white text-xs text-center">
              🔒 Tus datos están seguros. Nunca compartimos información personal.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
