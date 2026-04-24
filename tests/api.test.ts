import { describe, it, expect } from "vitest";

describe("API Endpoints", () => {
  const API_BASE = "http://localhost:3000/api/trpc";

  async function trpcGet(path: string) {
    const res = await fetch(`${API_BASE}/${path}`);
    const data = await res.json();
    return data.result?.data?.json;
  }

  async function trpcPost(path: string, input: any) {
    const res = await fetch(`${API_BASE}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: input }),
    });
    const data = await res.json();
    return data.result?.data?.json;
  }

  it("should return admin stats with platform balance fields", async () => {
    const stats = await trpcGet("admin.stats");
    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalUsers");
    expect(stats).toHaveProperty("activeInvestments");
    expect(stats).toHaveProperty("totalBalance");
    // New platform real balance fields
    expect(stats).toHaveProperty("totalApprovedRecharges");
    expect(stats).toHaveProperty("totalApprovedWithdrawals");
    expect(stats).toHaveProperty("platformRealBalance");
    // Verify they are numeric strings
    expect(parseFloat(stats.totalApprovedRecharges)).not.toBeNaN();
    expect(parseFloat(stats.totalApprovedWithdrawals)).not.toBeNaN();
    expect(parseFloat(stats.platformRealBalance)).not.toBeNaN();
  });

  it("should return admin users list", async () => {
    const users = await trpcGet("admin.users");
    expect(Array.isArray(users)).toBe(true);
  });

  it("should return admin investments list", async () => {
    const investments = await trpcGet("admin.investments");
    expect(Array.isArray(investments)).toBe(true);
  });

  it("should return admin recharges list", async () => {
    const recharges = await trpcGet("admin.recharges");
    expect(Array.isArray(recharges)).toBe(true);
  });

  it("should return admin withdrawals list", async () => {
    const withdrawals = await trpcGet("admin.withdrawals");
    expect(Array.isArray(withdrawals)).toBe(true);
  });

  it("should create a user via investment.createUser", async () => {
    const result = await trpcPost("investment.createUser", {
      username: "test_vitest_" + Date.now(),
      email: "test_" + Date.now() + "@test.com",
      referralCode: "TEST-" + Date.now(),
    });
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
