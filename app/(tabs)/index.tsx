import { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { loadUser, AppUser, syncUserFromServer } from "@/lib/auth-store";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

const DAILY_RATE = 0.04;
const TOTAL_DAYS = 15;

function getDaysPassed(createdAt: string): number {
  const start = new Date(createdAt);
  const now = new Date();
  const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.min(Math.floor(diff), TOTAL_DAYS);
}

function getCurrentValue(amount: number, daysPassed: number): number {
  return amount * (1 + DAILY_RATE * daysPassed);
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const u = await loadUser();
    if (u) {
      setUser(u);
      const updated = await syncUserFromServer(u.id, u.username);
      if (updated) setUser(updated);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const investmentsQuery = trpc.investment.getInvestments.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id && user.id > 0 }
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    investmentsQuery.refetch();
    setRefreshing(false);
  }, [loadData, investmentsQuery]);

  if (!user) return null;

  const baseBalance = parseFloat(user.balance);
  const activeInvestments = (investmentsQuery.data || []).filter((inv: any) => inv.status === "active");

  const activeInvestmentsValue = activeInvestments.reduce((sum: number, inv: any) => {
    const amount = parseFloat(inv.amount);
    const daysPassed = getDaysPassed(inv.createdAt);
    return sum + getCurrentValue(amount, daysPassed);
  }, 0);

  const totalCapital = baseBalance + activeInvestmentsValue;
  const totalGainsToDate = activeInvestments.reduce((sum: number, inv: any) => {
    const amount = parseFloat(inv.amount);
    const daysPassed = getDaysPassed(inv.createdAt);
    return sum + (getCurrentValue(amount, daysPassed) - amount);
  }, 0);

  const actions = [
    { icon: "💳", label: "Recargar", route: "/recharge", color: "#DC2626" },
    { icon: "📈", label: "Invertir", route: "/invest", color: "#fbbf24" },
    { icon: "🏦", label: "Retirar", route: "/withdraw", color: "#4ADE80" },
    { icon: "🎁", label: "Referidos", route: "/referrals", color: "#60A5FA" },
  ];

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
      >
        {/* Header con gradiente rojo */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.greeting}>Hola, {user.username}</Text>
              <Text style={s.greetingSub}>Bienvenido de vuelta</Text>
            </View>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
            </View>
          </View>

          <View style={s.balanceCard}>
            <Text style={s.balanceLabel}>CAPITAL TOTAL</Text>
            <Text style={s.balanceAmount}>${totalCapital.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</Text>
            {totalGainsToDate > 0 && (
              <View style={s.gainsBadge}>
                <Text style={s.gainsBadgeText}>+${totalGainsToDate.toLocaleString("es-CO", { maximumFractionDigits: 0 })} ganancias acumuladas</Text>
              </View>
            )}
          </View>
        </View>

        {/* Desglose */}
        {activeInvestmentsValue > 0 && (
          <View style={s.breakdownRow}>
            <View style={s.breakdownCard}>
              <Text style={s.breakdownIcon}>💰</Text>
              <Text style={s.breakdownLabel}>Saldo Libre</Text>
              <Text style={s.breakdownValue}>${baseBalance.toLocaleString("es-CO")}</Text>
            </View>
            <View style={[s.breakdownCard, { borderColor: "#4ADE8030" }]}>
              <Text style={s.breakdownIcon}>📈</Text>
              <Text style={s.breakdownLabel}>En Inversiones</Text>
              <Text style={[s.breakdownValue, { color: "#4ADE80" }]}>
                ${activeInvestmentsValue.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={s.actionsContainer}>
          <Text style={s.sectionTitle}>Acciones Rápidas</Text>
          <View style={s.actionsRow}>
            {actions.map((a) => (
              <TouchableOpacity
                key={a.label}
                onPress={() => router.push(a.route as any)}
                style={s.actionBtn}
                activeOpacity={0.7}
              >
                <View style={[s.actionIconBg, { backgroundColor: a.color + "18" }]}>
                  <Text style={s.actionIcon}>{a.icon}</Text>
                </View>
                <Text style={s.actionText}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Inversiones activas */}
        {activeInvestments.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Inversiones Activas</Text>
            {activeInvestments.map((inv: any) => {
              const amount = parseFloat(inv.amount);
              const daysPassed = getDaysPassed(inv.createdAt);
              const currentValue = getCurrentValue(amount, daysPassed);
              const daysLeft = TOTAL_DAYS - daysPassed;
              const progress = (daysPassed / TOTAL_DAYS) * 100;
              return (
                <TouchableOpacity
                  key={inv.id}
                  style={s.invCard}
                  onPress={() => router.push("/(tabs)/investments" as any)}
                  activeOpacity={0.8}
                >
                  <View style={s.invHeader}>
                    <View>
                      <Text style={s.invAmountLabel}>Inversión</Text>
                      <Text style={s.invAmount}>${amount.toLocaleString("es-CO")}</Text>
                    </View>
                    <View style={s.invDayBadge}>
                      <Text style={s.invDayText}>Día {daysPassed}/{TOTAL_DAYS}</Text>
                    </View>
                  </View>
                  <View style={s.progressBg}>
                    <View style={[s.progressBar, { width: `${Math.max(progress, 3)}%` as any }]} />
                  </View>
                  <View style={s.invFooter}>
                    <View>
                      <Text style={s.invFooterLabel}>Valor Actual</Text>
                      <Text style={s.invFooterValue}>${currentValue.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={s.invFooterLabel}>{daysLeft === 0 ? "Estado" : "Restante"}</Text>
                      <Text style={[s.invFooterValue, daysLeft === 0 && { color: "#fbbf24" }]}>
                        {daysLeft === 0 ? "Listo" : `${daysLeft} días`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Información</Text>
          <View style={s.infoCard}>
            {[
              { label: "Rendimiento", value: "60% en 15 días", color: "#4ADE80" },
              { label: "Ganancia diaria", value: "4% por día", color: "#fbbf24" },
              { label: "Inversión Mínima", value: "$50.000", color: "#ECEDEE" },
              { label: "Tu Código", value: user.referralCode, color: "#DC2626" },
              { label: "Referidos", value: `${user.totalReferrals}`, color: "#60A5FA" },
            ].map((item, i, arr) => (
              <View key={item.label} style={[s.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={s.infoLabel}>{item.label}</Text>
                <Text style={[s.infoValue, { color: item.color }]}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>¿Cómo Funciona?</Text>
          <View style={s.stepsCard}>
            {[
              { num: "1", title: "Recarga tu saldo", desc: "Deposita a nuestra cuenta y sube el comprobante" },
              { num: "2", title: "Invierte", desc: "Elige el monto a invertir (mínimo $50.000)" },
              { num: "3", title: "Gana 4% diario", desc: "Tu capital crece cada día hasta completar 60%" },
              { num: "4", title: "Retira", desc: "Solicita el retiro a tu cuenta bancaria" },
            ].map((step, i, arr) => (
              <View key={step.num} style={[s.step, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={s.stepNum}><Text style={s.stepNumText}>{step.num}</Text></View>
                <View style={s.stepContent}>
                  <Text style={s.stepTitle}>{step.title}</Text>
                  <Text style={s.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  // Header
  header: { backgroundColor: "#DC2626", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  greetingSub: { fontSize: 13, color: "#ffffff90", marginTop: 2 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#ffffff25", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  balanceCard: { backgroundColor: "#b91c1c", borderRadius: 16, padding: 18 },
  balanceLabel: { fontSize: 11, fontWeight: "700", color: "#fbbf24", letterSpacing: 1.5, marginBottom: 4 },
  balanceAmount: { fontSize: 34, fontWeight: "bold", color: "#fff" },
  gainsBadge: { marginTop: 8, backgroundColor: "#4ADE8020", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, alignSelf: "flex-start" },
  gainsBadgeText: { fontSize: 12, color: "#4ADE80", fontWeight: "600" },

  // Breakdown
  breakdownRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: -12, gap: 10 },
  breakdownCard: { flex: 1, backgroundColor: "#16213e", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#1e2d4a", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  breakdownIcon: { fontSize: 20, marginBottom: 4 },
  breakdownLabel: { fontSize: 11, color: "#9BA1A6", marginBottom: 4, fontWeight: "500" },
  breakdownValue: { fontSize: 15, fontWeight: "bold", color: "#ECEDEE" },

  // Actions
  actionsContainer: { paddingHorizontal: 20, marginTop: 24 },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  actionBtn: { flex: 1, backgroundColor: "#16213e", borderRadius: 14, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: "#1e2d4a" },
  actionIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  actionIcon: { fontSize: 22 },
  actionText: { fontSize: 11, color: "#ECEDEE", fontWeight: "600" },

  // Section
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#ECEDEE", marginBottom: 12, letterSpacing: 0.3 },

  // Investment Card
  invCard: { backgroundColor: "#16213e", borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#1e2d4a" },
  invHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  invAmountLabel: { fontSize: 11, color: "#9BA1A6", marginBottom: 2 },
  invAmount: { fontSize: 18, fontWeight: "bold", color: "#ECEDEE" },
  invDayBadge: { backgroundColor: "#fbbf2418", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  invDayText: { fontSize: 12, color: "#fbbf24", fontWeight: "700" },
  progressBg: { height: 6, backgroundColor: "#0f1629", borderRadius: 4, overflow: "hidden", marginBottom: 12 },
  progressBar: { height: "100%", backgroundColor: "#4ADE80", borderRadius: 4 },
  invFooter: { flexDirection: "row", justifyContent: "space-between" },
  invFooterLabel: { fontSize: 11, color: "#9BA1A6", marginBottom: 2 },
  invFooterValue: { fontSize: 14, fontWeight: "bold", color: "#4ADE80" },

  // Info Card
  infoCard: { backgroundColor: "#16213e", borderRadius: 16, padding: 4, borderWidth: 1, borderColor: "#1e2d4a" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#1e2d4a" },
  infoLabel: { fontSize: 14, color: "#9BA1A6" },
  infoValue: { fontSize: 14, fontWeight: "700" },

  // Steps
  stepsCard: { backgroundColor: "#16213e", borderRadius: 16, padding: 4, borderWidth: 1, borderColor: "#1e2d4a" },
  step: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#1e2d4a" },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center", marginRight: 12, marginTop: 2 },
  stepNumText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: "700", color: "#ECEDEE", marginBottom: 2 },
  stepDesc: { fontSize: 12, color: "#9BA1A6", lineHeight: 18 },
});
