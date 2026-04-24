import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, sql } from "drizzle-orm";
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

    // Get the inserted user to retrieve the actual ID
    const users = await db.select().from(schema.appUsers).where(eq(schema.appUsers.username, data.username)).limit(1);
    const userId = users.length > 0 ? users[0].id : 0;

    // If user was referred by someone, increment the referrer's totalReferrals count
    if (data.referredBy && data.referredBy.trim() !== "") {
      const referrer = await db.select().from(schema.appUsers)
        .where(eq(schema.appUsers.referralCode, data.referredBy.trim()))
        .limit(1);
      if (referrer.length > 0) {
        await db.update(schema.appUsers)
          .set({ totalReferrals: sql`${schema.appUsers.totalReferrals} + 1` })
          .where(eq(schema.appUsers.id, referrer[0].id));
        console.log(`[Referral] User ${data.username} referred by ${referrer[0].username} (code: ${data.referredBy}). Referrer now has ${referrer[0].totalReferrals + 1} referrals.`);
      } else {
        console.log(`[Referral] Referral code ${data.referredBy} not found - no referrer credited.`);
      }
    }

    return { success: true, userId };
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

export async function getAppUserByUsername(username: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(schema.appUsers).where(eq(schema.appUsers.username, username)).limit(1);
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
    // Check user exists and has enough balance
    const users = await db.select().from(schema.appUsers).where(eq(schema.appUsers.id, userId)).limit(1);
    if (users.length === 0) throw new Error("Usuario no encontrado");

    const currentBalance = parseFloat(users[0].balance);
    const investAmount = parseFloat(amount);

    // --- LÍMITES DE INVERSIÓN ---
    const MIN_INVESTMENT = 50000;
    const MAX_INVESTMENT = 1000000;
    const MAX_DAILY_INVESTMENT = 1000000;
    const MAX_ACTIVE_INVESTMENTS = 3;

    if (investAmount < MIN_INVESTMENT) {
      throw new Error(`El monto mínimo de inversión es $${MIN_INVESTMENT.toLocaleString('es-CO')}`);
    }
    if (investAmount > MAX_INVESTMENT) {
      throw new Error(`El monto máximo por inversión es $${MAX_INVESTMENT.toLocaleString('es-CO')}`);
    }

    // Check active investments count
    const activeInvestments = await db.select().from(schema.investments)
      .where(and(eq(schema.investments.userId, userId), eq(schema.investments.status, "active")));
    if (activeInvestments.length >= MAX_ACTIVE_INVESTMENTS) {
      throw new Error(`Solo puedes tener ${MAX_ACTIVE_INVESTMENTS} inversiones activas al mismo tiempo. Espera a que alguna se complete.`);
    }

    // Check daily investment limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayInvestments = await db.select().from(schema.investments)
      .where(and(eq(schema.investments.userId, userId), sql`${schema.investments.createdAt} >= ${today}`));
    const todayTotal = todayInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    if (todayTotal + investAmount > MAX_DAILY_INVESTMENT) {
      const remaining = MAX_DAILY_INVESTMENT - todayTotal;
      throw new Error(`Límite diario de inversión: $${MAX_DAILY_INVESTMENT.toLocaleString('es-CO')}. Hoy has invertido $${todayTotal.toLocaleString('es-CO')}. Puedes invertir hasta $${remaining.toLocaleString('es-CO')} más hoy.`);
    }

    if (currentBalance < investAmount) {
      throw new Error(`Saldo insuficiente. Tu saldo es $${currentBalance.toLocaleString('es-CO')}`);
    }

    // Deduct balance from user in DB
    const newBalance = (currentBalance - investAmount).toString();
    await db.update(schema.appUsers).set({ balance: newBalance }).where(eq(schema.appUsers.id, userId));

    // Create investment record
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

    // Generate referral commission if this user was referred by someone
    try {
      const investor = users[0];
      if (investor.referredBy && investor.referredBy.trim() !== "") {
        // Find the referrer by their referral code
        const referrer = await db.select().from(schema.appUsers)
          .where(eq(schema.appUsers.referralCode, investor.referredBy.trim()))
          .limit(1);
        if (referrer.length > 0) {
          // Calculate commission based on referrer's level
          const referrerTotalReferrals = referrer[0].totalReferrals;
          let commissionPct = 5; // Default: Bronce
          if (referrerTotalReferrals >= 25) commissionPct = 30; // Diamond
          else if (referrerTotalReferrals >= 20) commissionPct = 25; // Platinum
          else if (referrerTotalReferrals >= 15) commissionPct = 20; // Gold
          else if (referrerTotalReferrals >= 10) commissionPct = 15; // Silver
          else if (referrerTotalReferrals >= 5) commissionPct = 10; // Bronze

          const commissionAmount = (investAmount * commissionPct / 100).toString();

          // Create commission record
          await db.insert(schema.commissions).values({
            referrerId: referrer[0].id,
            refereeId: userId,
            amount: commissionAmount,
            percentage: commissionPct,
            status: "credited",
            createdAt: new Date(),
          });

          // Credit commission to referrer's balance
          const referrerBalance = parseFloat(referrer[0].balance);
          const newReferrerBalance = (referrerBalance + parseFloat(commissionAmount)).toString();
          await db.update(schema.appUsers)
            .set({ balance: newReferrerBalance })
            .where(eq(schema.appUsers.id, referrer[0].id));

          // Record commission transaction
          await db.insert(schema.transactions).values({
            userId: referrer[0].id,
            type: "commission",
            amount: commissionAmount,
            description: `Comisión ${commissionPct}% por inversión de referido (${investor.username}): $${commissionAmount}`,
            createdAt: new Date(),
          });

          console.log(`[Commission] ${referrer[0].username} earned $${commissionAmount} (${commissionPct}%) from ${investor.username}'s investment of $${amount}`);
        }
      }
    } catch (commError) {
      console.error('[Commission] Error generating commission:', commError);
      // Don't fail the investment if commission generation fails
    }

    return { success: true, investmentId: (result as any).insertId || 0, newBalance };
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
    await db.insert(schema.recharges).values({
      userId,
      ...data,
      status: "pending",
      createdAt: new Date(),
    });

    // Get the inserted recharge ID by querying the latest one for this user
    const inserted = await db.select().from(schema.recharges)
      .where(and(eq(schema.recharges.userId, userId), eq(schema.recharges.reference, data.reference)))
      .orderBy(schema.recharges.id)
      .limit(1);
    const rechargeId = inserted.length > 0 ? inserted[inserted.length - 1].id : 0;

    // Record transaction
    await db.insert(schema.transactions).values({
      userId,
      type: "recharge",
      amount: data.amount,
      description: `Recarga pendiente: $${data.amount}`,
      createdAt: new Date(),
    });

    return { success: true, rechargeId };
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
    // Verify user has enough balance
    const user = await db.select().from(schema.appUsers).where(eq(schema.appUsers.id, userId)).limit(1);
    if (user.length === 0) throw new Error("Usuario no encontrado");
    const currentBalance = parseFloat(user[0].balance);
    const withdrawAmount = parseFloat(data.amount);

    // --- LÍMITES DE RETIRO ---
    const MIN_WITHDRAWAL = 50000;
    const MAX_WITHDRAWAL = 1000000;
    const MAX_DAILY_WITHDRAWAL = 1000000;

    if (withdrawAmount <= 0) throw new Error("El monto debe ser mayor a 0");
    if (withdrawAmount < MIN_WITHDRAWAL) {
      throw new Error(`El monto mínimo de retiro es $${MIN_WITHDRAWAL.toLocaleString('es-CO')}`);
    }
    if (withdrawAmount > MAX_WITHDRAWAL) {
      throw new Error(`El monto máximo por retiro es $${MAX_WITHDRAWAL.toLocaleString('es-CO')}`);
    }

    // Check daily withdrawal limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWithdrawals = await db.select().from(schema.withdrawals)
      .where(and(
        eq(schema.withdrawals.userId, userId),
        sql`${schema.withdrawals.createdAt} >= ${today}`,
        sql`${schema.withdrawals.status} != 'rejected'`
      ));
    const todayTotal = todayWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0);
    if (todayTotal + withdrawAmount > MAX_DAILY_WITHDRAWAL) {
      const remaining = MAX_DAILY_WITHDRAWAL - todayTotal;
      throw new Error(`Límite diario de retiro: $${MAX_DAILY_WITHDRAWAL.toLocaleString('es-CO')}. Hoy has solicitado $${todayTotal.toLocaleString('es-CO')}. Puedes retirar hasta $${remaining.toLocaleString('es-CO')} más hoy.`);
    }

    if (currentBalance < withdrawAmount) throw new Error("Saldo insuficiente");

    // Deduct balance immediately (reserve funds)
    await db.update(schema.appUsers)
      .set({ balance: (currentBalance - withdrawAmount).toFixed(2) })
      .where(eq(schema.appUsers.id, userId));

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
      description: `Retiro solicitado: $${data.amount} (saldo descontado)`,
      createdAt: new Date(),
    });

    console.log(`[Withdrawal] User ${userId} requested withdrawal of $${data.amount}. Balance: $${currentBalance} -> $${(currentBalance - withdrawAmount).toFixed(2)}`);

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
    if (withdrawal[0].status !== "pending") throw new Error("Este retiro ya fue procesado");

    // Update withdrawal status to approved
    await db.update(schema.withdrawals).set({ status: "approved" }).where(eq(schema.withdrawals.id, withdrawalId));

    // Record transaction
    await db.insert(schema.transactions).values({
      userId: withdrawal[0].userId,
      type: "withdrawal",
      amount: withdrawal[0].amount,
      description: `Retiro aprobado y pagado: $${withdrawal[0].amount}`,
      createdAt: new Date(),
    });

    console.log(`[Withdrawal] Approved withdrawal #${withdrawalId} for $${withdrawal[0].amount}`);

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
    if (withdrawal[0].status !== "pending") throw new Error("Este retiro ya fue procesado");

    // Update withdrawal status to rejected
    await db.update(schema.withdrawals).set({ status: "rejected" }).where(eq(schema.withdrawals.id, withdrawalId));

    // Refund the balance back to the user
    const user = await db.select().from(schema.appUsers).where(eq(schema.appUsers.id, withdrawal[0].userId)).limit(1);
    if (user.length > 0) {
      const currentBalance = parseFloat(user[0].balance);
      const refundAmount = parseFloat(withdrawal[0].amount);
      await db.update(schema.appUsers)
        .set({ balance: (currentBalance + refundAmount).toFixed(2) })
        .where(eq(schema.appUsers.id, withdrawal[0].userId));

      // Record refund transaction
      await db.insert(schema.transactions).values({
        userId: withdrawal[0].userId,
        type: "withdrawal",
        amount: withdrawal[0].amount,
        description: `Retiro rechazado: $${withdrawal[0].amount} (saldo devuelto)`,
        createdAt: new Date(),
      });

      console.log(`[Withdrawal] Rejected withdrawal #${withdrawalId}. Refunded $${withdrawal[0].amount} to user ${withdrawal[0].userId}`);
    }

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

    // Saldo real de la plataforma: recargas aprobadas - retiros aprobados
    const approvedRecharges = recharges.filter((r) => r.status === "approved");
    const approvedWithdrawals = withdrawals.filter((w) => w.status === "approved");
    const totalApprovedRecharges = approvedRecharges.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalApprovedWithdrawals = approvedWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0);
    const platformRealBalance = totalApprovedRecharges - totalApprovedWithdrawals;

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
      // Saldo real de plataforma
      totalApprovedRecharges: totalApprovedRecharges.toFixed(2),
      totalApprovedWithdrawals: totalApprovedWithdrawals.toFixed(2),
      platformRealBalance: platformRealBalance.toFixed(2),
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
      totalApprovedRecharges: "0",
      totalApprovedWithdrawals: "0",
      platformRealBalance: "0",
    };
  }
}

// AUTO-PAY MATURED INVESTMENTS
export async function processMaturedInvestments() {
  const db = await getDb();
  if (!db) {
    console.log('[AutoPay] Database not available, skipping.');
    return { processed: 0 };
  }

  try {
    // Get all active investments
    const activeInvestments = await db.select().from(schema.investments)
      .where(eq(schema.investments.status, "active"));

    const now = new Date();
    let processed = 0;

    for (const inv of activeInvestments) {
      const createdAt = new Date(inv.createdAt);
      const daysPassed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysPassed >= 15) {
        const capital = parseFloat(inv.amount);
        const gain = capital * 0.6;
        const totalPayout = capital + gain;

        // Mark investment as completed
        await db.update(schema.investments)
          .set({ status: "completed" })
          .where(eq(schema.investments.id, inv.id));

        // Credit capital + gain to user balance
        const user = await db.select().from(schema.appUsers)
          .where(eq(schema.appUsers.id, inv.userId)).limit(1);
        if (user.length > 0) {
          const newBalance = (parseFloat(user[0].balance) + totalPayout).toString();
          await db.update(schema.appUsers)
            .set({ balance: newBalance })
            .where(eq(schema.appUsers.id, inv.userId));

          // Record transaction
          await db.insert(schema.transactions).values({
            userId: inv.userId,
            type: "investment",
            amount: totalPayout.toString(),
            description: `Inversión completada: Capital $${capital.toLocaleString('es-CO')} + Ganancia $${gain.toLocaleString('es-CO')} = $${totalPayout.toLocaleString('es-CO')}`,
            createdAt: new Date(),
          });

          console.log(`[AutoPay] Investment #${inv.id} matured. Paid $${totalPayout.toLocaleString('es-CO')} to user ${user[0].username} (ID: ${inv.userId})`);
        }

        processed++;
      }
    }

    if (processed > 0) {
      console.log(`[AutoPay] Processed ${processed} matured investments.`);
    }

    return { processed };
  } catch (error) {
    console.error('[AutoPay] Error processing matured investments:', error);
    return { processed: 0 };
  }
}

// SIMULATE TIME PASSING (for testing - moves active investment dates back by N days)
export async function simulateTimePassed(days: number = 15) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Get all active investments
    const activeInvestments = await db.select().from(schema.investments)
      .where(eq(schema.investments.status, "active"));

    if (activeInvestments.length === 0) {
      return { success: true, message: "No hay inversiones activas para adelantar.", affected: 0 };
    }

    // Move createdAt back by N days for each active investment
    for (const inv of activeInvestments) {
      const originalDate = new Date(inv.createdAt);
      const newDate = new Date(originalDate.getTime() - (days * 24 * 60 * 60 * 1000));
      await db.update(schema.investments)
        .set({ createdAt: newDate })
        .where(eq(schema.investments.id, inv.id));
      console.log(`[SimTime] Investment #${inv.id}: moved from ${originalDate.toISOString()} to ${newDate.toISOString()} (-${days} days)`);
    }

    // Now run the auto-pay to process them
    const payResult = await processMaturedInvestments();

    return {
      success: true,
      message: `Se adelantaron ${activeInvestments.length} inversiones por ${days} d\u00edas. ${payResult.processed} fueron pagadas autom\u00e1ticamente.`,
      affected: activeInvestments.length,
      paid: payResult.processed,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// RESET ALL DATA (for testing - clears recharges, transactions, investments, withdrawals, commissions and resets balances)
export async function resetAllData() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Delete all transactions
    await db.delete(schema.transactions);
    // Delete all recharges
    await db.delete(schema.recharges);
    // Delete all investments
    await db.delete(schema.investments);
    // Delete all withdrawals
    await db.delete(schema.withdrawals);
    // Delete all commissions
    await db.delete(schema.commissions);
    // Reset all user balances to 0
    await db.update(schema.appUsers).set({ balance: "0", totalReferrals: 0 });

    return { success: true, message: "Todos los datos han sido borrados. Saldos reseteados a 0." };
  } catch (error: any) {
    throw new Error(error.message);
  }
}
