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

      // IMPORTANTE: Guardar contraseña PRIMERO, antes de crear usuario
      try {
        await AsyncStorage.setItem("pwd_" + trimmedUsername, password);
      } catch (storageError) {
        console.error("Error guardando contraseña:", storageError);
        showAlert("Error", "No se pudo guardar la contraseña. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      // Crear usuario en el servidor
      const result = await createUserMutation.mutateAsync({
        username: trimmedUsername,
        email: email.trim(),
        referralCode,
        referredBy: referralInput.trim() || undefined,
      });

      // Guardar usuario en AsyncStorage
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

      // Mostrar código de referido
      setNewReferralCode(referralCode);
      setShowReferralModal(true);
    } catch (error: any) {
      const msg = error?.message || "Error al registrar";
      console.error("Error en handleRegister:", error);
      if (msg.includes("Duplicate") && msg.includes("username")) {
        showAlert("Error", "El nombre de usuario ya existe");
      } else {
        showAlert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserByUsernameMutation = trpc.investment.getUserByUsername.useMutation();

  const handleLogin = async () => {
    if (!loginUser.trim() || !loginPass.trim()) {
      showAlert("Error", "Usuario y contraseña son obligatorios");
      return;
    }

    setLoading(true);
    try {
      const trimmedUsername = loginUser.trim();

      // Verificar contraseña guardada localmente
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

      // Obtener datos del usuario desde el servidor
      const result = await getUserByUsernameMutation.mutateAsync({
        username: trimmedUsername,
      });

      if (!result || !result.id) {
        showAlert("Error", "Usuario no encontrado en el servidor");
        setLoading(false);
        return;
      }

      // Guardar usuario en AsyncStorage
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

      // Limpiar campos
      setLoginUser("");
      setLoginPass("");

      // Redirigir al home
      router.replace("/(tabs)");
    } catch (error: any) {
      const msg = error?.message || "Error al iniciar sesión";
      console.error("Error en handleLogin:", error);
      showAlert("Error", msg);
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

  const inputStyle = {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#333",
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}>
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 30 }}>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#333", marginBottom: 8 }}>
              Inversiones China
            </Text>
            <Text style={{ fontSize: 14, color: "#666" }}>
              Gana 60% en 15 días
            </Text>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: "row", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
            <TouchableOpacity
              onPress={() => setIsLogin(false)}
              style={{
                flex: 1,
                paddingBottom: 12,
                borderBottomWidth: isLogin ? 0 : 3,
                borderBottomColor: isLogin ? "transparent" : "#FF4444",
              }}
            >
              <Text style={{ textAlign: "center", fontSize: 16, fontWeight: isLogin ? "400" : "600", color: isLogin ? "#999" : "#333" }}>
                Registrarse
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsLogin(true)}
              style={{
                flex: 1,
                paddingBottom: 12,
                borderBottomWidth: isLogin ? 3 : 0,
                borderBottomColor: isLogin ? "#FF4444" : "transparent",
              }}
            >
              <Text style={{ textAlign: "center", fontSize: 16, fontWeight: isLogin ? "600" : "400", color: isLogin ? "#333" : "#999" }}>
                Iniciar Sesión
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Form */}
          {!isLogin ? (
            <View>
              <TextInput
                placeholder="Usuario"
                value={username}
                onChangeText={setUsername}
                style={inputStyle}
                editable={!loading}
              />
              <TextInput
                placeholder="Correo Electrónico"
                value={email}
                onChangeText={setEmail}
                style={inputStyle}
                keyboardType="email-address"
                editable={!loading}
              />
              <TextInput
                placeholder="Contraseña (mínimo 6 caracteres)"
                value={password}
                onChangeText={setPassword}
                style={inputStyle}
                secureTextEntry
                editable={!loading}
              />
              <TextInput
                placeholder="Código de Referido (Opcional)"
                value={referralInput}
                onChangeText={setReferralInput}
                style={inputStyle}
                editable={!loading}
              />

              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                style={{
                  backgroundColor: loading ? "#ccc" : "#FF4444",
                  padding: 14,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                    Registrarse
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Login Form */
            <View>
              <TextInput
                placeholder="Usuario"
                value={loginUser}
                onChangeText={setLoginUser}
                style={inputStyle}
                editable={!loading}
              />
              <TextInput
                placeholder="Contraseña"
                value={loginPass}
                onChangeText={setLoginPass}
                style={inputStyle}
                secureTextEntry
                editable={!loading}
              />

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                style={{
                  backgroundColor: loading ? "#ccc" : "#FF4444",
                  padding: 14,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                    Iniciar Sesión
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Security Note */}
          <View style={{ marginTop: 20, padding: 12, backgroundColor: "#f0f0f0", borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: "#666", textAlign: "center" }}>
              🔒 Tus datos están seguros. Nunca compartimos información personal.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Referral Modal */}
      {showReferralModal && (
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20, width: "100%", maxWidth: 400 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12, color: "#333" }}>
              Tu Código de Referido
            </Text>
            <View style={{ backgroundColor: "#f0f0f0", padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FF4444", textAlign: "center" }}>
                {newReferralCode}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#666", marginBottom: 16, textAlign: "center" }}>
              Comparte este código con tus amigos y gana comisión por cada referido.
            </Text>
            <TouchableOpacity
              onPress={handleCloseReferralModal}
              style={{
                backgroundColor: "#FF4444",
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Continuar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
