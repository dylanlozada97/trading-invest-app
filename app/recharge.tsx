import { useState } from "react";
import { Text, View, TextInput, ScrollView, Alert, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { loadUser, syncUserFromServer } from "@/lib/auth-store";
import * as ImagePicker from "expo-image-picker";

export default function RechargeScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);

  const uploadMutation = trpc.investment.uploadProofImage.useMutation();
  const createRechargeMutation = trpc.investment.createRecharge.useMutation();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permisos", "Necesitamos acceso a tu galería para subir el comprobante");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setProofImage(result.assets[0].uri);
        if (result.assets[0].base64) {
          setProofBase64(result.assets[0].base64);
        }
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permisos", "Necesitamos acceso a tu cámara para tomar la foto");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setProofImage(result.assets[0].uri);
        if (result.assets[0].base64) {
          setProofBase64(result.assets[0].base64);
        }
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo tomar la foto");
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === "web") {
      pickImage();
      return;
    }
    Alert.alert(
      "Subir Comprobante",
      "¿Cómo quieres subir el comprobante?",
      [
        { text: "Tomar Foto", onPress: takePhoto },
        { text: "Galería", onPress: pickImage },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const handleRecharge = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }
    if (!reference.trim()) {
      Alert.alert("Error", "Ingresa la referencia del depósito");
      return;
    }
    if (!proofImage) {
      Alert.alert("Error", "Debes subir la foto del comprobante de pago");
      return;
    }

    setLoading(true);
    try {
      // Always sync user from server first to get the real ID and latest balance
      let user = await loadUser();
      if (!user) {
        Alert.alert("Error", "Sesión expirada. Por favor inicia sesión de nuevo.");
        setLoading(false);
        return;
      }

      // Always sync to get the real userId (fixes userId=0 bug for old accounts)
      const synced = await syncUserFromServer(user.id, user.username);
      if (synced && synced.id > 0) {
        user = synced;
      } else if (!user.id || user.id === 0) {
        Alert.alert("Error", "No se pudo verificar tu cuenta. Por favor cierra sesión e inicia de nuevo.");
        setLoading(false);
        return;
      }

      let proofUrl = "";

      // Upload image to S3 if we have base64 data
      if (proofBase64) {
        try {
          const uploadResult = await uploadMutation.mutateAsync({
            userId: user.id,
            imageBase64: proofBase64,
            fileName: `proof-${Date.now()}`,
          });
          proofUrl = uploadResult.url;
        } catch (uploadError: any) {
          Alert.alert("Error al subir foto", "No se pudo subir el comprobante. Verifica tu conexión e inténtalo de nuevo.\n\nDetalle: " + (uploadError?.message || "Error desconocido"));
          setLoading(false);
          return;
        }
      }

      // Create recharge with S3 URL
      await createRechargeMutation.mutateAsync({
        userId: user.id,
        amount: numAmount.toString(),
        reference: reference.trim(),
        proofUrl: proofUrl,
      });

      // Success! Show confirmation message
      Alert.alert(
        "¡Recarga Enviada! ✅",
        `Tu recarga de $${numAmount.toLocaleString()} ha sido enviada para aprobación.\n\nEl administrador revisará tu comprobante y aprobará tu recarga pronto.\n\nUna vez aprobada, el saldo se reflejará automáticamente en tu cuenta.`,
        [{ text: "Entendido 👍", onPress: () => router.back() }]
      );
    } catch (error: any) {
      const msg = error?.message || "Error al enviar recarga";
      Alert.alert("Error", msg + "\n\nPor favor verifica tu conexión e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
              <Text style={s.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Recargar Saldo</Text>
          </View>

          <View style={s.content}>
            {/* Bank Info */}
            <View style={s.bankCard}>
              <Text style={s.bankTitle}>Datos para Depositar</Text>
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Banco:</Text>
                <Text style={s.bankValue}>Bancolombia</Text>
              </View>
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Tipo:</Text>
                <Text style={s.bankValue}>Cuenta de Ahorros</Text>
              </View>
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Número:</Text>
                <Text style={s.bankValue}>123-456-789-00</Text>
              </View>
              <View style={[s.bankRow, { borderBottomWidth: 0 }]}>
                <Text style={s.bankLabel}>Titular:</Text>
                <Text style={s.bankValue}>Inversiones China SAS</Text>
              </View>
            </View>

            {/* Quick Amounts */}
            <Text style={s.label}>Monto a Recargar</Text>
            <View style={s.quickAmounts}>
              {[50000, 100000, 200000, 500000].map((a) => (
                <TouchableOpacity key={a} onPress={() => setAmount(a.toString())} style={[s.quickBtn, amount === a.toString() && s.quickBtnActive]} activeOpacity={0.7}>
                  <Text style={[s.quickBtnText, amount === a.toString() && s.quickBtnTextActive]}>${a.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={s.input}
              placeholder="O ingresa otro monto"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={s.label}>Referencia del Depósito</Text>
            <TextInput
              style={s.input}
              placeholder="Número de referencia o comprobante"
              placeholderTextColor="#999"
              value={reference}
              onChangeText={setReference}
            />

            {/* Photo Upload */}
            <Text style={s.label}>Foto del Comprobante *</Text>
            <TouchableOpacity onPress={showImageOptions} style={s.photoBtn} activeOpacity={0.7}>
              {proofImage ? (
                <View style={s.photoPreview}>
                  <Image source={{ uri: proofImage }} style={s.photoImage} />
                  <Text style={s.photoChangeText}>Cambiar foto</Text>
                </View>
              ) : (
                <View style={s.photoPlaceholder}>
                  <Text style={s.photoIcon}>📷</Text>
                  <Text style={s.photoText}>Tomar foto o seleccionar de galería</Text>
                  <Text style={s.photoSubtext}>Toca aquí para subir el comprobante</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRecharge} disabled={loading} style={[s.submitBtn, loading && s.submitBtnDisabled]} activeOpacity={0.7}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Enviar Recarga</Text>}
            </TouchableOpacity>

            <Text style={s.note}>Tu recarga será revisada y aprobada por el administrador en las próximas horas.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: "#DC2626", padding: 20, paddingTop: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: "#fff", fontSize: 16 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  content: { padding: 20 },
  bankCard: { backgroundColor: "#16213e", borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#fbbf24" },
  bankTitle: { fontSize: 16, fontWeight: "bold", color: "#fbbf24", marginBottom: 12 },
  bankRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#334155" },
  bankLabel: { fontSize: 14, color: "#9BA1A6" },
  bankValue: { fontSize: 14, color: "#ECEDEE", fontWeight: "600" },
  label: { fontSize: 14, fontWeight: "600", color: "#ECEDEE", marginBottom: 8, marginTop: 16 },
  quickAmounts: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 },
  quickBtn: { backgroundColor: "#16213e", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#334155" },
  quickBtnActive: { borderColor: "#DC2626", backgroundColor: "#DC262620" },
  quickBtnText: { color: "#9BA1A6", fontWeight: "600" },
  quickBtnTextActive: { color: "#DC2626" },
  input: { borderWidth: 1, borderColor: "#334155", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#ECEDEE", backgroundColor: "#16213e" },
  photoBtn: { borderWidth: 2, borderColor: "#334155", borderRadius: 14, borderStyle: "dashed", overflow: "hidden" },
  photoPlaceholder: { padding: 30, alignItems: "center" },
  photoIcon: { fontSize: 40, marginBottom: 8 },
  photoText: { fontSize: 15, color: "#ECEDEE", fontWeight: "600", marginBottom: 4 },
  photoSubtext: { fontSize: 13, color: "#9BA1A6" },
  photoPreview: { alignItems: "center" },
  photoImage: { width: "100%", height: 200, resizeMode: "contain" },
  photoChangeText: { paddingVertical: 10, color: "#DC2626", fontWeight: "600", fontSize: 14 },
  submitBtn: { backgroundColor: "#DC2626", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  note: { textAlign: "center", color: "#9BA1A6", fontSize: 13, marginTop: 16 },
});
