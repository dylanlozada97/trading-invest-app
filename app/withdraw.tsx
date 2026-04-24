import { useState, useEffect, useCallback } from "react";
import { Text, View, TextInput, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { loadUser, AppUser, syncUserFromServer } from "@/lib/auth-store";
import { showAlert } from "@/lib/alert";

export default function WithdrawScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadData = useCallback(async () => {
    const u = await loadUser();
    if (u) {
      setUser(u);
      const synced = await syncUserFromServer(u.id, u.username);
      if (synced) setUser(synced);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createWithdrawalMutation = trpc.investment.createWithdrawal.useMutation();

  const handleWithdraw = async () => {
    if (submitted || loading) return;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      showAlert("Error", "Ingresa un monto válido");
      return;
    }
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      showAlert("Error", "Completa todos los datos bancarios");
      return;
    }

    setLoading(true);
    try {
      let currentUser = user;
      if (!currentUser) {
        currentUser = await loadUser();
      }
      if (!currentUser) {
        showAlert("Error", "Sesión expirada. Por favor inicia sesión de nuevo.");
        setLoading(false);
        return;
      }

      if (currentUser.id === 0 || !currentUser.id) {
        const synced = await syncUserFromServer(currentUser.id, currentUser.username);
        if (synced && synced.id > 0) {
          currentUser = synced;
          setUser(synced);
        } else {
          showAlert("Error", "No se pudo verificar tu cuenta. Cierra sesión e inicia de nuevo.");
          setLoading(false);
          return;
        }
      }

      if (numAmount > parseFloat(currentUser.balance)) {
        showAlert("Saldo Insuficiente", `Tu saldo disponible es $${parseFloat(currentUser.balance).toLocaleString("es-CO")}.\n\nNo puedes retirar más de tu saldo disponible.`);
        setLoading(false);
        return;
      }

      await createWithdrawalMutation.mutateAsync({
        userId: currentUser.id,
        amount: numAmount.toString(),
        bankName: bankName.trim() + " - " + accountHolder.trim(),
        accountNumber: accountNumber.trim(),
      });

      setSubmitted(true);
      setLoading(false);
    } catch (error: any) {
      showAlert("Error", error?.message || "Error al solicitar retiro");
      setLoading(false);
    }
  };

  const balance = user ? parseFloat(user.balance) : 0;

  // Success screen
  if (submitted) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={s.successContainer}>
          <View style={s.successIconBg}>
            <Text style={s.successEmoji}>✅</Text>
          </View>
          <Text style={s.successTitle}>¡Retiro Solicitado!</Text>
          <Text style={s.successMsg}>
            Tu solicitud de retiro de <Text style={s.successAmount}>${parseFloat(amount).toLocaleString("es-CO")}</Text> ha sido enviada.
          </Text>
          <Text style={s.successSub}>
            El administrador procesará tu retiro en un plazo de 24-48 horas hábiles.
          </Text>

          <View style={s.successDetails}>
            <View style={s.successRow}>
              <Text style={s.successRowLabel}>Banco:</Text>
              <Text style={s.successRowValue}>{bankName}</Text>
            </View>
            <View style={s.successRow}>
              <Text style={s.successRowLabel}>Cuenta:</Text>
              <Text style={s.successRowValue}>{accountNumber}</Text>
            </View>
            <View style={[s.successRow, { borderBottomWidth: 0 }]}>
              <Text style={s.successRowLabel}>Titular:</Text>
              <Text style={s.successRowValue}>{accountHolder}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)" as any)}
            style={s.successBtn}
            activeOpacity={0.7}
          >
            <Text style={s.successBtnText}>Volver al Menú Principal</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
              <Text style={s.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Retirar Fondos</Text>
            <Text style={s.headerSub}>Saldo disponible: ${balance.toLocaleString("es-CO")}</Text>
          </View>

          <View style={s.content}>
            {/* Info Card */}
            <View style={s.infoCard}>
              <Text style={s.infoIcon}>🏦</Text>
              <Text style={s.infoTitle}>Retiro Seguro</Text>
              <Text style={s.infoDesc}>Tu retiro será procesado en 24-48 horas hábiles</Text>
            </View>

            {/* Monto */}
            <Text style={s.label}>Monto a Retirar</Text>
            <View style={s.quickAmounts}>
              {[50000, 100000, 200000, 500000].map((a) => (
                <TouchableOpacity
                  key={a}
                  onPress={() => setAmount(a.toString())}
                  style={[s.quickBtn, amount === a.toString() && s.quickBtnActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.quickBtnText, amount === a.toString() && s.quickBtnTextActive]}>
                    ${a.toLocaleString("es-CO")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={s.input}
              placeholder="O ingresa otro monto"
              placeholderTextColor="#666"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            {/* Datos Bancarios */}
            <View style={s.bankSection}>
              <Text style={s.bankSectionTitle}>Datos Bancarios</Text>

              <Text style={s.label}>Banco</Text>
              <TextInput
                style={s.input}
                placeholder="Ej: Bancolombia, Davivienda..."
                placeholderTextColor="#666"
                value={bankName}
                onChangeText={setBankName}
              />

              <Text style={s.label}>Número de Cuenta</Text>
              <TextInput
                style={s.input}
                placeholder="Número de cuenta bancaria"
                placeholderTextColor="#666"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
              />

              <Text style={s.label}>Titular de la Cuenta</Text>
              <TextInput
                style={s.input}
                placeholder="Nombre del titular"
                placeholderTextColor="#666"
                value={accountHolder}
                onChangeText={setAccountHolder}
              />
            </View>

            {/* Summary */}
            {amount && parseFloat(amount) > 0 && (
              <View style={s.summaryCard}>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Monto a retirar:</Text>
                  <Text style={s.summaryValue}>${parseFloat(amount).toLocaleString("es-CO")}</Text>
                </View>
                <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
                  <Text style={s.summaryLabel}>Saldo después:</Text>
                  <Text style={[s.summaryValue, { color: balance - parseFloat(amount) >= 0 ? "#4ADE80" : "#EF4444" }]}>
                    ${Math.max(0, balance - parseFloat(amount)).toLocaleString("es-CO")}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleWithdraw}
              disabled={loading || submitted}
              style={[s.submitBtn, (loading || submitted) && s.submitBtnDisabled]}
              activeOpacity={0.7}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Solicitar Retiro</Text>}
            </TouchableOpacity>

            <Text style={s.note}>Tu retiro será procesado por el administrador en un plazo de 24-48 horas hábiles.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  // Header
  header: { backgroundColor: "#DC2626", padding: 20, paddingTop: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: "#fff", fontSize: 16 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  headerSub: { fontSize: 16, color: "#fbbf24", marginTop: 4 },

  content: { padding: 20 },

  // Info Card
  infoCard: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1e2d4a",
  },
  infoIcon: { fontSize: 36, marginBottom: 8 },
  infoTitle: { fontSize: 16, fontWeight: "bold", color: "#ECEDEE", marginBottom: 4 },
  infoDesc: { fontSize: 13, color: "#9BA1A6", textAlign: "center" },

  // Form
  label: { fontSize: 14, fontWeight: "600", color: "#ECEDEE", marginBottom: 8, marginTop: 16 },
  quickAmounts: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 },
  quickBtn: {
    backgroundColor: "#16213e",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e2d4a",
  },
  quickBtnActive: { borderColor: "#DC2626", backgroundColor: "#DC262618" },
  quickBtnText: { color: "#9BA1A6", fontWeight: "600", fontSize: 13 },
  quickBtnTextActive: { color: "#DC2626" },
  input: {
    borderWidth: 1,
    borderColor: "#1e2d4a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#ECEDEE",
    backgroundColor: "#16213e",
  },

  // Bank Section
  bankSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#1e2d4a",
  },
  bankSectionTitle: { fontSize: 16, fontWeight: "bold", color: "#fbbf24", marginBottom: 4 },

  // Summary
  summaryCard: {
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#1e2d4a",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d4a",
  },
  summaryLabel: { fontSize: 14, color: "#9BA1A6" },
  summaryValue: { fontSize: 14, color: "#ECEDEE", fontWeight: "700" },

  // Submit
  submitBtn: { backgroundColor: "#DC2626", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  note: { textAlign: "center", color: "#9BA1A6", fontSize: 13, marginTop: 16, lineHeight: 20 },

  // Success Screen
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30, backgroundColor: "#1a1a2e" },
  successIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4ADE8018",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successEmoji: { fontSize: 40 },
  successTitle: { fontSize: 26, fontWeight: "bold", color: "#fff", marginBottom: 12, textAlign: "center" },
  successMsg: { fontSize: 16, color: "#ECEDEE", textAlign: "center", marginBottom: 8, lineHeight: 24 },
  successAmount: { color: "#fbbf24", fontWeight: "bold" },
  successSub: { fontSize: 14, color: "#9BA1A6", textAlign: "center", marginBottom: 20, lineHeight: 22 },
  successDetails: {
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 16,
    width: "100%",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#1e2d4a",
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d4a",
  },
  successRowLabel: { fontSize: 14, color: "#9BA1A6" },
  successRowValue: { fontSize: 14, color: "#ECEDEE", fontWeight: "600" },
  successBtn: { backgroundColor: "#22C55E", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: "100%", alignItems: "center" },
  successBtnText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
});
