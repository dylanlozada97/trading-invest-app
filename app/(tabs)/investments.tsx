import { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, StyleSheet, FlatList, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { loadUser, saveUser, AppUser, syncUserFromServer } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";
import { Pressable } from "react-native";
import { showAlert } from "@/lib/alert";

export default function InvestmentsScreen() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const u = await loadUser();
    if (u) {
      setUser(u);
      // Sync with server to get latest balance and real ID
      const synced = await syncUserFromServer(u.id, u.username);
      if (synced) setUser(synced);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const investmentsQuery = trpc.investment.getInvestments.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  const createInvestmentMutation = trpc.investment.createInvestment.useMutation();

  useEffect(() => {
    if (investmentsQuery.data) {
      setInvestments(investmentsQuery.data);
    }
  }, [investmentsQuery.data]);

  const handleInvest = async (amount: number) => {
    if (!user) return;
    const balance = parseFloat(user.balance);
    if (balance < amount) {
      showAlert("Saldo Insuficiente", "No tienes suficiente saldo. Recarga primero.");
      return;
    }

    showAlert(
      "Confirmar Inversión",
      `¿Deseas invertir $${amount.toLocaleString()}?\n\nGanarás $${(amount * 0.6).toLocaleString()} en 15 días.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Invertir",
          onPress: async () => {
            try {
              const result = await createInvestmentMutation.mutateAsync({
                userId: user.id,
                amount: amount.toString(),
              });

              const newBalance = (result as any).newBalance ?? (balance - amount).toString();
              const updatedUser = { ...user, balance: newBalance };
              await saveUser(updatedUser);
              setUser(updatedUser);
              investmentsQuery.refetch();
              showAlert("Inversión Exitosa", `Has invertido $${amount.toLocaleString()}. Recibirás $${(amount * 1.6).toLocaleString()} en 15 días.`);
            } catch (error: any) {
              showAlert("Error", error?.message || "Error al invertir");
            }
          },
        },
      ]
    );
  };

  const getPaymentDate = (createdAt: string) => {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 15);
    return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getDaysLeft = (createdAt: string) => {
    const payDate = new Date(createdAt);
    payDate.setDate(payDate.getDate() + 15);
    const now = new Date();
    const diff = Math.ceil((payDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    investmentsQuery.refetch();
    setRefreshing(false);
  }, [loadData, investmentsQuery]);

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
      >
        <View style={s.header}>
          <Text style={s.headerTitle}>Inversiones</Text>
          <Text style={s.headerSub}>Saldo: ${user ? parseFloat(user.balance).toLocaleString() : "0"}</Text>
        </View>

        {/* Investment Options */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Invertir Ahora</Text>
          <View style={s.optionsGrid}>
            {[50000, 100000, 200000, 500000, 1000000].map((amount) => (
              <Pressable key={amount} onPress={() => handleInvest(amount)} style={s.optionCard}>
                <Text style={s.optionAmount}>${amount.toLocaleString()}</Text>
                <Text style={s.optionGain}>Ganas: ${(amount * 0.6).toLocaleString()}</Text>
                <Text style={s.optionTotal}>Total: ${(amount * 1.6).toLocaleString()}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Active Investments */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Mis Inversiones ({investments.length})</Text>
          {investments.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyText}>No tienes inversiones activas</Text>
            </View>
          ) : (
            investments.map((inv: any) => (
              <View key={inv.id} style={s.invCard}>
                <View style={s.invHeader}>
                  <Text style={s.invAmount}>${parseFloat(inv.amount).toLocaleString()}</Text>
                  <View style={[s.badge, inv.status === "active" ? s.badgeActive : inv.status === "completed" ? s.badgeCompleted : s.badgeClaimed]}>
                    <Text style={s.badgeText}>{inv.status === "active" ? "Activa" : inv.status === "completed" ? "Completada" : "Reclamada"}</Text>
                  </View>
                </View>
                <View style={s.invRow}>
                  <Text style={s.invLabel}>Ganancia:</Text>
                  <Text style={s.invGain}>${(parseFloat(inv.amount) * 0.6).toLocaleString()}</Text>
                </View>
                <View style={s.invRow}>
                  <Text style={s.invLabel}>Fecha de pago:</Text>
                  <Text style={s.invDate}>{getPaymentDate(inv.createdAt)}</Text>
                </View>
                <View style={s.invRow}>
                  <Text style={s.invLabel}>Días restantes:</Text>
                  <Text style={s.invDays}>{getDaysLeft(inv.createdAt)} días</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: "#DC2626", padding: 24, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  headerSub: { fontSize: 16, color: "#fbbf24", marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#ECEDEE", marginBottom: 12 },
  optionsGrid: { gap: 10 },
  optionCard: { backgroundColor: "#16213e", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#334155" },
  optionAmount: { fontSize: 20, fontWeight: "bold", color: "#fbbf24" },
  optionGain: { fontSize: 14, color: "#4ADE80", marginTop: 4 },
  optionTotal: { fontSize: 13, color: "#9BA1A6", marginTop: 2 },
  emptyCard: { backgroundColor: "#16213e", borderRadius: 14, padding: 30, alignItems: "center" },
  emptyText: { color: "#9BA1A6", fontSize: 15 },
  invCard: { backgroundColor: "#16213e", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#334155" },
  invHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  invAmount: { fontSize: 20, fontWeight: "bold", color: "#ECEDEE" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeActive: { backgroundColor: "#22C55E20" },
  badgeCompleted: { backgroundColor: "#F59E0B20" },
  badgeClaimed: { backgroundColor: "#9BA1A620" },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#4ADE80" },
  invRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  invLabel: { fontSize: 14, color: "#9BA1A6" },
  invGain: { fontSize: 14, color: "#4ADE80", fontWeight: "600" },
  invDate: { fontSize: 14, color: "#fbbf24", fontWeight: "600" },
  invDays: { fontSize: 14, color: "#DC2626", fontWeight: "600" },
});
