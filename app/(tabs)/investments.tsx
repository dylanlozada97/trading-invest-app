import { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { loadUser, saveUser, AppUser, syncUserFromServer } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";
import { showAlert } from "@/lib/alert";
import { useRouter } from "expo-router";

// Ganancia diaria: 60% en 15 días = 4% diario
const DAILY_RATE = 0.04;
const TOTAL_DAYS = 15;

function getDaysPassed(createdAt: string): number {
  const start = new Date(createdAt);
  const now = new Date();
  const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.min(Math.floor(diff), TOTAL_DAYS);
}

function getCurrentValue(amount: number, daysPassed: number): number {
  // Capital + ganancia acumulada hasta hoy
  return amount * (1 + DAILY_RATE * daysPassed);
}

function getDailyGain(amount: number): number {
  return amount * DAILY_RATE;
}

function getPaymentDate(createdAt: string): string {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + TOTAL_DAYS);
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function getDaysLeft(createdAt: string): number {
  const payDate = new Date(createdAt);
  payDate.setDate(payDate.getDate() + TOTAL_DAYS);
  const now = new Date();
  const diff = Math.ceil((payDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// Barra de progreso diaria
function ProgressBar({ daysPassed }: { daysPassed: number }) {
  const progress = (daysPassed / TOTAL_DAYS) * 100;
  return (
    <View style={pb.container}>
      <View style={[pb.bar, { width: `${progress}%` as any }]} />
      <View style={pb.labels}>
        {Array.from({ length: TOTAL_DAYS + 1 }, (_, i) => (
          <View key={i} style={[pb.tick, i <= daysPassed && pb.tickDone]} />
        ))}
      </View>
    </View>
  );
}

const pb = StyleSheet.create({
  container: { height: 10, backgroundColor: "#1e2022", borderRadius: 10, overflow: "hidden", marginVertical: 8, position: "relative" },
  bar: { height: "100%", backgroundColor: "#4ADE80", borderRadius: 10 },
  labels: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tick: { width: 2, height: 10, backgroundColor: "#334155" },
  tickDone: { backgroundColor: "#22C55E" },
});

// Tarjeta de inversión con crecimiento diario
function InvestmentCard({ inv, onClaim }: { inv: any; onClaim: (id: number) => void }) {
  const amount = parseFloat(inv.amount);
  const daysPassed = getDaysPassed(inv.createdAt);
  const currentValue = getCurrentValue(amount, daysPassed);
  const dailyGain = getDailyGain(amount);
  const daysLeft = getDaysLeft(inv.createdAt);
  const totalReturn = amount * 1.6;
  const isCompleted = daysPassed >= TOTAL_DAYS;

  return (
    <View style={[s.invCard, isCompleted && s.invCardCompleted]}>
      {/* Header */}
      <View style={s.invHeader}>
        <View>
          <Text style={s.invLabel}>Capital invertido</Text>
          <Text style={s.invAmount}>${amount.toLocaleString("es-CO")}</Text>
        </View>
        <View style={[s.badge, isCompleted ? s.badgeCompleted : s.badgeActive]}>
          <Text style={[s.badgeText, isCompleted && s.badgeTextCompleted]}>
            {isCompleted ? "✅ Listo" : `Día ${daysPassed}/${TOTAL_DAYS}`}
          </Text>
        </View>
      </View>

      {/* Valor actual */}
      <View style={s.currentValueBox}>
        <Text style={s.currentValueLabel}>Valor actual hoy</Text>
        <Text style={s.currentValue}>${currentValue.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</Text>
        <Text style={s.gainedSoFar}>
          +${(currentValue - amount).toLocaleString("es-CO", { maximumFractionDigits: 0 })} ganados
        </Text>
      </View>

      {/* Barra de progreso */}
      <ProgressBar daysPassed={daysPassed} />
      <View style={s.progressLabels}>
        <Text style={s.progressLabelText}>Día 0</Text>
        <Text style={s.progressLabelText}>Día {TOTAL_DAYS}</Text>
      </View>

      {/* Detalles */}
      <View style={s.detailsGrid}>
        <View style={s.detailItem}>
          <Text style={s.detailLabel}>Ganancia diaria</Text>
          <Text style={s.detailValue}>+${dailyGain.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</Text>
        </View>
        <View style={s.detailItem}>
          <Text style={s.detailLabel}>Total al vencer</Text>
          <Text style={[s.detailValue, { color: "#fbbf24" }]}>${totalReturn.toLocaleString("es-CO")}</Text>
        </View>
        <View style={s.detailItem}>
          <Text style={s.detailLabel}>Días restantes</Text>
          <Text style={[s.detailValue, { color: isCompleted ? "#4ADE80" : "#DC2626" }]}>
            {isCompleted ? "¡Completado!" : `${daysLeft} días`}
          </Text>
        </View>
        <View style={s.detailItem}>
          <Text style={s.detailLabel}>Fecha de pago</Text>
          <Text style={s.detailValue}>{getPaymentDate(inv.createdAt)}</Text>
        </View>
      </View>

      {/* Línea de crecimiento día a día */}
      <Text style={s.growthTitle}>Crecimiento día a día</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.growthScroll}>
        <View style={s.growthRow}>
          {Array.from({ length: TOTAL_DAYS + 1 }, (_, day) => {
            const val = getCurrentValue(amount, day);
            const isPast = day <= daysPassed;
            const isToday = day === daysPassed;
            return (
              <View key={day} style={[s.dayBox, isPast && s.dayBoxPast, isToday && s.dayBoxToday]}>
                <Text style={[s.dayNum, isToday && s.dayNumToday]}>D{day}</Text>
                <Text style={[s.dayVal, isPast && s.dayValPast, isToday && s.dayValToday]}>
                  ${(val / 1000).toFixed(0)}k
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Botón reclamar si está completo */}
      {isCompleted && inv.status === "active" && (
        <TouchableOpacity style={s.claimBtn} onPress={() => onClaim(inv.id)} activeOpacity={0.8}>
          <Text style={s.claimBtnText}>🎉 Reclamar ${totalReturn.toLocaleString("es-CO")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function InvestmentsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const u = await loadUser();
    if (u) {
      setUser(u);
      const synced = await syncUserFromServer(u.id, u.username);
      if (synced) setUser(synced);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const investmentsQuery = trpc.investment.getInvestments.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id && user.id > 0 }
  );

  const claimMutation = trpc.investment.claimInvestment.useMutation();

  useEffect(() => {
    if (investmentsQuery.data) {
      setInvestments(investmentsQuery.data);
    }
  }, [investmentsQuery.data]);

  const handleClaim = async (investmentId: number) => {
    if (!user) return;
    showAlert(
      "Reclamar Inversión",
      "¿Deseas reclamar tu inversión y ganancias?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reclamar",
          onPress: async () => {
            try {
              const result = await claimMutation.mutateAsync({ investmentId, userId: user.id });
              const synced = await syncUserFromServer(user.id, user.username);
              if (synced) {
                setUser(synced);
                await saveUser(synced);
              }
              investmentsQuery.refetch();
              showAlert("¡Ganancia Acreditada! 🎉", `Se acreditaron $${parseFloat((result as any).gain).toLocaleString("es-CO")} a tu saldo.`);
            } catch (error: any) {
              showAlert("Error", error?.message || "Error al reclamar");
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    investmentsQuery.refetch();
    setRefreshing(false);
  }, [loadData, investmentsQuery]);

  // Calcular saldo total incluyendo ganancias diarias de inversiones activas
  const activeInvestmentsValue = investments
    .filter(inv => inv.status === "active")
    .reduce((sum, inv) => {
      const amount = parseFloat(inv.amount);
      const daysPassed = getDaysPassed(inv.createdAt);
      return sum + getCurrentValue(amount, daysPassed);
    }, 0);

  const baseBalance = user ? parseFloat(user.balance) : 0;
  const totalWithGains = baseBalance + activeInvestmentsValue;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Mis Inversiones</Text>
          <View style={s.balanceRow}>
            <View style={s.balanceItem}>
              <Text style={s.balanceLabel}>Saldo disponible</Text>
              <Text style={s.balanceValue}>${baseBalance.toLocaleString("es-CO")}</Text>
            </View>
            {activeInvestmentsValue > 0 && (
              <View style={s.balanceItem}>
                <Text style={s.balanceLabel}>Capital en inversiones</Text>
                <Text style={[s.balanceValue, { color: "#4ADE80" }]}>${activeInvestmentsValue.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Botón nueva inversión */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <TouchableOpacity style={s.newInvestBtn} onPress={() => router.push("/invest")} activeOpacity={0.8}>
            <Text style={s.newInvestBtnText}>+ Nueva Inversión</Text>
          </TouchableOpacity>
        </View>

        {/* Inversiones activas */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            {investments.length === 0 ? "Sin inversiones activas" : `${investments.filter(i => i.status === "active").length} inversión(es) activa(s)`}
          </Text>

          {investments.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>📈</Text>
              <Text style={s.emptyText}>No tienes inversiones activas</Text>
              <Text style={s.emptySubText}>Invierte y gana 60% en 15 días</Text>
            </View>
          ) : (
            investments
              .filter(inv => inv.status === "active")
              .map((inv: any) => (
                <InvestmentCard key={inv.id} inv={inv} onClaim={handleClaim} />
              ))
          )}

          {/* Inversiones reclamadas */}
          {investments.filter(inv => inv.status === "claimed").length > 0 && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 20 }]}>Historial</Text>
              {investments
                .filter(inv => inv.status === "claimed")
                .map((inv: any) => (
                  <View key={inv.id} style={s.claimedCard}>
                    <Text style={s.claimedAmount}>${parseFloat(inv.amount).toLocaleString("es-CO")}</Text>
                    <Text style={s.claimedGain}>+${(parseFloat(inv.amount) * 0.6).toLocaleString("es-CO")} ganados</Text>
                    <Text style={s.claimedDate}>{getPaymentDate(inv.createdAt)}</Text>
                  </View>
                ))}
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: "#DC2626", padding: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 12 },
  balanceRow: { flexDirection: "row", gap: 16 },
  balanceItem: { flex: 1, backgroundColor: "#00000030", borderRadius: 10, padding: 10 },
  balanceLabel: { fontSize: 11, color: "#fbbf24", marginBottom: 2 },
  balanceValue: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  newInvestBtn: { backgroundColor: "#DC2626", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  newInvestBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#ECEDEE", marginBottom: 10 },
  emptyCard: { backgroundColor: "#16213e", borderRadius: 16, padding: 40, alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: "#ECEDEE", fontSize: 16, fontWeight: "600" },
  emptySubText: { color: "#9BA1A6", fontSize: 13, marginTop: 4 },
  invCard: { backgroundColor: "#16213e", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#334155" },
  invCardCompleted: { borderColor: "#4ADE80", borderWidth: 2 },
  invHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  invLabel: { fontSize: 11, color: "#9BA1A6", marginBottom: 2 },
  invAmount: { fontSize: 22, fontWeight: "bold", color: "#ECEDEE" },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeActive: { backgroundColor: "#DC262620" },
  badgeCompleted: { backgroundColor: "#4ADE8020" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#fbbf24" },
  badgeTextCompleted: { color: "#4ADE80" },
  currentValueBox: { backgroundColor: "#0a0f1e", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 8 },
  currentValueLabel: { fontSize: 12, color: "#9BA1A6", marginBottom: 4 },
  currentValue: { fontSize: 28, fontWeight: "bold", color: "#4ADE80" },
  gainedSoFar: { fontSize: 13, color: "#22C55E", marginTop: 2 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressLabelText: { fontSize: 11, color: "#9BA1A6" },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  detailItem: { flex: 1, minWidth: "45%", backgroundColor: "#0a0f1e", borderRadius: 8, padding: 8 },
  detailLabel: { fontSize: 11, color: "#9BA1A6", marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#ECEDEE" },
  growthTitle: { fontSize: 12, color: "#9BA1A6", marginBottom: 6 },
  growthScroll: { marginBottom: 8 },
  growthRow: { flexDirection: "row", gap: 4 },
  dayBox: { width: 44, backgroundColor: "#0a0f1e", borderRadius: 8, padding: 6, alignItems: "center", borderWidth: 1, borderColor: "#1e2022" },
  dayBoxPast: { borderColor: "#22C55E40" },
  dayBoxToday: { borderColor: "#4ADE80", backgroundColor: "#4ADE8015" },
  dayNum: { fontSize: 10, color: "#9BA1A6", marginBottom: 2 },
  dayNumToday: { color: "#4ADE80", fontWeight: "bold" },
  dayVal: { fontSize: 10, color: "#687076" },
  dayValPast: { color: "#22C55E" },
  dayValToday: { color: "#4ADE80", fontWeight: "bold" },
  claimBtn: { backgroundColor: "#4ADE80", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  claimBtnText: { color: "#0a0f1e", fontSize: 16, fontWeight: "bold" },
  claimedCard: { backgroundColor: "#16213e", borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#334155", opacity: 0.7 },
  claimedAmount: { fontSize: 15, fontWeight: "bold", color: "#9BA1A6" },
  claimedGain: { fontSize: 13, color: "#4ADE80" },
  claimedDate: { fontSize: 12, color: "#687076" },
});
