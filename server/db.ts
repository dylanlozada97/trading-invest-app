import { eq, and, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, appUsers, investments, recharges, withdrawals, commissions, transactions } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== AUTH USERS (Manus OAuth) ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== APP USERS (Plataforma de inversiones) ====================

export async function registerAppUser(username: string, email: string, password: string, referralCode: string, referrerUserId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appUsers).values({ username, email, password, referralCode, referrerUserId: referrerUserId || null, balance: "0.00", totalReferrals: 0 });
  // Get the inserted user
  const newUser = await db.select().from(appUsers).where(eq(appUsers.id, Number(result[0].insertId))).limit(1);
  return newUser[0];
}

export async function getAppUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppUserByReferralCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.referralCode, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAppUserBalance(userId: number, amount: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appUsers).set({ balance: amount }).where(eq(appUsers.id, userId));
}

export async function incrementAppUserBalance(userId: number, amount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appUsers).set({ balance: sql`balance + ${amount}` }).where(eq(appUsers.id, userId));
}

export async function decrementAppUserBalance(userId: number, amount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appUsers).set({ balance: sql`balance - ${amount}` }).where(eq(appUsers.id, userId));
}

export async function incrementAppUserReferrals(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appUsers).set({ totalReferrals: sql`totalReferrals + 1` }).where(eq(appUsers.id, userId));
}

export async function getAllAppUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appUsers).orderBy(desc(appUsers.createdAt));
}

// ==================== INVESTMENTS ====================

export async function createInvestment(userId: number, amount: number, expectedGain: number, completionDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(investments).values({ userId, amount: amount.toFixed(2), expectedGain: expectedGain.toFixed(2), completionDate, daysRemaining: 15 });
  return Number(result[0].insertId);
}

export async function getUserInvestments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.createdAt));
}

export async function getAllInvestments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(investments).orderBy(desc(investments.createdAt));
}

export async function updateInvestmentStatus(id: number, status: "active" | "completed" | "claimed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(investments).set({ status }).where(eq(investments.id, id));
}

// ==================== RECHARGES ====================

export async function createRecharge(userId: number, amount: number, reference?: string, proofImageUrl?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recharges).values({ userId, amount: amount.toFixed(2), reference, proofImageUrl });
  return Number(result[0].insertId);
}

export async function getUserRecharges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recharges).where(eq(recharges.userId, userId)).orderBy(desc(recharges.createdAt));
}

export async function getAllRecharges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recharges).orderBy(desc(recharges.createdAt));
}

export async function updateRechargeStatus(id: number, status: "pending" | "approved" | "rejected", adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(recharges).set({ status, adminNotes, processedAt: new Date() }).where(eq(recharges.id, id));
}

// ==================== WITHDRAWALS ====================

export async function createWithdrawal(userId: number, amount: number, bankName?: string, accountNumber?: string, accountHolder?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(withdrawals).values({ userId, amount: amount.toFixed(2), bankName, accountNumber, accountHolder });
  return Number(result[0].insertId);
}

export async function getUserWithdrawals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt));
}

export async function getAllWithdrawals() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
}

export async function updateWithdrawalStatus(id: number, status: "pending" | "approved" | "rejected", adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(withdrawals).set({ status, adminNotes, processedAt: new Date() }).where(eq(withdrawals.id, id));
}

// ==================== COMMISSIONS ====================

export async function createCommission(referrerId: number, refereeId: number, amount: number, percentage: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(commissions).values({ referrerId, refereeId, amount: amount.toFixed(2), percentage: percentage.toFixed(2), status: "credited" });
}

export async function getAllCommissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commissions).orderBy(desc(commissions.createdAt));
}

// ==================== TRANSACTIONS ====================

export async function createTransaction(userId: number, type: "investment" | "recharge" | "withdrawal" | "commission" | "claim", amount: number, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(transactions).values({ userId, type, amount: amount.toFixed(2), description });
}

export async function getAllTransactions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).orderBy(desc(transactions.createdAt));
}

export async function getUserTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
}

// ==================== ADMIN STATS ====================

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;

  const allUsers = await db.select().from(appUsers);
  const allInvs = await db.select().from(investments);
  const allRech = await db.select().from(recharges);
  const allWith = await db.select().from(withdrawals);
  const allComm = await db.select().from(commissions);

  const totalBalance = allUsers.reduce((sum, u) => sum + Number(u.balance), 0);
  const activeInvestments = allInvs.filter(i => i.status === "active").length;
  const pendingRecharges = allRech.filter(r => r.status === "pending");
  const pendingWithdrawals = allWith.filter(w => w.status === "pending");
  const totalCommissions = allComm.reduce((sum, c) => sum + Number(c.amount), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newUsersToday = allUsers.filter(u => new Date(u.createdAt) >= today).length;
  const todayCommissions = allComm.filter(c => new Date(c.createdAt) >= today).reduce((sum, c) => sum + Number(c.amount), 0);

  return {
    totalBalance,
    activeInvestments,
    totalUsers: allUsers.length,
    pendingRecharges: pendingRecharges.length,
    pendingRechargesAmount: pendingRecharges.reduce((sum, r) => sum + Number(r.amount), 0),
    pendingWithdrawals: pendingWithdrawals.length,
    pendingWithdrawalsAmount: pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0),
    totalCommissions,
    newUsersToday,
    todayCommissions,
  };
}
