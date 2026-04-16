import { describe, it, expect } from "vitest";

/**
 * Test simplificado para verificar que los endpoints de aprobación de recargas funcionan
 */

const API_BASE = "http://localhost:3000/api/trpc";

describe("Recharge Approval Endpoints", () => {
  it("should list all recharges from admin panel", async () => {
    const res = await fetch(`${API_BASE}/admin.recharges`);
    const data = await res.json();
    const recharges = data.result?.data?.json;
    
    expect(Array.isArray(recharges)).toBe(true);
    expect(recharges.length).toBeGreaterThan(0);
  });

  it("should have recharges with correct structure", async () => {
    const res = await fetch(`${API_BASE}/admin.recharges`);
    const data = await res.json();
    const recharges = data.result?.data?.json || [];
    
    if (recharges.length > 0) {
      const recharge = recharges[0];
      expect(recharge).toHaveProperty("id");
      expect(recharge).toHaveProperty("userId");
      expect(recharge).toHaveProperty("amount");
      expect(recharge).toHaveProperty("status");
      expect(recharge).toHaveProperty("proofUrl");
      expect(recharge).toHaveProperty("createdAt");
    }
  });

  it("should have pending recharges available", async () => {
    const res = await fetch(`${API_BASE}/admin.recharges`);
    const data = await res.json();
    const recharges = data.result?.data?.json || [];
    
    const pendingRecharge = recharges.find((r: any) => r.status === "pending");
    expect(pendingRecharge).toBeDefined();
  });

  it("should be able to approve a pending recharge", async () => {
    // Get a pending recharge
    const res = await fetch(`${API_BASE}/admin.recharges`);
    const data = await res.json();
    const recharges = data.result?.data?.json || [];
    const pendingRecharge = recharges.find((r: any) => r.status === "pending");
    
    if (!pendingRecharge) {
      console.log("No pending recharge found, skipping test");
      return;
    }

    // Get initial balance
    const userRes = await fetch(`${API_BASE}/investment.getUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { userId: pendingRecharge.userId } }),
    });
    const userData = await userRes.json();
    const initialBalance = parseFloat(userData.result?.data?.json?.balance || "0");

    // Approve the recharge
    const approveRes = await fetch(`${API_BASE}/admin.approveRecharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { id: pendingRecharge.id } }),
    });
    const approveData = await approveRes.json();
    
    expect(approveData.result?.data?.json?.success).toBe(true);

    // Check updated balance
    const updatedUserRes = await fetch(`${API_BASE}/investment.getUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { userId: pendingRecharge.userId } }),
    });
    const updatedUserData = await updatedUserRes.json();
    const newBalance = parseFloat(updatedUserData.result?.data?.json?.balance || "0");

    // Balance should have increased
    expect(newBalance).toBeGreaterThan(initialBalance);
    expect(newBalance).toBe(initialBalance + parseFloat(pendingRecharge.amount));
  });

  it("should show recharge as approved after approval", async () => {
    // Get a pending recharge first
    const res = await fetch(`${API_BASE}/admin.recharges`);
    const data = await res.json();
    const recharges = data.result?.data?.json || [];
    const pendingRecharge = recharges.find((r: any) => r.status === "pending");
    
    if (!pendingRecharge) {
      console.log("No pending recharge found, skipping test");
      return;
    }

    // Approve it
    await fetch(`${API_BASE}/admin.approveRecharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { id: pendingRecharge.id } }),
    });

    // Check it's approved
    const checkRes = await fetch(`${API_BASE}/admin.recharges`);
    const checkData = await checkRes.json();
    const recharges2 = checkData.result?.data?.json || [];
    const approvedRecharge = recharges2.find((r: any) => r.id === pendingRecharge.id);
    
    expect(approvedRecharge?.status).toBe("approved");
  });

  it("should be able to reject a pending recharge", async () => {
    // Get a pending recharge
    const res = await fetch(`${API_BASE}/admin.recharges`);
    const data = await res.json();
    const recharges = data.result?.data?.json || [];
    const pendingRecharge = recharges.find((r: any) => r.status === "pending");
    
    if (!pendingRecharge) {
      console.log("No pending recharge found, skipping test");
      return;
    }

    // Get initial balance
    const userRes = await fetch(`${API_BASE}/investment.getUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { userId: pendingRecharge.userId } }),
    });
    const userData = await userRes.json();
    const initialBalance = parseFloat(userData.result?.data?.json?.balance || "0");

    // Reject the recharge
    const rejectRes = await fetch(`${API_BASE}/admin.rejectRecharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { id: pendingRecharge.id } }),
    });
    const rejectData = await rejectRes.json();
    
    expect(rejectData.result?.data?.json?.success).toBe(true);

    // Check balance didn't change
    const updatedUserRes = await fetch(`${API_BASE}/investment.getUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { userId: pendingRecharge.userId } }),
    });
    const updatedUserData = await updatedUserRes.json();
    const newBalance = parseFloat(updatedUserData.result?.data?.json?.balance || "0");

    expect(newBalance).toBe(initialBalance);
  });
});
