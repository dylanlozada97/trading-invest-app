import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import * as schema from "../drizzle/schema";

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

// APP USERS
export async function createAppUser(data: { username: string; email: string; referralCode: string; referredBy?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(schema.appUsers).values({
      ...data,
      balance: "0",
      totalReferrals: 0,
      createdAt: new Date(),
    });

    return { success: true, userId: (result as any).insertId || 0 };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getAppUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(schema.appUsers).where(eq(schema.appUsers.id, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllAppUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(schema.appUsers);
}

export async function updateAppUserBalance(userId: number, newBalance: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.appUsers).set({ balance: newBalance }).where(eq(schema.appUsers.id, userId));
}

// INVESTMENTS
export async function createInvestment(userId: number, amount: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(schema.investments).values({
      userId,
      amount,
      status: "active",
      createdAt: new Date(),
    });

    // Record transaction
    await db.insert(schema.transactions).values({
      userId,
      type: "investment",
      amount,
      description: `Inversión de $${amount}`,
      createdAt: new Date(),
    });

    return { success: true, investmentId: (result as any).insertId || 0 };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getInvestments(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(schema.investments).where(eq(schema.investments.userId, userId));
}

export async function getAllInvestments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(schema.investments);
}

export async function claimInvestment(investmentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const investment = await db.select().from(schema.investments).where(eq(schema.investments.id, investmentId)).limit(1);
    if (investment.length === 0 || investment[0].userId !== userId) {
      throw new Error("Inversión no encontrada");
    }

    const amount = parseFloat(investment[0].amount);
    const gain = (amount * 0.6).toString();

    // Update investment
    await db.update(schema.investments).set({ status: "claimed" }).where(eq(schema.investments.id, investmentId));

    // Add gain to user balance
    const user = await db.select().from(schema.appUsers).where(eq(schema.appUsers.id, userId)).limit(1);
    const newBalance = (parseFloat(user[0].balance) + parseFloat(gain)).toString();
    await db.update(schema.appUsers).set({ balance: newBalance }).where(eq(schema.appUsers.id, userId));

    // Record transaction
    await db.insert(schema.transactions).values({
      userId,
      type: "investment",
      amount: gain,
      description: `Ganancia de inversión: $${gain}`,
      createdAt: new Date(),
    });

    return { success: true, gain };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// RECHARGES
export async function createRecharge(userId: number, data: { amount: string; reference: string; proofUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(schema.recharges).values({
      userId,
      ...data,
      status: "pending",
      createdAt: new Date(),
    });

    // Record transaction
    await db.insert(schema.transactions).values({
      userId,
      type: "recharge",
      amount: data.amount,
      description: `Recarga pendiente: $${data.amount}`,
      createdAt: new Date(),
    });

    return { success: true, rechargeId: (result as any).insertId || 0 };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getRecharges(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(schema.recharges).where(eq(schema.recharges.userId, userId));
}

export async function getAllRecharges() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(schema.recharges);
}

export async function approveRecharge(rechargeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const recharge = await db.select().from(schema.recharges).where(eq(schema.recharges.id, rechargeId)).limit(1);
    if (recharge.length === 0) throw new Error("Recarga no encontrada");

    // Update recharge
    await db.update(schema.recharges).set({ status: "approved" }).where(eq(schema.recharges.id, rechargeId));

    // Add to user balance (only if user exists)
    const user = await db.select().from(schema.appUsers).where(eq(schema.appUsers.id, recharge[0].userId)).limit(1);
    if (user.length > 0) {
      const newBalance = (parseFloat(user[0].balance) + parseFloat(recharge[0].amount)).toString();
      await db.update(schema.appUsers).set({ balance: newBalance }).where(eq(schema.appUsers.id, recharge[0].userId));
    }

    // Record transaction
    await db.insert(schema.transactions).values({
      userId: recharge[0].userId,
      type: "recharge",
      amount: recharge[0].amount,
      description: `Recarga aprobada: $${recharge[0].amount}`,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function rejectRecharge(rechargeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const recharge = await db.select().from(schema.recharges).where(eq(schema.recharges.id, rechargeId)).limit(1);
    if (recharge.length === 0) throw new Error("Recarga no encontrada");
    
    await db.update(schema.recharges).set({ status: "rejected" }).where(eq(schema.recharges.id, rechargeId));
    
    // Record transaction
    await db.insert(schema.transactions).values({
      userId: recharge[0].userId,
      type: "recharge",
      amount: recharge[0].amount,
      description: `Recarga rechazada: $${recharge[0].amount}`,
      createdAt: new Date(),
    });
    
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// WITHDRAWALS
export async function createWithdrawal(userId: number, data: { amount: string; accountNumber: string; bankName: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(schema.withdrawals).values({
      userId,
      ...data,
      status: "pending",
      createdAt: new Date(),
    });

    // Record transaction
    await db.insert(schema.transactions).values({
      userId,
      type: "withdrawal",
      amount: data.amount,
      description: `Retiro pendiente: $${data.amount}`,
      createdAt: new Date(),
    });

    return { success: true, withdrawalId: (result as any).insertId || 0 };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getWithdrawals(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(schema.withdrawals).where(eq(schema.withdrawals.userId, userId));
}

export async function getAllWithdrawals() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(schema.withdrawals);
}

export async function approveWithdrawal(withdrawalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const withdrawal = await db.select().from(schema.withdrawals).where(eq(schema.withdrawals.id, withdrawalId)).limit(1);
    if (withdrawal.length === 0) throw new Error("Retiro no encontrado");

    // Update withdrawal
    await db.update(schema.withdrawals).set({ status: "approved" }).where(eq(schema.withdrawals.id, withdrawalId));

    // Record transaction
    await db.insert(schema.transactions).values({
      userId: withdrawal[0].userId,
      type: "withdrawal",
      amount: withdrawal[0].amount,
      description: `Retiro aprobado: $${withdrawal[0].amount}`,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function rejectWithdrawal(withdrawalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const withdrawal = await db.select().from(schema.withdrawals).where(eq(schema.withdrawals.id, withdrawalId)).limit(1);
    if (withdrawal.length === 0) throw new Error("Retiro no encontrado");

    // Update withdrawal
    await db.update(schema.withdrawals).set({ status: "rejected" }).where(eq(schema.withdrawals.id, withdrawalId));

    return { success: true };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// COMMISSIONS
export async function getCommissions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(schema.commissions).where(eq(schema.commissions.referrerId, userId));
}

export async function getAllCommissions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(schema.commissions);
}

// TRANSACTIONS
export async function getAllTransactions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(schema.transactions);
}

// ADMIN STATS
export async function getAdminStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const users = await db.select().from(schema.appUsers);
    const investments = await db.select().from(schema.investments);
    const recharges = await db.select().from(schema.recharges);
    const withdrawals = await db.select().from(schema.withdrawals);
    const commissions = await db.select().from(schema.commissions);

    const totalBalance = users.reduce((sum, u) => sum + parseFloat(u.balance), 0);
    const activeInvestments = investments.filter((i) => i.status === "active").length;
    const pendingRecharges = recharges.filter((r) => r.status === "pending");
    const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
    const totalCommissions = commissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);

    return {
      totalBalance: totalBalance.toFixed(2),
      activeInvestments,
      totalUsers: users.length,
      pendingRecharges: pendingRecharges.length,
      pendingRechargesAmount: pendingRecharges.reduce((sum, r) => sum + parseFloat(r.amount), 0).toFixed(2),
      pendingWithdrawals: pendingWithdrawals.length,
      pendingWithdrawalsAmount: pendingWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0).toFixed(2),
      totalCommissions: totalCommissions.toFixed(2),
      todayCommissions: commissions
        .filter((c) => new Date(c.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, c) => sum + parseFloat(c.amount), 0)
        .toFixed(2),
    };
  } catch (error) {
    console.error("Error getting admin stats:", error);
    return {
      totalBalance: "0",
      activeInvestments: 0,
      totalUsers: 0,
      pendingRecharges: 0,
      pendingRechargesAmount: "0",
      pendingWithdrawals: 0,
      pendingWithdrawalsAmount: "0",
      totalCommissions: "0",
      todayCommissions: "0",
    };
  }
}
