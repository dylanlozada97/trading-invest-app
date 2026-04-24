import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as dbInv from "./db-investment";
import { storagePut } from "./storage";

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
    // Upload proof image to S3
    uploadProofImage: publicProcedure
      .input(z.object({ userId: z.number(), imageBase64: z.string(), fileName: z.string() }))
      .mutation(async ({ input }) => {
        try {
          // Convert base64 to buffer
          const base64Data = input.imageBase64.split(",").pop() || input.imageBase64;
          const buffer = Buffer.from(base64Data, "base64");
          
          // Upload to S3
          const fileKey = `recharges/${input.userId}/${input.fileName}-${Date.now()}.jpg`;
          const { url } = await storagePut(fileKey, buffer, "image/jpeg");
          
          return { success: true, url };
        } catch (error: any) {
          throw new Error(error.message || "Failed to upload image");
        }
      }),

    // Users
    createUser: publicProcedure
      .input(z.object({ username: z.string(), email: z.string(), referralCode: z.string(), referredBy: z.string().optional() }))
      .mutation(async ({ input }) => dbInv.createAppUser(input)),

    getUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => dbInv.getAppUser(input.userId)),

    getUserByUsername: publicProcedure
      .input(z.object({ username: z.string() }))
      .mutation(async ({ input }) => dbInv.getAppUserByUsername(input.username)),

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
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => dbInv.approveRecharge(input.id)),
    rejectRecharge: publicProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => dbInv.rejectRecharge(input.id)),
    approveWithdrawal: publicProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => dbInv.approveWithdrawal(input.id)),
    rejectWithdrawal: publicProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => dbInv.rejectWithdrawal(input.id)),
    processMaturedInvestments: publicProcedure
      .mutation(async () => dbInv.processMaturedInvestments()),
    resetAllData: publicProcedure
      .mutation(async () => dbInv.resetAllData()),
  }),
});

export type AppRouter = typeof appRouter;
