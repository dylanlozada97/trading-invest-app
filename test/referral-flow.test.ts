import { describe, it, expect, beforeAll } from "vitest";

const API_URL = "http://localhost:3000/api/trpc";

async function trpcPost(path: string, input: any) {
  const res = await fetch(`${API_URL}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json: input }),
  });
  const data = await res.json();
  if (data?.error) throw new Error(JSON.stringify(data.error));
  return data?.result?.data?.json;
}

async function trpcGet(path: string, input: any) {
  const encoded = encodeURIComponent(JSON.stringify({ json: input }));
  const res = await fetch(`${API_URL}/${path}?input=${encoded}`);
  const data = await res.json();
  if (data?.error) throw new Error(JSON.stringify(data.error));
  return data?.result?.data?.json;
}

describe("Referral Flow E2E", () => {
  const ts = Date.now();
  const referrerUsername = `referrer_${ts}`;
  const refereeUsername = `referee_${ts}`;
  let referrerCode = `REF-${ts.toString().slice(-6)}`;
  let referrerId = 0;
  let refereeId = 0;

  beforeAll(async () => {
    // Step 1: Create the referrer user (the one who will earn commissions)
    const referrerResult = await trpcPost("investment.createUser", {
      username: referrerUsername,
      email: `${referrerUsername}@test.com`,
      referralCode: referrerCode,
    });
    expect(referrerResult.success).toBe(true);
    referrerId = referrerResult.userId;
    expect(referrerId).toBeGreaterThan(0);
    console.log(`Referrer created: ${referrerUsername} (ID: ${referrerId}, code: ${referrerCode})`);
  });

  it("should count referral when a new user registers with referral code", async () => {
    // Step 2: Create a referee user who uses the referrer's code
    const refereeResult = await trpcPost("investment.createUser", {
      username: refereeUsername,
      email: `${refereeUsername}@test.com`,
      referralCode: `REF2-${ts.toString().slice(-6)}`,
      referredBy: referrerCode,
    });
    expect(refereeResult.success).toBe(true);
    refereeId = refereeResult.userId;
    expect(refereeId).toBeGreaterThan(0);
    console.log(`Referee created: ${refereeUsername} (ID: ${refereeId}, referredBy: ${referrerCode})`);

    // Step 3: Verify the referrer's totalReferrals was incremented
    const referrer = await trpcGet("investment.getUser", { userId: referrerId });
    expect(referrer).toBeTruthy();
    expect(referrer.totalReferrals).toBeGreaterThanOrEqual(1);
    console.log(`Referrer totalReferrals: ${referrer.totalReferrals}`);
  });

  it("should generate commission when referee invests", async () => {
    // Step 4: Give the referee some balance by creating and approving a recharge
    await trpcPost("investment.createRecharge", {
      userId: refereeId,
      amount: "500000",
      reference: `test-ref-${ts}`,
      proofUrl: "https://example.com/proof.jpg",
    });

    // Get the recharge and approve it
    const recharges = await trpcGet("admin.recharges", {});
    const pendingRecharge = recharges.find(
      (r: any) => r.userId === refereeId && r.status === "pending"
    );
    expect(pendingRecharge).toBeTruthy();

    await trpcPost("admin.approveRecharge", { id: pendingRecharge.id });

    // Verify referee has balance
    const refereeAfterRecharge = await trpcGet("investment.getUser", { userId: refereeId });
    expect(parseFloat(refereeAfterRecharge.balance)).toBe(500000);
    console.log(`Referee balance after recharge approval: $${refereeAfterRecharge.balance}`);

    // Step 5: Get referrer balance BEFORE the investment
    const referrerBefore = await trpcGet("investment.getUser", { userId: referrerId });
    const referrerBalanceBefore = parseFloat(referrerBefore.balance);
    console.log(`Referrer balance before investment: $${referrerBalanceBefore}`);

    // Step 6: Referee makes an investment
    const investResult = await trpcPost("investment.createInvestment", {
      userId: refereeId,
      amount: "100000",
    });
    expect(investResult.success).toBe(true);
    console.log(`Referee invested $100,000`);

    // Step 7: Verify commission was generated for the referrer
    // Referrer has < 5 referrals, so commission should be 5% (Bronce level)
    const expectedCommission = 100000 * 0.05; // 5% of 100,000 = 5,000

    const referrerAfter = await trpcGet("investment.getUser", { userId: referrerId });
    const referrerBalanceAfter = parseFloat(referrerAfter.balance);
    console.log(`Referrer balance after investment: $${referrerBalanceAfter}`);
    console.log(`Expected commission: $${expectedCommission}`);

    expect(referrerBalanceAfter).toBe(referrerBalanceBefore + expectedCommission);

    // Step 8: Verify commission record exists
    const commissions = await trpcGet("investment.getCommissions", { userId: referrerId });
    expect(commissions.length).toBeGreaterThanOrEqual(1);

    const lastCommission = commissions[commissions.length - 1];
    expect(parseFloat(lastCommission.amount)).toBe(expectedCommission);
    expect(lastCommission.percentage).toBe(5); // Bronce level
    expect(lastCommission.refereeId).toBe(refereeId);
    console.log(`Commission record: $${lastCommission.amount} at ${lastCommission.percentage}%`);
  });
});
