import { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, Alert, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { loadUser, clearUser, AppUser, getReferralLevel } from "@/lib/auth-store";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);

  const loadData = useCallback(async () => {
    const u = await loadUser();
    if (u) setUser(u);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: async () => {
            await clearUser();
            router.replace("/welcome");
          },
        },
      ]
    );
  };

  const level = user ? getReferralLevel(user.totalReferrals) : { name: "Bronze", percentage: 10 };

  if (!user) return null;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
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
              <Text style={s.rowValue}>${parseFloat(user.balance).toLocaleString()}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Referidos</Text>
              <Text style={s.rowValue}>{user.totalReferrals}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Código</Text>
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
          <Pressable onPress={() => router.push("/recharge" as any)} style={s.menuItem}>
            <Text style={s.menuIcon}>💳</Text>
            <Text style={s.menuText}>Recargar Saldo</Text>
            <Text style={s.menuArrow}>›</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/withdraw" as any)} style={s.menuItem}>
            <Text style={s.menuIcon}>🏦</Text>
            <Text style={s.menuText}>Retirar Fondos</Text>
            <Text style={s.menuArrow}>›</Text>
          </Pressable>
        </View>

        <View style={s.section}>
          <Pressable onPress={handleLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>Cerrar Sesión</Text>
          </Pressable>
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
  logoutBtn: { backgroundColor: "#DC262620", borderWidth: 1, borderColor: "#DC2626", borderRadius: 14, padding: 16, alignItems: "center" },
  logoutText: { color: "#DC2626", fontSize: 16, fontWeight: "bold" },
});
