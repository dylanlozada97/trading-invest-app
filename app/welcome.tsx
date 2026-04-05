import React, { useState } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const { register, login, getCurrentUser } = useAuth();
  const router = useRouter();
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
      setUsername('');
      setEmail('');
      setPassword('');
      setReferralCode('');
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
      // Navegar explícitamente a tabs después del login
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAfterRegister = () => {
    setShowReferralCode('');
    // Navegar explícitamente a tabs después del registro
    router.replace('/(tabs)');
  };

  // Pantalla de código de referido después del registro
  if (showReferralCode) {
    return (
      <ScreenContainer>
        <View style={styles.container}>
          <View style={styles.logoSection}>
            <Text style={styles.logoEmoji}>🏮</Text>
            <Text style={styles.logoTitle}>Inversiones China</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.welcomeTitle}>¡Registro Exitoso!</Text>

            <View style={styles.referralCodeBox}>
              <Text style={styles.referralCodeLabel}>Tu Código de Referido</Text>
              <Text style={styles.referralCodeValue}>{showReferralCode}</Text>
            </View>

            <Text style={styles.referralCodeInfo}>
              Comparte este código con tus amigos. Cuando se registren, ganarás comisión de sus inversiones.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinueAfterRegister}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Continuar a la Plataforma</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <Text style={styles.logoEmoji}>🏮</Text>
            <Text style={styles.logoTitle}>Inversiones China</Text>
            <Text style={styles.logoSubtitle}>Gana 60% en 15 días</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Toggle Registrarse / Iniciar Sesión */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
                onPress={() => setIsLogin(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                  Registrarse
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
                onPress={() => setIsLogin(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                  Iniciar Sesión
                </Text>
              </TouchableOpacity>
            </View>

            {/* Campo Usuario */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Usuario</Text>
              <TextInput
                placeholder="Ej: juan_123"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                editable={!loading}
                autoCapitalize="none"
              />
            </View>

            {/* Campo Email (solo registro) */}
            {!isLogin && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Correo Electrónico</Text>
                <TextInput
                  placeholder="tu@email.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  style={styles.input}
                  editable={!loading}
                  autoCapitalize="none"
                />
              </View>
            )}

            {/* Campo Contraseña */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Contraseña</Text>
              <TextInput
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Campo Código de Referido (solo registro) */}
            {!isLogin && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Código de Referido (Opcional)</Text>
                <TextInput
                  placeholder="Si alguien te invitó, pega su código"
                  placeholderTextColor="#999"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  style={styles.input}
                  editable={!loading}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {/* Botón Principal */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={isLogin ? handleLogin : handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🔒 Tus datos están seguros. Nunca compartimos información personal.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#DC2626',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#DC2626',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  logoSubtitle: {
    fontSize: 14,
    color: '#FEE2E2',
    marginTop: 4,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontWeight: '600',
    color: '#6B7280',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#DC2626',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  referralCodeBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  referralCodeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  referralCodeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC2626',
  },
  referralCodeInfo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
});
