import { useState } from "react";
import { Text, View, TextInput, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { saveUser, generateReferralCode } from "@/lib/auth-store";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function WelcomeScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [newReferralCode, setNewReferralCode] = useState("");

  // Register fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralInput, setReferralInput] = useState("");

  // Login fields
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const createUserMutation = trpc.investment.createUser.useMutation();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const referralCode = generateReferralCode();

      const result = await createUserMutation.mutateAsync({
        username: username.trim(),
        email: email.trim(),
        referralCode,
        referredBy: referralInput.trim() || undefined,
      });

      await AsyncStorage.setItem("pwd_" + username.trim(), password);

      const user = {
        id: result.userId,
        username: username.trim(),
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
        Alert.alert("Error", "El nombre de usuario ya existe");
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginUser.trim() || !loginPass.trim()) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    setLoading(true);
    try {
      const savedPwd = await AsyncStorage.getItem("pwd_" + loginUser.trim());
      if (!savedPwd || savedPwd !== loginPass) {
        Alert.alert("Error", "Usuario o contraseña incorrectos");
        setLoading(false);
        return;
      }

      const savedUser = await AsyncStorage.getItem("auth_user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.username === loginUser.trim()) {
          router.replace("/(tabs)");
          return;
        }
      }

      Alert.alert("Error", "Usuario no encontrado en este dispositivo");
    } catch (error: any) {
      Alert.alert("Error", "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setShowReferralModal(false);
    router.replace("/(tabs)");
  };

  if (showReferralModal) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={s.modalContainer}>
          <View style={s.modalCard}>
            <Text style={s.modalEmoji}>🎉</Text>
            <Text style={s.modalTitle}>Registro Exitoso</Text>
            <Text style={s.modalSubtitle}>Tu código de referido es:</Text>
            <View style={s.codeBox}>
              <Text style={s.codeText}>{newReferralCode}</Text>
            </View>
            <Text style={s.modalHint}>Comparte este código con tus amigos para ganar comisiones</Text>
            <TouchableOpacity onPress={handleContinue} style={s.continueBtn} activeOpacity={0.7}>
              <Text style={s.continueBtnText}>Continuar a la Plataforma</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <Text style={s.lantern}>🏮</Text>
            <Text style={s.title}>Inversiones China</Text>
            <Text style={s.subtitle}>Gana 60% en 15 días</Text>
          </View>

          <View style={s.formCard}>
            <View style={s.tabRow}>
              <TouchableOpacity onPress={() => setIsLogin(false)} style={[s.tab, !isLogin && s.tabActive]} activeOpacity={0.7}>
                <Text style={[s.tabText, !isLogin && s.tabTextActive]}>Registrarse</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsLogin(true)} style={[s.tab, isLogin && s.tabActive]} activeOpacity={0.7}>
                <Text style={[s.tabText, isLogin && s.tabTextActive]}>Iniciar Sesión</Text>
              </TouchableOpacity>
            </View>

            {!isLogin ? (
              <View style={s.formBody}>
                <Text style={s.label}>Usuario</Text>
                <TextInput style={s.input} placeholder="Ej: juan_123" placeholderTextColor="#999" value={username} onChangeText={setUsername} autoCapitalize="none" />
                <Text style={s.label}>Correo Electrónico</Text>
                <TextInput style={s.input} placeholder="tu@email.com" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <Text style={s.label}>Contraseña</Text>
                <TextInput style={s.input} placeholder="Mínimo 6 caracteres" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry />
                <Text style={s.label}>Código de Referido (Opcional)</Text>
                <TextInput style={s.input} placeholder="Si alguien te invitó, pega su código" placeholderTextColor="#999" value={referralInput} onChangeText={setReferralInput} autoCapitalize="characters" />
                <TouchableOpacity onPress={handleRegister} disabled={loading} style={[s.submitBtn, loading && s.submitBtnDisabled]} activeOpacity={0.7}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Registrarse</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.formBody}>
                <Text style={s.label}>Usuario</Text>
                <TextInput style={s.input} placeholder="Tu nombre de usuario" placeholderTextColor="#999" value={loginUser} onChangeText={setLoginUser} autoCapitalize="none" />
                <Text style={s.label}>Contraseña</Text>
                <TextInput style={s.input} placeholder="Tu contraseña" placeholderTextColor="#999" value={loginPass} onChangeText={setLoginPass} secureTextEntry />
                <TouchableOpacity onPress={handleLogin} disabled={loading} style={[s.submitBtn, loading && s.submitBtnDisabled]} activeOpacity={0.7}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Iniciar Sesión</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={s.footer}>🔒 Tus datos están seguros. Nunca compartimos información personal.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { alignItems: "center", paddingTop: 40, paddingBottom: 24, backgroundColor: "#DC2626" },
  lantern: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", marginTop: 8 },
  subtitle: { fontSize: 16, color: "#fbbf24", marginTop: 4 },
  formCard: { marginHorizontal: 20, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginTop: -10 },
  tabRow: { flexDirection: "row" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "#e5e7eb" },
  tabActive: { borderBottomColor: "#DC2626" },
  tabText: { fontSize: 16, color: "#687076", fontWeight: "600" },
  tabTextActive: { color: "#DC2626" },
  formBody: { padding: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#333", backgroundColor: "#f9fafb" },
  submitBtn: { backgroundColor: "#DC2626", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  footer: { textAlign: "center", color: "#9BA1A6", fontSize: 13, marginTop: 20, marginBottom: 30, paddingHorizontal: 20 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a2e", padding: 20 },
  modalCard: { backgroundColor: "#16213e", borderRadius: 20, padding: 30, alignItems: "center", width: "100%", maxWidth: 360 },
  modalEmoji: { fontSize: 60, marginBottom: 12 },
  modalTitle: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  modalSubtitle: { fontSize: 16, color: "#9BA1A6", marginBottom: 16 },
  codeBox: { backgroundColor: "#DC2626", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  codeText: { fontSize: 22, fontWeight: "bold", color: "#fff", letterSpacing: 2 },
  modalHint: { fontSize: 13, color: "#9BA1A6", textAlign: "center", marginBottom: 24 },
  continueBtn: { backgroundColor: "#22C55E", paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, width: "100%", alignItems: "center" },
  continueBtnText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
});
