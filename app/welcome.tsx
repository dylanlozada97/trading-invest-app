import { useState } from "react";
import { Text, View, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { saveUser, generateReferralCode } from "@/lib/auth-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showAlert } from "@/lib/alert";

export default function WelcomeScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [newReferralCode, setNewReferralCode] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralInput, setReferralInput] = useState("");

  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const createUserMutation = trpc.investment.createUser.useMutation();
  const getUserByUsernameMutation = trpc.investment.getUserByUsername.useMutation();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      showAlert("Error", "Todos los campos son obligatorios");
      return;
    }
    if (password.length < 6) {
      showAlert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const referralCode = generateReferralCode();
      const trimmedUsername = username.trim();
      try {
        await AsyncStorage.setItem("pwd_" + trimmedUsername, password);
      } catch (storageError) {
        showAlert("Error", "No se pudo guardar la contraseña. Intenta de nuevo.");
        setLoading(false);
        return;
      }
      const result = await createUserMutation.mutateAsync({
        username: trimmedUsername,
        email: email.trim(),
        referralCode,
        referredBy: referralInput.trim() || undefined,
      });
      const user = {
        id: result.userId,
        username: trimmedUsername,
        email: email.trim(),
        balance: "0",
        totalReferrals: 0,
        referralCode,
        referredBy: referralInput.trim() || null,
      };
      await saveUser(user);
      setNewReferralCode(referralCode);
      setShowReferralModal(true);
    } catch (error: any) {
      const msg = error?.message || "Error al registrar";
      if (msg.includes("Duplicate") && msg.includes("username")) {
        showAlert("Error", "El nombre de usuario ya existe");
      } else {
        showAlert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginUser.trim() || !loginPass.trim()) {
      showAlert("Error", "Usuario y contraseña son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const trimmedUsername = loginUser.trim();
      const savedPassword = await AsyncStorage.getItem("pwd_" + trimmedUsername);
      if (!savedPassword) {
        showAlert("Error", "Usuario no encontrado. Por favor, regístrate primero.");
        setLoading(false);
        return;
      }
      if (savedPassword !== loginPass) {
        showAlert("Error", "Contraseña incorrecta");
        setLoading(false);
        return;
      }
      const result = await getUserByUsernameMutation.mutateAsync({ username: trimmedUsername });
      if (!result || !result.id) {
        showAlert("Error", "Usuario no encontrado en el servidor");
        setLoading(false);
        return;
      }
      const user = {
        id: result.id,
        username: trimmedUsername,
        email: result.email || "",
        balance: result.balance?.toString() || "0",
        totalReferrals: result.totalReferrals || 0,
        referralCode: result.referralCode || "",
        referredBy: result.referredBy || null,
      };
      await saveUser(user);
      setLoginUser("");
      setLoginPass("");
      router.replace("/(tabs)");
    } catch (error: any) {
      showAlert("Error", error?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseReferralModal = () => {
    setShowReferralModal(false);
    setUsername("");
    setEmail("");
    setPassword("");
    setReferralInput("");
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">

          {/* Logo & Branding */}
          <View style={s.brandContainer}>
            <View style={s.logoCircle}>
              <Text style={s.logoText}>IC</Text>
            </View>
            <Text style={s.brandTitle}>Inversiones China</Text>
            <Text style={s.brandSubtitle}>Gana 60% en 15 días</Text>
            <View style={s.divider} />
          </View>

          {/* Tabs */}
          <View style={s.tabsContainer}>
            <TouchableOpacity
              onPress={() => setIsLogin(false)}
              style={[s.tab, !isLogin && s.tabActive]}
              activeOpacity={0.7}
            >
              <Text style={[s.tabText, !isLogin && s.tabTextActive]}>Registrarse</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsLogin(true)}
              style={[s.tab, isLogin && s.tabActive]}
              activeOpacity={0.7}
            >
              <Text style={[s.tabText, isLogin && s.tabTextActive]}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={s.formCard}>
            {!isLogin ? (
              <>
                <View style={s.inputWrapper}>
                  <Text style={s.inputLabel}>Usuario</Text>
                  <TextInput
                    placeholder="Ej: juan_123"
                    placeholderTextColor="#555"
                    value={username}
                    onChangeText={setUsername}
                    style={s.input}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                </View>
                <View style={s.inputWrapper}>
                  <Text style={s.inputLabel}>Correo Electrónico</Text>
                  <TextInput
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor="#555"
                    value={email}
                    onChangeText={setEmail}
                    style={s.input}
                    keyboardType="email-address"
                    editable={!loading}
                    autoCapitalize="none"
                  />
                </View>
                <View style={s.inputWrapper}>
                  <Text style={s.inputLabel}>Contraseña</Text>
                  <TextInput
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#555"
                    value={password}
                    onChangeText={setPassword}
                    style={s.input}
                    secureTextEntry
                    editable={!loading}
                  />
                </View>
                <View style={s.inputWrapper}>
                  <Text style={s.inputLabel}>Código de Referido (Opcional)</Text>
                  <TextInput
                    placeholder="Ingresa el código"
                    placeholderTextColor="#555"
                    value={referralInput}
                    onChangeText={setReferralInput}
                    style={s.input}
                    editable={!loading}
                    autoCapitalize="characters"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={loading}
                  style={[s.primaryBtn, loading && s.primaryBtnDisabled]}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.primaryBtnText}>Crear Cuenta</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={s.inputWrapper}>
                  <Text style={s.inputLabel}>Usuario</Text>
                  <TextInput
                    placeholder="Tu nombre de usuario"
                    placeholderTextColor="#555"
                    value={loginUser}
                    onChangeText={setLoginUser}
                    style={s.input}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                </View>
                <View style={s.inputWrapper}>
                  <Text style={s.inputLabel}>Contraseña</Text>
                  <TextInput
                    placeholder="Tu contraseña"
                    placeholderTextColor="#555"
                    value={loginPass}
                    onChangeText={setLoginPass}
                    style={s.input}
                    secureTextEntry
                    editable={!loading}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  style={[s.primaryBtn, loading && s.primaryBtnDisabled]}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.primaryBtnText}>Iniciar Sesión</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Security Note */}
          <View style={s.securityNote}>
            <Text style={s.securityText}>Tus datos están protegidos y seguros</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Referral Modal */}
      {showReferralModal && (
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalIconCircle}>
              <Text style={s.modalIcon}>🎉</Text>
            </View>
            <Text style={s.modalTitle}>¡Registro Exitoso!</Text>
            <Text style={s.modalSubtitle}>Tu código de referido es:</Text>
            <View style={s.referralCodeBox}>
              <Text style={s.referralCodeText}>{newReferralCode}</Text>
            </View>
            <Text style={s.modalDesc}>
              Comparte este código con tus amigos y gana comisión por cada referido que invierta.
            </Text>
            <TouchableOpacity onPress={handleCloseReferralModal} style={s.primaryBtn} activeOpacity={0.8}>
              <Text style={s.primaryBtnText}>Comenzar a Invertir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  // Brand
  brandContainer: { alignItems: "center", marginBottom: 28 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center", marginBottom: 16, shadowColor: "#DC2626", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  logoText: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  brandTitle: { fontSize: 28, fontWeight: "bold", color: "#ECEDEE", letterSpacing: 0.5 },
  brandSubtitle: { fontSize: 15, color: "#fbbf24", marginTop: 4, fontWeight: "500" },
  divider: { width: 40, height: 3, backgroundColor: "#DC2626", borderRadius: 2, marginTop: 16 },

  // Tabs
  tabsContainer: { flexDirection: "row", backgroundColor: "#0f1629", borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#DC2626" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#9BA1A6" },
  tabTextActive: { color: "#fff" },

  // Form Card
  formCard: { backgroundColor: "#16213e", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#1e2d4a" },
  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#9BA1A6", marginBottom: 6, marginLeft: 2 },
  input: { backgroundColor: "#0f1629", borderWidth: 1, borderColor: "#1e2d4a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#ECEDEE" },

  // Primary Button
  primaryBtn: { backgroundColor: "#DC2626", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8, shadowColor: "#DC2626", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryBtnDisabled: { backgroundColor: "#555", shadowOpacity: 0 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },

  // Security Note
  securityNote: { marginTop: 20, paddingVertical: 10, alignItems: "center" },
  securityText: { fontSize: 12, color: "#555", fontWeight: "500" },

  // Modal
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { backgroundColor: "#16213e", borderRadius: 20, padding: 28, width: "100%", maxWidth: 380, alignItems: "center", borderWidth: 1, borderColor: "#1e2d4a" },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#DC262620", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  modalIcon: { fontSize: 32 },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#ECEDEE", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: "#9BA1A6", marginBottom: 12 },
  referralCodeBox: { backgroundColor: "#0f1629", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#DC262640" },
  referralCodeText: { fontSize: 26, fontWeight: "bold", color: "#fbbf24", letterSpacing: 2 },
  modalDesc: { fontSize: 13, color: "#9BA1A6", textAlign: "center", marginBottom: 20, lineHeight: 20 },
});
