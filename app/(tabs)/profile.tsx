import { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { showAlert } from "@/lib/alert";
import { ScreenContainer } from "@/components/screen-container";
import { loadUser, clearUser, AppUser, getReferralLevel, syncUserFromServer } from "@/lib/auth-store";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
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

  const rechargesQuery = trpc.investment.getRecharges.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id && user.id > 0 }
  );

  const queryClient = useQueryClient();

  const doLogout = async () => {
    await clearUser();
    queryClient.clear();
    router.replace("/welcome");
  };

  const handleLogout = () => {
    showAlert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar Sesión", style: "destructive", onPress: doLogout },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    rechargesQuery.refetch();
    setRefreshing(false);
  }, [loadData, rechargesQuery]);

  const level = user ? getReferralLevel(user.totalReferrals) : { name: "Bronze", percentage: 10 };

  const getStatusLabel = (status: string) => {
    if (status === "pending") return { label: "Pendiente", color: "#F59E0B", icon: "⏳" };
    if (status === "approved") return { label: "Aprobada", color: "#4ADE80", icon: "✅" };
    if (status === "rejected") return { label: "Rechazada", color: "#EF4444", icon: "❌" };
    return { label: status, color: "#9BA1A6", icon: "•" };
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const recharges = rechargesQuery.data ?? [];

  if (!user) return null;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
      >
        {/* Header con perfil */}
        <View style={s.header}>
          <View style={s.headerContent}>
            <View style={s.avatarOuter}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
              </View>
            </View>
            <Text style={s.username}>{user.username}</Text>
            <Text style={s.email}>{user.email}</Text>
            <View style={s.levelBadge}>
              <Text style={s.levelIcon}>⭐</Text>
              <Text style={s.levelText}>{level.name} - {level.percentage}%</Text>
            </View>
          </View>
        </View>

        {/* Balance y stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statIcon}>💰</Text>
            <Text style={[s.statValue, { color: "#4ADE80" }]}>${parseFloat(user.balance).toLocaleString("es-CO")}</Text>
            <Text style={s.statLabel}>Saldo</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>👥</Text>
            <Text style={s.statValue}>{user.totalReferrals}</Text>
            <Text style={s.statLabel}>Referidos</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>🎯</Text>
            <Text style={[s.statValue, { color: "#fbbf24" }]}>{level.name}</Text>
            <Text style={s.statLabel}>Nivel</Text>
          </View>
        </View>

        {/* Mi Cuenta */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Mi Cuenta</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.rowLabel}>Código de Referido</Text>
              <Text style={[s.rowValue, { color: "#DC2626", letterSpacing: 1 }]}>{user.referralCode}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Nivel de Comisión</Text>
              <Text style={[s.rowValue, { color: "#fbbf24" }]}>{level.percentage}%</Text>
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.rowLabel}>Referidos Totales</Text>
              <Text style={[s.rowValue, { color: "#60A5FA" }]}>{user.totalReferrals}</Text>
            </View>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Acciones</Text>
          <TouchableOpacity onPress={() => router.push("/recharge" as any)} style={s.menuItem} activeOpacity={0.7}>
            <View style={[s.menuIconBg, { backgroundColor: "#DC262618" }]}>
              <Text style={s.menuIcon}>💳</Text>
            </View>
            <View style={s.menuContent}>
              <Text style={s.menuText}>Recargar Saldo</Text>
              <Text style={s.menuSub}>Deposita y sube comprobante</Text>
            </View>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/invest" as any)} style={s.menuItem} activeOpacity={0.7}>
            <View style={[s.menuIconBg, { backgroundColor: "#fbbf2418" }]}>
              <Text style={s.menuIcon}>📈</Text>
            </View>
            <View style={s.menuContent}>
              <Text style={s.menuText}>Invertir</Text>
              <Text style={s.menuSub}>60% de rendimiento en 15 días</Text>
            </View>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/withdraw" as any)} style={s.menuItem} activeOpacity={0.7}>
            <View style={[s.menuIconBg, { backgroundColor: "#4ADE8018" }]}>
              <Text style={s.menuIcon}>🏦</Text>
            </View>
            <View style={s.menuContent}>
              <Text style={s.menuText}>Retirar Fondos</Text>
              <Text style={s.menuSub}>Solicita retiro a tu cuenta</Text>
            </View>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Historial de Recargas */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Mis Recargas</Text>
            <View style={s.countBadge}>
              <Text style={s.countBadgeText}>{recharges.length}</Text>
            </View>
          </View>
          {rechargesQuery.isLoading ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyText}>Cargando recargas...</Text>
            </View>
          ) : recharges.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyText}>No tienes recargas registradas</Text>
              <Text style={s.emptySubtext}>Tus recargas aparecerán aquí</Text>
            </View>
          ) : (
            [...recharges].reverse().map((r: any) => {
              const st = getStatusLabel(r.status);
              return (
                <View key={r.id} style={s.rechargeCard}>
                  <View style={s.rechargeHeader}>
                    <View style={s.rechargeLeft}>
                      <Text style={s.rechargeAmount}>${parseFloat(r.amount).toLocaleString("es-CO")}</Text>
                      <Text style={s.rechargeDate}>{formatDate(r.createdAt)}</Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: st.color + "18" }]}>
                      <Text style={s.badgeIcon}>{st.icon}</Text>
                      <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  {r.reference && (
                    <View style={s.rechargeRef}>
                      <Text style={s.rechargeRefLabel}>Ref:</Text>
                      <Text style={s.rechargeRefValue}>{r.reference}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Cerrar Sesión */}
        <View style={s.section}>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn} activeOpacity={0.7}>
            <Text style={s.logoutIcon}>🚪</Text>
            <Text style={s.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  // Header
  header: {
    backgroundColor: "#DC2626",
    paddingTop: 12,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: { alignItems: "center", paddingHorizontal: 20 },
  avatarOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#ffffff20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#16213e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fbbf24",
  },
  avatarText: { fontSize: 30, fontWeight: "bold", color: "#fbbf24" },
  username: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  email: { fontSize: 14, color: "#ffffff90", marginTop: 4 },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fbbf2420",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    gap: 6,
  },
  levelIcon: { fontSize: 14 },
  levelText: { color: "#fbbf24", fontWeight: "700", fontSize: 13 },

  // Stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: -16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e2d4a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#ECEDEE", marginBottom: 2 },
  statLabel: { fontSize: 11, color: "#9BA1A6", fontWeight: "500" },

  // Section
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#ECEDEE", marginBottom: 12 },
  countBadge: {
    backgroundColor: "#DC262630",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 12,
  },
  countBadgeText: { fontSize: 12, fontWeight: "700", color: "#DC2626" },

  // Card
  card: { backgroundColor: "#16213e", borderRadius: 16, padding: 4, borderWidth: 1, borderColor: "#1e2d4a" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d4a",
  },
  rowLabel: { fontSize: 14, color: "#9BA1A6" },
  rowValue: { fontSize: 14, color: "#ECEDEE", fontWeight: "700" },

  // Menu Items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1e2d4a",
  },
  menuIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuIcon: { fontSize: 20 },
  menuContent: { flex: 1 },
  menuText: { fontSize: 15, color: "#ECEDEE", fontWeight: "600" },
  menuSub: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  menuArrow: { fontSize: 24, color: "#9BA1A6", fontWeight: "300" },

  // Recharge Cards
  emptyCard: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e2d4a",
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { color: "#9BA1A6", fontSize: 15, fontWeight: "500" },
  emptySubtext: { color: "#687076", fontSize: 13, marginTop: 4 },
  rechargeCard: {
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1e2d4a",
  },
  rechargeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rechargeLeft: {},
  rechargeAmount: { fontSize: 18, fontWeight: "bold", color: "#ECEDEE" },
  rechargeDate: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  badgeIcon: { fontSize: 12 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  rechargeRef: {
    flexDirection: "row",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1e2d4a",
  },
  rechargeRefLabel: { fontSize: 13, color: "#9BA1A6", marginRight: 6 },
  rechargeRefValue: { fontSize: 13, color: "#ECEDEE", fontWeight: "500" },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC262612",
    borderWidth: 1,
    borderColor: "#DC262640",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  logoutIcon: { fontSize: 18 },
  logoutText: { color: "#DC2626", fontSize: 16, fontWeight: "bold" },
});
