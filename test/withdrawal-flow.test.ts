import { describe, it, expect } from "vitest";

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
  if (data.error) throw new Error(data.error.json?.message || JSON.stringify(data.error));
  return data.result?.data?.json;
}

async function trpcQuery(path: string, input: any) {
  const encoded = encodeURIComponent(JSON.stringify({ json: input }));
  const res = await fetch(`${API_BASE}/${path}?input=${encoded}`);
  const data = await res.json();
  return data.result?.data?.json;
}

describe("Withdrawal Flow", () => {
  const ts = Date.now();

  it("should create withdrawal, approve it, and verify balance", async () => {
    // 1. Create user
    const username = `withdraw_test_${ts}`;
    const createResult = await trpcPost("investment.createUser", {
      username,
      email: `${username}@test.com`,
      referralCode: `WD-${ts}`,
    });
    expect(createResult.success).toBe(true);
    const userId = createResult.userId;

    // 2. Create a recharge and approve it to give the user balance
    await trpcPost("investment.createRecharge", {
      userId,
      amount: "500000",
      reference: "TEST-REF",
    });

    const recharges = await trpcGet("admin.recharges");
    const userRecharge = recharges.find(
      (r: any) => r.userId === userId && r.status === "pending"
    );
    expect(userRecharge).toBeDefined();

    await trpcPost("admin.approveRecharge", { id: userRecharge.id });

    // 3. Verify user has balance
    const userAfterRecharge = await trpcPost("investment.getUserByUsername", { username });
    const balanceAfterRecharge = parseFloat(userAfterRecharge.balance);
    expect(balanceAfterRecharge).toBe(500000);
    console.log(`User balance after recharge: $${balanceAfterRecharge}`);

    // 4. Create a withdrawal
    const withdrawResult = await trpcPost("investment.createWithdrawal", {
      userId,
      amount: "200000",
      accountNumber: "123456789",
      bankName: "Bancolombia - Test User",
    });
    expect(withdrawResult.success).toBe(true);

    // 5. Verify balance was deducted
    const userAfterWithdraw = await trpcPost("investment.getUserByUsername", { username });
    const balanceAfterWithdraw = parseFloat(userAfterWithdraw.balance);
    expect(balanceAfterWithdraw).toBe(300000);
    console.log(`User balance after withdrawal request: $${balanceAfterWithdraw}`);

    // 6. Find the pending withdrawal and approve it
    const withdrawals = await trpcGet("admin.withdrawals");
    const userWithdrawal = withdrawals.find(
      (w: any) => w.userId === userId && w.status === "pending"
    );
    expect(userWithdrawal).toBeDefined();

    await trpcPost("admin.approveWithdrawal", { id: userWithdrawal.id, notes: "Aprobado" });

    // 7. Verify withdrawal is approved
    const withdrawalsAfter = await trpcGet("admin.withdrawals");
    const approvedW = withdrawalsAfter.find((w: any) => w.id === userWithdrawal.id);
    expect(approvedW.status).toBe("approved");
    console.log(`Withdrawal #${userWithdrawal.id} approved successfully`);

    // 8. Balance should remain the same (already deducted on request)
    const userFinal = await trpcPost("investment.getUserByUsername", { username });
    expect(parseFloat(userFinal.balance)).toBe(300000);
    console.log(`Final balance: $${parseFloat(userFinal.balance)}`);
  });

  it("should refund balance when withdrawal is rejected", async () => {
    // 1. Create user
    const username = `reject_wd_${ts}`;
    const createResult = await trpcPost("investment.createUser", {
      username,
      email: `${username}@test.com`,
      referralCode: `RWD-${ts}`,
    });
    const userId = createResult.userId;

    // 2. Give user balance
    await trpcPost("investment.createRecharge", {
      userId,
      amount: "300000",
      reference: "REF-REJECT",
    });

    const recharges = await trpcGet("admin.recharges");
    const userRecharge = recharges.find(
      (r: any) => r.userId === userId && r.status === "pending"
    );
    await trpcPost("admin.approveRecharge", { id: userRecharge.id });

    // 3. Create withdrawal
    await trpcPost("investment.createWithdrawal", {
      userId,
      amount: "150000",
      accountNumber: "987654321",
      bankName: "Nequi - Test",
    });

    // 4. Verify balance deducted
    const userAfterRequest = await trpcPost("investment.getUserByUsername", { username });
    expect(parseFloat(userAfterRequest.balance)).toBe(150000);
    console.log(`Balance after withdrawal request: $${parseFloat(userAfterRequest.balance)}`);

    // 5. Reject the withdrawal
    const withdrawals = await trpcGet("admin.withdrawals");
    const userWithdrawal = withdrawals.find(
      (w: any) => w.userId === userId && w.status === "pending"
    );
    expect(userWithdrawal).toBeDefined();

    await trpcPost("admin.rejectWithdrawal", { id: userWithdrawal.id, notes: "Rechazado" });

    // 6. Verify balance was refunded
    const userAfterReject = await trpcPost("investment.getUserByUsername", { username });
    expect(parseFloat(userAfterReject.balance)).toBe(300000);
    console.log(`Balance after rejection (refunded): $${parseFloat(userAfterReject.balance)}`);
  });
});
