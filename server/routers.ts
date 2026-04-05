import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Niveles de referidos
const REFERRAL_LEVELS: Record<string, { minReferrals: number; commission: number }> = {
  bronze: { minReferrals: 0, commission: 0.10 },
  silver: { minReferrals: 5, commission: 0.15 },
  gold: { minReferrals: 15, commission: 0.20 },
  platinum: { minReferrals: 30, commission: 0.25 },
  diamond: { minReferrals: 50, commission: 0.30 },
};

function calculateUserLevel(totalReferrals: number): string {
  if (totalReferrals >= 50) return "diamond";
  if (totalReferrals >= 30) return "platinum";
  if (totalReferrals >= 15) return "gold";
  if (totalReferrals >= 5) return "silver";
  return "bronze";
}

function generateReferralCode(username: string): string {
  return `REF${username.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-4)}`;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== APP AUTH ====================
  appAuth: router({
    register: publicProcedure
      .input(z.object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
        referralCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check if username exists
        const existingUser = await db.getAppUserByUsername(input.username);
        if (existingUser) throw new Error("El usuario ya existe");

        // Check if email exists
        const existingEmail = await db.getAppUserByEmail(input.email);
        if (existingEmail) throw new Error("El correo ya está registrado");

        // Find referrer if code provided
        let referrerUserId: number | undefined;
        if (input.referralCode) {
          const referrer = await db.getAppUserByReferralCode(input.referralCode);
          if (!referrer) throw new Error("Código de referido inválido");
          referrerUserId = referrer.id;
        }

        // Generate referral code
        const newReferralCode = generateReferralCode(input.username);

        // Create user
        const newUser = await db.registerAppUser(
          input.username,
          input.email,
          input.password,
          newReferralCode,
          referrerUserId
        );

        // Create transaction
        await db.createTransaction(newUser.id, "recharge", 0, `Registro de usuario: ${input.username}`);

        // If has referrer, credit commission
        if (referrerUserId) {
          const referrer = await db.getAppUserById(referrerUserId);
          if (referrer) {
            const level = calculateUserLevel(referrer.totalReferrals);
            const commissionRate = REFERRAL_LEVELS[level].commission;
            const commissionAmount = 50 * commissionRate; // Base $50

            // Credit commission to referrer
            await db.incrementAppUserBalance(referrerUserId, commissionAmount);
            await db.incrementAppUserReferrals(referrerUserId);

            // Create commission record
            await db.createCommission(referrerUserId, newUser.id, commissionAmount, commissionRate * 100);

            // Create transaction
            await db.createTransaction(referrerUserId, "commission", commissionAmount, `Comisión por referido: ${input.username}`);
          }
        }

        return {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          referralCode: newUser.referralCode,
          balance: Number(newUser.balance),
          totalReferrals: newUser.totalReferrals,
        };
      }),

    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getAppUserByUsername(input.username);
        if (!user || user.password !== input.password) {
          throw new Error("Usuario o contraseña incorrectos");
        }

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          referralCode: user.referralCode,
          balance: Number(user.balance),
          totalReferrals: user.totalReferrals,
          referrerUserId: user.referrerUserId,
        };
      }),

    getProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getAppUserById(input.userId);
        if (!user) throw new Error("Usuario no encontrado");
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          referralCode: user.referralCode,
          balance: Number(user.balance),
          totalReferrals: user.totalReferrals,
          referrerUserId: user.referrerUserId,
          createdAt: user.createdAt,
        };
      }),
  }),

  // ==================== INVESTMENTS ====================
  investments: router({
    create: publicProcedure
      .input(z.object({
        userId: z.number(),
        amount: z.number().min(10),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getAppUserById(input.userId);
        if (!user) throw new Error("Usuario no encontrado");
        if (Number(user.balance) < input.amount) throw new Error("Saldo insuficiente");

        const expectedGain = input.amount * 0.60; // 60% gain
        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + 15);

        // Deduct balance
        await db.decrementAppUserBalance(input.userId, input.amount);

        // Create investment
        const investmentId = await db.createInvestment(input.userId, input.amount, expectedGain, completionDate);

        // Create transaction
        await db.createTransaction(input.userId, "investment", input.amount, `Inversión de $${input.amount.toFixed(2)}`);

        return { id: investmentId, amount: input.amount, expectedGain, completionDate };
      }),

    list: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserInvestments(input.userId);
      }),

    claim: publicProcedure
      .input(z.object({ investmentId: z.number(), userId: z.number() }))
      .mutation(async ({ input }) => {
        const invs = await db.getUserInvestments(input.userId);
        const inv = invs.find(i => i.id === input.investmentId);
        if (!inv) throw new Error("Inversión no encontrada");
        if (inv.status !== "completed") throw new Error("La inversión aún no está completada");

        const totalReturn = Number(inv.amount) + Number(inv.expectedGain);
        await db.incrementAppUserBalance(input.userId, totalReturn);
        await db.updateInvestmentStatus(input.investmentId, "claimed");
        await db.createTransaction(input.userId, "claim", totalReturn, `Reclamación de inversión #${input.investmentId}`);

        return { totalReturn };
      }),
  }),

  // ==================== RECHARGES ====================
  recharges: router({
    create: publicProcedure
      .input(z.object({
        userId: z.number(),
        amount: z.number().min(1),
        reference: z.string().optional(),
        proofImageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createRecharge(input.userId, input.amount, input.reference, input.proofImageUrl);
        await db.createTransaction(input.userId, "recharge", input.amount, `Recarga pendiente: $${input.amount.toFixed(2)}`);
        return { id };
      }),

    list: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserRecharges(input.userId);
      }),
  }),

  // ==================== WITHDRAWALS ====================
  withdrawals: router({
    create: publicProcedure
      .input(z.object({
        userId: z.number(),
        amount: z.number().min(1),
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        accountHolder: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getAppUserById(input.userId);
        if (!user) throw new Error("Usuario no encontrado");
        if (Number(user.balance) < input.amount) throw new Error("Saldo insuficiente");

        await db.decrementAppUserBalance(input.userId, input.amount);
        const id = await db.createWithdrawal(input.userId, input.amount, input.bankName, input.accountNumber, input.accountHolder);
        await db.createTransaction(input.userId, "withdrawal", input.amount, `Retiro solicitado: $${input.amount.toFixed(2)}`);
        return { id };
      }),

    list: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserWithdrawals(input.userId);
      }),
  }),

  // ==================== ADMIN ====================
  admin: router({
    stats: publicProcedure.query(async () => {
      return db.getAdminStats();
    }),

    users: publicProcedure.query(async () => {
      return db.getAllAppUsers();
    }),

    investments: publicProcedure.query(async () => {
      return db.getAllInvestments();
    }),

    recharges: publicProcedure.query(async () => {
      return db.getAllRecharges();
    }),

    withdrawals: publicProcedure.query(async () => {
      return db.getAllWithdrawals();
    }),

    commissions: publicProcedure.query(async () => {
      return db.getAllCommissions();
    }),

    transactions: publicProcedure.query(async () => {
      return db.getAllTransactions();
    }),

    approveRecharge: publicProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        const allRecharges = await db.getAllRecharges();
        const recharge = allRecharges.find(r => r.id === input.id);
        if (!recharge) throw new Error("Recarga no encontrada");
        if (recharge.status !== "pending") throw new Error("La recarga ya fue procesada");

        await db.updateRechargeStatus(input.id, "approved", input.notes);
        await db.incrementAppUserBalance(recharge.userId, Number(recharge.amount));
        await db.createTransaction(recharge.userId, "recharge", Number(recharge.amount), `Recarga aprobada: $${Number(recharge.amount).toFixed(2)}`);
        return { success: true };
      }),

    rejectRecharge: publicProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        await db.updateRechargeStatus(input.id, "rejected", input.notes);
        return { success: true };
      }),

    approveWithdrawal: publicProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        await db.updateWithdrawalStatus(input.id, "approved", input.notes);
        return { success: true };
      }),

    rejectWithdrawal: publicProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        const allWithdrawals = await db.getAllWithdrawals();
        const withdrawal = allWithdrawals.find(w => w.id === input.id);
        if (!withdrawal) throw new Error("Retiro no encontrado");

        await db.updateWithdrawalStatus(input.id, "rejected", input.notes);
        // Return balance to user
        await db.incrementAppUserBalance(withdrawal.userId, Number(withdrawal.amount));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
