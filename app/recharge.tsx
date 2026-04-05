import { useState } from "react";
import { Text, View, TextInput, ScrollView, Alert, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { loadUser } from "@/lib/auth-store";
import { Pressable } from "react-native";

export default function RechargeScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  const createRechargeMutation = trpc.investment.createRecharge.useMutation();

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

    setLoading(true);
    try {
      const user = await loadUser();
      if (!user) {
        Alert.alert("Error", "Sesión expirada");
        return;
      }

      await createRechargeMutation.mutateAsync({
        userId: user.id,
        amount: numAmount.toString(),
        reference: reference.trim(),
      });

      Alert.alert(
        "Recarga Enviada",
        "Tu recarga está pendiente de aprobación. El administrador la revisará pronto.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Error al enviar recarga");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <Pressable onPress={() => router.back()} style={s.backBtn}>
              <Text style={s.backText}>← Volver</Text>
            </Pressable>
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
                <Pressable key={a} onPress={() => setAmount(a.toString())} style={[s.quickBtn, amount === a.toString() && s.quickBtnActive]}>
                  <Text style={[s.quickBtnText, amount === a.toString() && s.quickBtnTextActive]}>${a.toLocaleString()}</Text>
                </Pressable>
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

            <Pressable onPress={handleRecharge} disabled={loading} style={[s.submitBtn, loading && s.submitBtnDisabled]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Enviar Recarga</Text>}
            </Pressable>

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
  submitBtn: { backgroundColor: "#DC2626", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  note: { textAlign: "center", color: "#9BA1A6", fontSize: 13, marginTop: 16 },
});
