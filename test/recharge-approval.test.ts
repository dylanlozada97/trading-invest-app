import { describe, it, expect, beforeAll } from "vitest";

/**
 * Test para verificar el flujo completo de aprobación de recargas:
 * 1. Usuario crea una recarga con foto
 * 2. Admin ve la recarga en el panel
 * 3. Admin aprueba la recarga
 * 4. El saldo del usuario se actualiza
 * 5. Usuario ve el saldo actualizado en la app
 */

const API_BASE = "http://localhost:3000/api/trpc";

describe("Recharge Approval Flow", () => {
  let userId: number;
  let rechargeId: number;
  const testAmount = "100000";

  beforeAll(async () => {
    // Create a test user
    const userRes = await fetch(`${API_BASE}/investment.createUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          username: "test_user_" + Date.now(),
          email: "test_" + Date.now() + "@test.com",
          referralCode: "TEST-" + Math.random().toString(36).substring(7),
        },
      }),
    });
    const userData = await userRes.json();
    userId = userData.result?.data?.json?.userId;
    expect(userId).toBeGreaterThan(0);
  });

  it("should create a recharge with pending status", async () => {
    const res = await fetch(`${API_BASE}/investment.createRecharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          userId,
          amount: testAmount,
          reference: "TEST-REF-" + Date.now(),
          proofUrl: "https://example.com/proof.jpg",
        },
      }),
    });
    const data = await res.json();
    rechargeId = data.result?.data?.json?.rechargeId;
    expect(rechargeId).toBeGreaterThan(0);
  });

  it("should show recharge in admin panel as pending", async () => {
    const res = await fetch(`${API_BASE}/admin.recharges`);
    const data = await res.json();
    const recharges = data.result?.data?.json || [];
    const testRecharge = recharges.find((r: any) => r.id === rechargeId);
    expect(testRecharge).toBeDefined();
    expect(testRecharge?.status).toBe("pending");
    expect(testRecharge?.userId).toBe(userId);
    expect(testRecharge?.amount).toBe(testAmount);
  });

  it("should approve recharge and update user balance", async () => {
    // Get initial balance
    const userRes = await fetch(`${API_BASE}/investment.getUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { userId } }),
    });
    const userData = await userRes.json();
    const initialBalance = parseFloat(userData.result?.data?.json?.balance || "0");

    // Approve recharge
    const approveRes = await fetch(`${API_BASE}/admin.approveRecharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { id: rechargeId } }),
    });
    const approveData = await approveRes.json();
    expect(approveData.result?.data?.json?.success).toBe(true);

    // Check updated balance
    const updatedUserRes = await fetch(`${API_BASE}/investment.getUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { userId } }),
    });
    const updatedUserData = await updatedUserRes.json();
    const newBalance = parseFloat(updatedUserData.result?.data?.json?.balance || "0");

    expect(newBalance).toBe(initialBalance + parseFloat(testAmount));
  });

  it("should show recharge as approved in admin panel", async () => {
    const res = await fetch(`${API_BASE}/admin.recharges`);
    const data = await res.json();
    const recharges = data.result?.data?.json || [];
    const testRecharge = recharges.find((r: any) => r.id === rechargeId);
    expect(testRecharge?.status).toBe("approved");
  });

  it("should reject recharge if not approved", async () => {
    // Create another recharge
    const createRes = await fetch(`${API_BASE}/investment.createRecharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          userId,
          amount: "50000",
          reference: "TEST-REF-REJECT-" + Date.now(),
          proofUrl: "https://example.com/proof2.jpg",
        },
      }),
    });
    const createData = await createRes.json();
    const rejectRechargeId = createData.result?.data?.json?.rechargeId;

    // Get initial balance
    const userRes = await fetch(`${API_BASE}/investment.getUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { userId } }),
    });
    const userData = await userRes.json();
    const initialBalance = parseFloat(userData.result?.data?.json?.balance || "0");

    // Reject recharge
    const rejectRes = await fetch(`${API_BASE}/admin.rejectRecharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { id: rejectRechargeId } }),
    });
    const rejectData = await rejectRes.json();
    expect(rejectData.result?.data?.json?.success).toBe(true);

    // Check balance didn't change
    const updatedUserRes = await fetch(`${API_BASE}/investment.getUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { userId } }),
    });
    const updatedUserData = await updatedUserRes.json();
    const newBalance = parseFloat(updatedUserData.result?.data?.json?.balance || "0");

    expect(newBalance).toBe(initialBalance);
  });
});
