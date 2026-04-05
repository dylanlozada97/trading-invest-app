import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Investment Platform Tables
export const appUsers = mysqlTable("app_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  balance: varchar("balance", { length: 50 }).default("0").notNull(),
  totalReferrals: int("totalReferrals").default(0).notNull(),
  referralCode: varchar("referralCode", { length: 64 }).notNull().unique(),
  referredBy: varchar("referredBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const investments = mysqlTable("investments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: varchar("amount", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["active", "completed", "claimed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const recharges = mysqlTable("recharges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: varchar("amount", { length: 50 }).notNull(),
  reference: varchar("reference", { length: 256 }).notNull(),
  proofUrl: text("proofUrl"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const withdrawals = mysqlTable("withdrawals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: varchar("amount", { length: 50 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 256 }).notNull(),
  bankName: varchar("bankName", { length: 256 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const commissions = mysqlTable("commissions", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  refereeId: int("refereeId").notNull(),
  amount: varchar("amount", { length: 50 }).notNull(),
  percentage: int("percentage").notNull(),
  status: mysqlEnum("status", ["pending", "credited"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["investment", "recharge", "withdrawal", "commission"]).notNull(),
  amount: varchar("amount", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AppUser = typeof appUsers.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type Recharge = typeof recharges.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
