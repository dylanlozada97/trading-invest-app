import { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { loadUser, AppUser, syncUserFromServer } from "@/lib/auth-store";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const u = await loadUser();
    if (u) {
      setUser(u);
      // Sync with server to get latest balance
      const updated = await syncUserFromServer(u.id);
      if (updated) setUser(updated);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (!user) return null;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.greeting}>Hola, {user.username} 👋</Text>
          <Text style={s.balanceLabel}>Saldo Disponible</Text>
          <Text style={s.balanceAmount}>${parseFloat(user.balance).toLocaleString()}</Text>
        </View>

        {/* Quick Actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity onPress={() => router.push("/recharge" as any)} style={s.actionBtn} activeOpacity={0.7}>
            <Text style={s.actionIcon}>💳</Text>
            <Text style={s.actionText}>Recargar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/invest" as any)} style={s.actionBtn} activeOpacity={0.7}>
            <Text style={s.actionIcon}>📈</Text>
            <Text style={s.actionText}>Invertir</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/withdraw" as any)} style={s.actionBtn} activeOpacity={0.7}>
            <Text style={s.actionIcon}>🏦</Text>
            <Text style={s.actionText}>Retirar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/referrals" as any)} style={s.actionBtn} activeOpacity={0.7}>
            <Text style={s.actionIcon}>🎁</Text>
            <Text style={s.actionText}>Referidos</Text>
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Información</Text>

          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Rendimiento</Text>
              <Text style={s.infoValue}>60% en 15 días</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Inversión Mínima</Text>
              <Text style={s.infoValue}>$50.000</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Código de Referido</Text>
              <Text style={[s.infoValue, { color: "#DC2626" }]}>{user.referralCode}</Text>
            </View>
            <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={s.infoLabel}>Referidos Totales</Text>
              <Text style={s.infoValue}>{user.totalReferrals}</Text>
            </View>
          </View>
        </View>

        {/* How it works */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>¿Cómo Funciona?</Text>
          <View style={s.stepCard}>
            <View style={s.step}>
              <View style={s.stepNum}><Text style={s.stepNumText}>1</Text></View>
              <View style={s.stepContent}>
                <Text style={s.stepTitle}>Recarga tu saldo</Text>
                <Text style={s.stepDesc}>Deposita a nuestra cuenta y sube el comprobante</Text>
              </View>
            </View>
            <View style={s.step}>
              <View style={s.stepNum}><Text style={s.stepNumText}>2</Text></View>
              <View style={s.stepContent}>
                <Text style={s.stepTitle}>Invierte</Text>
                <Text style={s.stepDesc}>Elige el monto a invertir (mínimo $50.000)</Text>
              </View>
            </View>
            <View style={s.step}>
              <View style={s.stepNum}><Text style={s.stepNumText}>3</Text></View>
              <View style={s.stepContent}>
                <Text style={s.stepTitle}>Gana 60%</Text>
                <Text style={s.stepDesc}>En 15 días recibes tu inversión + 60% de ganancia</Text>
              </View>
            </View>
            <View style={[s.step, { borderBottomWidth: 0 }]}>
              <View style={s.stepNum}><Text style={s.stepNumText}>4</Text></View>
              <View style={s.stepContent}>
                <Text style={s.stepTitle}>Retira</Text>
                <Text style={s.stepDesc}>Solicita el retiro a tu cuenta bancaria</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: "#DC2626", padding: 24, paddingTop: 16, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  greeting: { fontSize: 18, color: "#fff", opacity: 0.9, marginBottom: 8 },
  balanceLabel: { fontSize: 14, color: "#fbbf24", marginBottom: 4 },
  balanceAmount: { fontSize: 36, fontWeight: "bold", color: "#fff" },
  actionsRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, marginTop: -20 },
  actionBtn: { backgroundColor: "#16213e", borderRadius: 16, padding: 16, alignItems: "center", width: 80, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionText: { fontSize: 11, color: "#ECEDEE", fontWeight: "600" },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#ECEDEE", marginBottom: 12 },
  infoCard: { backgroundColor: "#16213e", borderRadius: 16, padding: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#334155" },
  infoLabel: { fontSize: 14, color: "#9BA1A6" },
  infoValue: { fontSize: 14, color: "#ECEDEE", fontWeight: "600" },
  stepCard: { backgroundColor: "#16213e", borderRadius: 16, padding: 16 },
  step: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#334155" },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center", marginRight: 12, marginTop: 2 },
  stepNumText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: "600", color: "#ECEDEE", marginBottom: 2 },
  stepDesc: { fontSize: 13, color: "#9BA1A6" },
});
