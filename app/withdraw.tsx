import { useState } from "react";
import { Text, View, TextInput, ScrollView, Alert, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { loadUser } from "@/lib/auth-store";


export default function WithdrawScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [loading, setLoading] = useState(false);

  const createWithdrawalMutation = trpc.investment.createWithdrawal.useMutation();

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      Alert.alert("Error", "Completa todos los datos bancarios");
      return;
    }

    setLoading(true);
    try {
      const user = await loadUser();
      if (!user) {
        Alert.alert("Error", "Sesión expirada");
        return;
      }

      if (numAmount > parseFloat(user.balance)) {
        Alert.alert("Error", "Saldo insuficiente");
        setLoading(false);
        return;
      }

      await createWithdrawalMutation.mutateAsync({
        userId: user.id,
        amount: numAmount.toString(),
        bankName: bankName.trim() + ' - ' + accountHolder.trim(),
        accountNumber: accountNumber.trim(),
      });

      Alert.alert(
        "Retiro Solicitado",
        "Tu solicitud de retiro está pendiente de aprobación. El administrador la procesará pronto.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Error al solicitar retiro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
              <Text style={s.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Retirar Fondos</Text>
          </View>

          <View style={s.content}>
            <Text style={s.label}>Monto a Retirar</Text>
            <TextInput
              style={s.input}
              placeholder="Monto en pesos"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={s.label}>Banco</Text>
            <TextInput
              style={s.input}
              placeholder="Ej: Bancolombia, Davivienda..."
              placeholderTextColor="#999"
              value={bankName}
              onChangeText={setBankName}
            />

            <Text style={s.label}>Número de Cuenta</Text>
            <TextInput
              style={s.input}
              placeholder="Número de cuenta bancaria"
              placeholderTextColor="#999"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
            />

            <Text style={s.label}>Titular de la Cuenta</Text>
            <TextInput
              style={s.input}
              placeholder="Nombre del titular"
              placeholderTextColor="#999"
              value={accountHolder}
              onChangeText={setAccountHolder}
            />

            <TouchableOpacity onPress={handleWithdraw} disabled={loading} style={[s.submitBtn, loading && s.submitBtnDisabled]} activeOpacity={0.7}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Solicitar Retiro</Text>}
            </TouchableOpacity>

            <Text style={s.note}>Tu retiro será procesado por el administrador en un plazo de 24-48 horas.</Text>
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
  label: { fontSize: 14, fontWeight: "600", color: "#ECEDEE", marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: "#334155", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#ECEDEE", backgroundColor: "#16213e" },
  submitBtn: { backgroundColor: "#DC2626", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  note: { textAlign: "center", color: "#9BA1A6", fontSize: 13, marginTop: 16 },
});
