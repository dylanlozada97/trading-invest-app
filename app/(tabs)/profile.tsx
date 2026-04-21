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

  // Load user's recharges from server
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
    if (status === "pending") return { label: "Pendiente", color: "#F59E0B" };
    if (status === "approved") return { label: "Aprobada ✅", color: "#22C55E" };
    if (status === "rejected") return { label: "Rechazada ❌", color: "#EF4444" };
    return { label: status, color: "#9BA1A6" };
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
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={s.username}>{user.username}</Text>
          <Text style={s.email}>{user.email}</Text>
          <View style={s.levelBadge}>
            <Text style={s.levelText}>{level.name} - {level.percentage}%</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Mi Cuenta</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.rowLabel}>Saldo</Text>
              <Text style={[s.rowValue, { color: "#4ADE80" }]}>${parseFloat(user.balance).toLocaleString()}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Referidos</Text>
              <Text style={s.rowValue}>{user.totalReferrals}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Código de Referido</Text>
              <Text style={[s.rowValue, { color: "#DC2626" }]}>{user.referralCode}</Text>
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.rowLabel}>Nivel</Text>
              <Text style={[s.rowValue, { color: "#fbbf24" }]}>{level.name}</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Acciones</Text>
          <TouchableOpacity onPress={() => router.push("/recharge" as any)} style={s.menuItem} activeOpacity={0.7}>
            <Text style={s.menuIcon}>💳</Text>
            <Text style={s.menuText}>Recargar Saldo</Text>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/withdraw" as any)} style={s.menuItem} activeOpacity={0.7}>
            <Text style={s.menuIcon}>🏦</Text>
            <Text style={s.menuText}>Retirar Fondos</Text>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Historial de Recargas */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Mis Recargas ({recharges.length})</Text>
          {rechargesQuery.isLoading ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyText}>Cargando recargas...</Text>
            </View>
          ) : recharges.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyText}>No tienes recargas registradas</Text>
              <Text style={s.emptySubtext}>Tus recargas aparecerán aquí</Text>
            </View>
          ) : (
            [...recharges].reverse().map((r: any) => {
              const st = getStatusLabel(r.status);
              return (
                <View key={r.id} style={s.rechargeCard}>
                  <View style={s.rechargeHeader}>
                    <Text style={s.rechargeAmount}>${parseFloat(r.amount).toLocaleString()}</Text>
                    <View style={[s.badge, { backgroundColor: st.color + "20" }]}>
                      <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  <View style={s.rechargeRow}>
                    <Text style={s.rechargeLabel}>Referencia:</Text>
                    <Text style={s.rechargeValue}>{r.reference || "—"}</Text>
                  </View>
                  <View style={[s.rechargeRow, { borderBottomWidth: 0 }]}>
                    <Text style={s.rechargeLabel}>Fecha:</Text>
                    <Text style={s.rechargeValue}>{formatDate(r.createdAt)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={s.section}>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn} activeOpacity={0.7}>
            <Text style={s.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: "#DC2626", padding: 24, paddingTop: 16, paddingBottom: 30, alignItems: "center" },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#16213e", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#fbbf24" },
  username: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  email: { fontSize: 14, color: "#fbbf24", marginTop: 4 },
  levelBadge: { backgroundColor: "#fbbf2420", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 10 },
  levelText: { color: "#fbbf24", fontWeight: "600", fontSize: 13 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#ECEDEE", marginBottom: 12 },
  card: { backgroundColor: "#16213e", borderRadius: 14, padding: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#334155" },
  rowLabel: { fontSize: 15, color: "#9BA1A6" },
  rowValue: { fontSize: 15, color: "#ECEDEE", fontWeight: "600" },
  menuItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#16213e", borderRadius: 14, padding: 16, marginBottom: 10 },
  menuIcon: { fontSize: 22, marginRight: 12 },
  menuText: { flex: 1, fontSize: 16, color: "#ECEDEE", fontWeight: "500" },
  menuArrow: { fontSize: 22, color: "#9BA1A6" },
  emptyCard: { backgroundColor: "#16213e", borderRadius: 14, padding: 24, alignItems: "center" },
  emptyText: { color: "#9BA1A6", fontSize: 15 },
  emptySubtext: { color: "#687076", fontSize: 13, marginTop: 4 },
  rechargeCard: { backgroundColor: "#16213e", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#334155" },
  rechargeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  rechargeAmount: { fontSize: 20, fontWeight: "bold", color: "#ECEDEE" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  rechargeRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#334155" },
  rechargeLabel: { fontSize: 14, color: "#9BA1A6" },
  rechargeValue: { fontSize: 14, color: "#ECEDEE", fontWeight: "500" },
  logoutBtn: { backgroundColor: "#DC262620", borderWidth: 1, borderColor: "#DC2626", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 20 },
  logoutText: { color: "#DC2626", fontSize: 16, fontWeight: "bold" },
});
