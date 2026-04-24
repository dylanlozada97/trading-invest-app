import { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, StyleSheet, Share, RefreshControl, TouchableOpacity, Platform } from "react-native";
import { showAlert } from "@/lib/alert";
import { ScreenContainer } from "@/components/screen-container";
import { loadUser, AppUser, getReferralLevel, syncUserFromServer } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";
import * as Clipboard from "expo-clipboard";

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
      showAlert("Copiado", "Código copiado al portapapeles");
    } catch {
      showAlert("Info", `Tu código: ${user.referralCode}`);
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
    { name: "Bronce", min: 0, pct: 5, icon: "🥉" },
    { name: "Bronze", min: 5, pct: 10, icon: "🏅" },
    { name: "Silver", min: 10, pct: 15, icon: "🥈" },
    { name: "Gold", min: 15, pct: 20, icon: "🥇" },
    { name: "Platinum", min: 20, pct: 25, icon: "💎" },
    { name: "Diamond", min: 25, pct: 30, icon: "👑" },
  ];

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Programa de Referidos</Text>
          <Text style={s.headerSub}>Invita amigos y gana comisiones por sus inversiones</Text>
        </View>

        {/* Referral Code Card */}
        <View style={s.codeSection}>
          <View style={s.codeCard}>
            <View style={s.codeTop}>
              <Text style={s.codeLabel}>Tu Código de Referido</Text>
              <View style={s.codeBg}>
                <Text style={s.codeValue}>{user?.referralCode || "---"}</Text>
              </View>
            </View>
            <View style={s.codeActions}>
              <TouchableOpacity onPress={handleCopy} style={s.codeBtn} activeOpacity={0.7}>
                <Text style={s.codeBtnIcon}>📋</Text>
                <Text style={s.codeBtnText}>Copiar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={[s.codeBtn, s.codeBtnShare]} activeOpacity={0.7}>
                <Text style={s.codeBtnIcon}>📤</Text>
                <Text style={s.codeBtnText}>Compartir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statIcon}>👥</Text>
            <Text style={s.statValue}>{user?.totalReferrals || 0}</Text>
            <Text style={s.statLabel}>Referidos</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>⭐</Text>
            <Text style={[s.statValue, { color: "#fbbf24" }]}>{level.name}</Text>
            <Text style={s.statLabel}>Nivel ({level.percentage}%)</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>💰</Text>
            <Text style={[s.statValue, { color: "#4ADE80" }]}>${totalEarned.toLocaleString("es-CO")}</Text>
            <Text style={s.statLabel}>Ganado</Text>
          </View>
        </View>

        {/* How it works */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>¿Cómo Funciona?</Text>
          <View style={s.howCard}>
            <View style={s.howStep}>
              <View style={s.howNum}><Text style={s.howNumText}>1</Text></View>
              <View style={s.howContent}>
                <Text style={s.howTitle}>Comparte tu código</Text>
                <Text style={s.howDesc}>Envía tu código de referido a tus amigos</Text>
              </View>
            </View>
            <View style={s.howStep}>
              <View style={s.howNum}><Text style={s.howNumText}>2</Text></View>
              <View style={s.howContent}>
                <Text style={s.howTitle}>Ellos se registran</Text>
                <Text style={s.howDesc}>Usan tu código al crear su cuenta</Text>
              </View>
            </View>
            <View style={[s.howStep, { borderBottomWidth: 0 }]}>
              <View style={s.howNum}><Text style={s.howNumText}>3</Text></View>
              <View style={s.howContent}>
                <Text style={s.howTitle}>Ganas comisiones</Text>
                <Text style={s.howDesc}>Recibes un % de cada inversión que hagan</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Levels */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Niveles de Comisión</Text>
          <View style={s.levelsCard}>
            {levels.map((l, i) => {
              const isActive = l.name === level.name;
              return (
                <View key={l.name} style={[s.levelRow, isActive && s.levelRowActive, i === levels.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={s.levelIcon}>{l.icon}</Text>
                  <View style={s.levelInfo}>
                    <Text style={[s.levelName, isActive && s.levelNameActive]}>{l.name}</Text>
                    <Text style={s.levelReq}>{l.min}+ referidos</Text>
                  </View>
                  <View style={[s.levelPctBg, isActive && s.levelPctBgActive]}>
                    <Text style={[s.levelPct, isActive && s.levelPctActive]}>{l.pct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Commission History */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Historial de Comisiones</Text>
            {commissions.length > 0 && (
              <View style={s.countBadge}>
                <Text style={s.countBadgeText}>{commissions.length}</Text>
              </View>
            )}
          </View>
          {commissions.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>🎁</Text>
              <Text style={s.emptyText}>Aún no tienes comisiones</Text>
              <Text style={s.emptyHint}>Comparte tu código para empezar a ganar</Text>
            </View>
          ) : (
            commissions.map((c: any) => (
              <View key={c.id} style={s.commCard}>
                <View style={s.commLeft}>
                  <Text style={s.commAmount}>+${parseFloat(c.amount).toLocaleString("es-CO")}</Text>
                  <Text style={s.commPctLabel}>Comisión {c.percentage}%</Text>
                </View>
                <View style={s.commBadge}>
                  <Text style={s.commBadgeText}>{c.percentage}%</Text>
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
  // Header
  header: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  headerSub: { fontSize: 14, color: "#ffffff90", marginTop: 4, lineHeight: 20 },

  // Code Card
  codeSection: { paddingHorizontal: 16, marginTop: -14 },
  codeCard: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#DC262640",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  codeTop: { alignItems: "center", marginBottom: 16 },
  codeLabel: { fontSize: 13, color: "#9BA1A6", marginBottom: 10, fontWeight: "500" },
  codeBg: {
    backgroundColor: "#0f1629",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fbbf2440",
  },
  codeValue: { fontSize: 26, fontWeight: "bold", color: "#fbbf24", letterSpacing: 3 },
  codeActions: { flexDirection: "row", gap: 10 },
  codeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  codeBtnShare: { backgroundColor: "#22C55E" },
  codeBtnIcon: { fontSize: 16 },
  codeBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
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
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#ECEDEE", marginBottom: 2 },
  statLabel: { fontSize: 11, color: "#9BA1A6", fontWeight: "500", textAlign: "center" },

  // Section
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#ECEDEE", marginBottom: 12 },
  countBadge: {
    backgroundColor: "#4ADE8020",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 12,
  },
  countBadgeText: { fontSize: 12, fontWeight: "700", color: "#4ADE80" },

  // How it works
  howCard: { backgroundColor: "#16213e", borderRadius: 16, padding: 4, borderWidth: 1, borderColor: "#1e2d4a" },
  howStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d4a",
  },
  howNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  howNumText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  howContent: { flex: 1 },
  howTitle: { fontSize: 14, fontWeight: "700", color: "#ECEDEE", marginBottom: 2 },
  howDesc: { fontSize: 12, color: "#9BA1A6", lineHeight: 18 },

  // Levels
  levelsCard: { backgroundColor: "#16213e", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#1e2d4a" },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d4a",
  },
  levelRowActive: { backgroundColor: "#DC262615" },
  levelIcon: { fontSize: 20, marginRight: 12 },
  levelInfo: { flex: 1 },
  levelName: { fontSize: 15, color: "#ECEDEE", fontWeight: "600" },
  levelNameActive: { color: "#fbbf24" },
  levelReq: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  levelPctBg: {
    backgroundColor: "#0f1629",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelPctBgActive: { backgroundColor: "#4ADE8020" },
  levelPct: { fontSize: 15, fontWeight: "bold", color: "#9BA1A6" },
  levelPctActive: { color: "#4ADE80" },

  // Empty
  emptyCard: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e2d4a",
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { color: "#9BA1A6", fontSize: 15, fontWeight: "500", marginBottom: 4 },
  emptyHint: { color: "#687076", fontSize: 13 },

  // Commission Cards
  commCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1e2d4a",
  },
  commLeft: {},
  commAmount: { fontSize: 17, fontWeight: "bold", color: "#4ADE80" },
  commPctLabel: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  commBadge: {
    backgroundColor: "#fbbf2418",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  commBadgeText: { fontSize: 14, fontWeight: "bold", color: "#fbbf24" },
});
