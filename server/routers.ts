import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as dbInv from "./db-investment";

const COOKIE_NAME = "auth";

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

  investment: router({
    // Users
    createUser: publicProcedure
      .input(z.object({ username: z.string(), email: z.string(), referralCode: z.string(), referredBy: z.string().optional() }))
      .mutation(async ({ input }) => dbInv.createAppUser(input)),

    getUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => dbInv.getAppUser(input.userId)),

    // Investments
    createInvestment: publicProcedure
      .input(z.object({ userId: z.number(), amount: z.string() }))
      .mutation(async ({ input }) => dbInv.createInvestment(input.userId, input.amount)),

    getInvestments: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => dbInv.getInvestments(input.userId)),

    claimInvestment: publicProcedure
      .input(z.object({ investmentId: z.number(), userId: z.number() }))
      .mutation(async ({ input }) => dbInv.claimInvestment(input.investmentId, input.userId)),

    // Recharges
    createRecharge: publicProcedure
      .input(z.object({ userId: z.number(), amount: z.string(), reference: z.string(), proofUrl: z.string().optional() }))
      .mutation(async ({ input }) => dbInv.createRecharge(input.userId, { amount: input.amount, reference: input.reference, proofUrl: input.proofUrl })),

    getRecharges: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => dbInv.getRecharges(input.userId)),

    // Withdrawals
    createWithdrawal: publicProcedure
      .input(z.object({ userId: z.number(), amount: z.string(), accountNumber: z.string(), bankName: z.string() }))
      .mutation(async ({ input }) => dbInv.createWithdrawal(input.userId, { amount: input.amount, accountNumber: input.accountNumber, bankName: input.bankName })),

    getWithdrawals: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => dbInv.getWithdrawals(input.userId)),

    // Commissions
    getCommissions: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => dbInv.getCommissions(input.userId)),
  }),

  // Admin Routes
  admin: router({
    stats: publicProcedure.query(async () => dbInv.getAdminStats()),
    users: publicProcedure.query(async () => dbInv.getAllAppUsers()),
    investments: publicProcedure.query(async () => dbInv.getAllInvestments()),
    recharges: publicProcedure.query(async () => dbInv.getAllRecharges()),
    withdrawals: publicProcedure.query(async () => dbInv.getAllWithdrawals()),
    commissions: publicProcedure.query(async () => dbInv.getAllCommissions()),
    transactions: publicProcedure.query(async () => dbInv.getAllTransactions()),
    approveRecharge: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => dbInv.approveRecharge(input.id)),
    rejectRecharge: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => dbInv.rejectRecharge(input.id)),
    approveWithdrawal: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => dbInv.approveWithdrawal(input.id)),
    rejectWithdrawal: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => dbInv.rejectWithdrawal(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
