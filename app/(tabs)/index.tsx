import { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { loadUser, AppUser, syncUserFromServer } from "@/lib/auth-store";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

const DAILY_RATE = 0.04; // 4% diario = 60% en 15 días
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

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Calcular valor actual de inversiones activas (capital + ganancias diarias acumuladas)
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

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
      >
        {/* Header con saldo total */}
        <View style={s.header}>
          <Text style={s.greeting}>Hola, {user.username} 👋</Text>
          <Text style={s.balanceLabel}>Capital Total</Text>
          <Text style={s.balanceAmount}>${totalCapital.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</Text>
          {totalGainsToDate > 0 && (
            <View style={s.gainsBadge}>
              <Text style={s.gainsBadgeText}>+${totalGainsToDate.toLocaleString("es-CO", { maximumFractionDigits: 0 })} en ganancias hoy</Text>
            </View>
          )}
        </View>

        {/* Desglose de saldo */}
        {activeInvestmentsValue > 0 && (
          <View style={s.balanceBreakdown}>
            <View style={s.breakdownItem}>
              <Text style={s.breakdownLabel}>💰 Saldo libre</Text>
              <Text style={s.breakdownValue}>${baseBalance.toLocaleString("es-CO")}</Text>
            </View>
            <View style={s.breakdownDivider} />
            <View style={s.breakdownItem}>
              <Text style={s.breakdownLabel}>📈 En inversiones</Text>
              <Text style={[s.breakdownValue, { color: "#4ADE80" }]}>
                ${activeInvestmentsValue.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
        )}

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

        {/* Inversiones activas en home */}
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
                  style={s.activeInvCard}
                  onPress={() => router.push("/(tabs)/investments" as any)}
                  activeOpacity={0.8}
                >
                  <View style={s.activeInvHeader}>
                    <Text style={s.activeInvAmount}>${amount.toLocaleString("es-CO")}</Text>
                    <Text style={s.activeInvDay}>Día {daysPassed}/{TOTAL_DAYS}</Text>
                  </View>
                  {/* Mini barra de progreso */}
                  <View style={s.miniProgressBg}>
                    <View style={[s.miniProgressBar, { width: `${progress}%` as any }]} />
                  </View>
                  <View style={s.activeInvFooter}>
                    <Text style={s.activeInvCurrent}>
                      Hoy: <Text style={{ color: "#4ADE80", fontWeight: "bold" }}>
                        ${currentValue.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                      </Text>
                    </Text>
                    <Text style={s.activeInvDaysLeft}>
                      {daysLeft === 0 ? "¡Listo para reclamar! 🎉" : `${daysLeft} días restantes`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Info Cards */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Información</Text>
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Rendimiento</Text>
              <Text style={s.infoValue}>60% en 15 días</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Ganancia diaria</Text>
              <Text style={s.infoValue}>4% por día</Text>
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
                <Text style={s.stepTitle}>Gana 4% diario</Text>
                <Text style={s.stepDesc}>Cada día tu capital crece un 4% hasta completar 60% en 15 días</Text>
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
  gainsBadge: { marginTop: 8, backgroundColor: "#4ADE8030", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  gainsBadgeText: { fontSize: 13, color: "#4ADE80", fontWeight: "600" },
  balanceBreakdown: { flexDirection: "row", backgroundColor: "#16213e", marginHorizontal: 16, marginTop: -16, borderRadius: 14, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  breakdownItem: { flex: 1, alignItems: "center" },
  breakdownDivider: { width: 1, backgroundColor: "#334155", marginVertical: 4 },
  breakdownLabel: { fontSize: 12, color: "#9BA1A6", marginBottom: 4 },
  breakdownValue: { fontSize: 15, fontWeight: "bold", color: "#ECEDEE" },
  actionsRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, marginTop: 20 },
  actionBtn: { backgroundColor: "#16213e", borderRadius: 16, padding: 16, alignItems: "center", width: 80, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionText: { fontSize: 11, color: "#ECEDEE", fontWeight: "600" },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#ECEDEE", marginBottom: 12 },
  activeInvCard: { backgroundColor: "#16213e", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#4ADE8040" },
  activeInvHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  activeInvAmount: { fontSize: 16, fontWeight: "bold", color: "#ECEDEE" },
  activeInvDay: { fontSize: 12, color: "#fbbf24", fontWeight: "600" },
  miniProgressBg: { height: 6, backgroundColor: "#0a0f1e", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  miniProgressBar: { height: "100%", backgroundColor: "#4ADE80", borderRadius: 4 },
  activeInvFooter: { flexDirection: "row", justifyContent: "space-between" },
  activeInvCurrent: { fontSize: 13, color: "#9BA1A6" },
  activeInvDaysLeft: { fontSize: 12, color: "#9BA1A6" },
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
