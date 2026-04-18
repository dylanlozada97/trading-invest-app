import { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, Alert, StyleSheet, Share, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { loadUser, AppUser, getReferralLevel, syncUserFromServer } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";
import { Pressable } from "react-native";
import * as Clipboard from "expo-clipboard" ;

export default function ReferralsScreen() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
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

  const commissionsQuery = trpc.investment.getCommissions.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  useEffect(() => {
    if (commissionsQuery.data) {
      setCommissions(commissionsQuery.data);
    }
  }, [commissionsQuery.data]);

  const handleShare = async () => {
    if (!user) return;
    try {
      await Share.share({
        message: `¡Únete a Inversiones China y gana 60% en 15 días! Usa mi código de referido: ${user.referralCode}`,
      });
    } catch (error) {}
  };

  const handleCopy = async () => {
    if (!user) return;
    try {
      await Clipboard.setStringAsync(user.referralCode);
      Alert.alert("Copiado", "Código copiado al portapapeles");
    } catch {
      Alert.alert("Info", `Tu código: ${user.referralCode}`);
    }
  };

  const level = user ? getReferralLevel(user.totalReferrals) : { name: "Bronze", percentage: 10 };
  const totalEarned = commissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    commissionsQuery.refetch();
    setRefreshing(false);
  }, [loadData, commissionsQuery]);

  const levels = [
    { name: "Bronce", min: 0, pct: 5 },
    { name: "Bronze", min: 5, pct: 10 },
    { name: "Silver", min: 10, pct: 15 },
    { name: "Gold", min: 15, pct: 20 },
    { name: "Platinum", min: 20, pct: 25 },
    { name: "Diamond", min: 25, pct: 30 },
  ];

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
      >
        <View style={s.header}>
          <Text style={s.headerTitle}>Programa de Referidos</Text>
          <Text style={s.headerSub}>Invita amigos y gana comisiones</Text>
        </View>

        {/* Referral Code Card */}
        <View style={s.section}>
          <View style={s.codeCard}>
            <Text style={s.codeLabel}>Tu Código de Referido</Text>
            <Text style={s.codeValue}>{user?.referralCode || "---"}</Text>
            <View style={s.codeActions}>
              <Pressable onPress={handleCopy} style={s.codeBtn}>
                <Text style={s.codeBtnText}>📋 Copiar</Text>
              </Pressable>
              <Pressable onPress={handleShare} style={[s.codeBtn, { backgroundColor: "#22C55E" }]}>
                <Text style={s.codeBtnText}>📤 Compartir</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.section}>
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statValue}>{user?.totalReferrals || 0}</Text>
              <Text style={s.statLabel}>Referidos</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>{level.name}</Text>
              <Text style={s.statLabel}>Nivel ({level.percentage}%)</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValue, { color: "#4ADE80" }]}>${totalEarned.toLocaleString()}</Text>
              <Text style={s.statLabel}>Ganado</Text>
            </View>
          </View>
        </View>

        {/* Levels */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Niveles de Comisión</Text>
          <View style={s.levelsCard}>
            {levels.map((l) => (
              <View key={l.name} style={[s.levelRow, l.name === level.name && s.levelRowActive]}>
                <Text style={[s.levelName, l.name === level.name && s.levelNameActive]}>{l.name}</Text>
                <Text style={s.levelReq}>{l.min}+ referidos</Text>
                <Text style={[s.levelPct, l.name === level.name && s.levelPctActive]}>{l.pct}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Commission History */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Historial de Comisiones</Text>
          {commissions.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyText}>Aún no tienes comisiones</Text>
              <Text style={s.emptyHint}>Comparte tu código para empezar a ganar</Text>
            </View>
          ) : (
            commissions.map((c: any) => (
              <View key={c.id} style={s.commCard}>
                <View style={s.commRow}>
                  <Text style={s.commLabel}>Monto:</Text>
                  <Text style={s.commValue}>${parseFloat(c.amount).toLocaleString()}</Text>
                </View>
                <View style={s.commRow}>
                  <Text style={s.commLabel}>Porcentaje:</Text>
                  <Text style={s.commPct}>{c.percentage}%</Text>
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
  headerSub: { fontSize: 14, color: "#fbbf24", marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#ECEDEE", marginBottom: 12 },
  codeCard: { backgroundColor: "#16213e", borderRadius: 16, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#DC2626" },
  codeLabel: { fontSize: 14, color: "#9BA1A6", marginBottom: 8 },
  codeValue: { fontSize: 28, fontWeight: "bold", color: "#fbbf24", letterSpacing: 2, marginBottom: 16 },
  codeActions: { flexDirection: "row", gap: 12 },
  codeBtn: { backgroundColor: "#DC2626", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  codeBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: "#16213e", borderRadius: 14, padding: 16, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#ECEDEE", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#9BA1A6" },
  levelsCard: { backgroundColor: "#16213e", borderRadius: 14, overflow: "hidden" },
  levelRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#334155" },
  levelRowActive: { backgroundColor: "#DC262620" },
  levelName: { flex: 1, fontSize: 15, color: "#ECEDEE", fontWeight: "600" },
  levelNameActive: { color: "#fbbf24" },
  levelReq: { fontSize: 13, color: "#9BA1A6", marginRight: 16 },
  levelPct: { fontSize: 16, fontWeight: "bold", color: "#9BA1A6" },
  levelPctActive: { color: "#4ADE80" },
  emptyCard: { backgroundColor: "#16213e", borderRadius: 14, padding: 30, alignItems: "center" },
  emptyText: { color: "#9BA1A6", fontSize: 15, marginBottom: 4 },
  emptyHint: { color: "#687076", fontSize: 13 },
  commCard: { backgroundColor: "#16213e", borderRadius: 14, padding: 16, marginBottom: 10 },
  commRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  commLabel: { fontSize: 14, color: "#9BA1A6" },
  commValue: { fontSize: 14, color: "#4ADE80", fontWeight: "600" },
  commPct: { fontSize: 14, color: "#fbbf24", fontWeight: "600" },
});
