import { useState, useEffect, useCallback } from "react";
import { Text, View, TextInput, ScrollView, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { loadUser, saveUser, AppUser } from "@/lib/auth-store";
import { Pressable } from "react-native";

export default function InvestScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    const u = await loadUser();
    if (u) setUser(u);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createInvestmentMutation = trpc.investment.createInvestment.useMutation();

  const handleInvest = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 50000) {
      Alert.alert("Error", "La inversión mínima es de $50.000");
      return;
    }
    if (!user) return;

    const balance = parseFloat(user.balance);
    if (balance < numAmount) {
      Alert.alert("Saldo Insuficiente", `Tu saldo es $${balance.toLocaleString()}. Recarga primero.`);
      return;
    }

    Alert.alert(
      "Confirmar Inversión",
      `Monto: $${numAmount.toLocaleString()}\nGanancia: $${(numAmount * 0.6).toLocaleString()}\nTotal a recibir: $${(numAmount * 1.6).toLocaleString()}\n\nPlazo: 15 días`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setLoading(true);
            try {
              await createInvestmentMutation.mutateAsync({
                userId: user.id,
                amount: numAmount.toString(),
              });

              const newBalance = (balance - numAmount).toString();
              const updatedUser = { ...user, balance: newBalance };
              await saveUser(updatedUser);
              setUser(updatedUser);

              Alert.alert(
                "Inversión Exitosa",
                `Has invertido $${numAmount.toLocaleString()}.\nRecibirás $${(numAmount * 1.6).toLocaleString()} en 15 días.`,
                [{ text: "OK", onPress: () => router.back() }]
              );
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Error al invertir");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>← Volver</Text>
          </Pressable>
          <Text style={s.headerTitle}>Invertir</Text>
          <Text style={s.headerSub}>Saldo: ${user ? parseFloat(user.balance).toLocaleString() : "0"}</Text>
        </View>

        <View style={s.content}>
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>Rendimiento Garantizado</Text>
            <Text style={s.infoPct}>60%</Text>
            <Text style={s.infoSub}>en 15 días</Text>
          </View>

          <Text style={s.label}>Selecciona un Monto</Text>
          <View style={s.quickAmounts}>
            {[50000, 100000, 200000, 500000, 1000000].map((a) => (
              <Pressable key={a} onPress={() => setAmount(a.toString())} style={[s.quickBtn, amount === a.toString() && s.quickBtnActive]}>
                <Text style={[s.quickBtnText, amount === a.toString() && s.quickBtnTextActive]}>${a.toLocaleString()}</Text>
                <Text style={s.quickGain}>+${(a * 0.6).toLocaleString()}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>O ingresa otro monto</Text>
          <TextInput
            style={s.input}
            placeholder="Mínimo $50.000"
            placeholderTextColor="#999"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          {amount && parseFloat(amount) >= 50000 && (
            <View style={s.summaryCard}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Inversión:</Text>
                <Text style={s.summaryValue}>${parseFloat(amount).toLocaleString()}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Ganancia (60%):</Text>
                <Text style={[s.summaryValue, { color: "#4ADE80" }]}>${(parseFloat(amount) * 0.6).toLocaleString()}</Text>
              </View>
              <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={s.summaryLabel}>Total a recibir:</Text>
                <Text style={[s.summaryValue, { color: "#fbbf24", fontSize: 18 }]}>${(parseFloat(amount) * 1.6).toLocaleString()}</Text>
              </View>
            </View>
          )}

          <Pressable onPress={handleInvest} disabled={loading} style={[s.submitBtn, loading && s.submitBtnDisabled]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Invertir Ahora</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: "#DC2626", padding: 20, paddingTop: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: "#fff", fontSize: 16 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  headerSub: { fontSize: 16, color: "#fbbf24", marginTop: 4 },
  content: { padding: 20 },
  infoCard: { backgroundColor: "#16213e", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: "#fbbf24" },
  infoTitle: { fontSize: 14, color: "#9BA1A6", marginBottom: 4 },
  infoPct: { fontSize: 48, fontWeight: "bold", color: "#4ADE80" },
  infoSub: { fontSize: 16, color: "#fbbf24" },
  label: { fontSize: 14, fontWeight: "600", color: "#ECEDEE", marginBottom: 10, marginTop: 16 },
  quickAmounts: { gap: 8 },
  quickBtn: { backgroundColor: "#16213e", borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  quickBtnActive: { borderColor: "#DC2626", backgroundColor: "#DC262620" },
  quickBtnText: { fontSize: 16, color: "#ECEDEE", fontWeight: "600" },
  quickBtnTextActive: { color: "#fbbf24" },
  quickGain: { fontSize: 14, color: "#4ADE80" },
  input: { borderWidth: 1, borderColor: "#334155", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#ECEDEE", backgroundColor: "#16213e" },
  summaryCard: { backgroundColor: "#16213e", borderRadius: 14, padding: 16, marginTop: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#334155" },
  summaryLabel: { fontSize: 14, color: "#9BA1A6" },
  summaryValue: { fontSize: 14, color: "#ECEDEE", fontWeight: "600" },
  submitBtn: { backgroundColor: "#DC2626", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
});
