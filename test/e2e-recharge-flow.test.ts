import { describe, it, expect } from "vitest";

/**
 * Test end-to-end del flujo completo:
 * 1. Crear usuario nuevo (simula registro)
 * 2. Verificar que el usuario tiene saldo 0
 * 3. Buscar usuario por username (nuevo endpoint)
 * 4. Crear una recarga (simula subir foto)
 * 5. Verificar que la recarga aparece como pendiente en el admin
 * 6. Aprobar la recarga desde el admin
 * 7. Verificar que el saldo del usuario se actualizó
 * 8. Verificar que la recarga aparece como aprobada
 */

const API_BASE = "http://localhost:3000/api/trpc";
const timestamp = Date.now();

/** Helper: getUser is a query (GET), not a mutation (POST) */
async function getUser(userId: number) {
  const input = encodeURIComponent(JSON.stringify({ json: { userId } }));
  const res = await fetch(`${API_BASE}/investment.getUser?input=${input}`);
  const data = await res.json();
  return data.result?.data?.json;
}

describe("E2E: Flujo completo de recarga", () => {
  let userId = 0;
  let rechargeId = 0;
  const testUsername = `e2e_user_${timestamp}`;
  const testAmount = "250000";

  it("1. Crear usuario nuevo", async () => {
    const res = await fetch(`${API_BASE}/investment.createUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          username: testUsername,
          email: `${testUsername}@test.com`,
          referralCode: `E2E-${timestamp}`,
        },
      }),
    });
    const data = await res.json();
    userId = data.result?.data?.json?.userId;
    console.log("userId creado:", userId);
    expect(userId).toBeGreaterThan(0);
  });

  it("2. Verificar que el usuario tiene saldo 0", async () => {
    const user = await getUser(userId);
    console.log("Usuario:", user);
    expect(user).toBeDefined();
    expect(user.balance).toBe("0");
  });

  it("3. Buscar usuario por username (endpoint nuevo)", async () => {
    const res = await fetch(`${API_BASE}/investment.getUserByUsername`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { username: testUsername } }),
    });
    const data = await res.json();
    const user = data.result?.data?.json;
    console.log("Usuario por username:", user);
    expect(user).toBeDefined();
    expect(user.id).toBe(userId);
    expect(user.username).toBe(testUsername);
  });

  it("4. Crear recarga con foto (simula subir comprobante)", async () => {
    const res = await fetch(`${API_BASE}/investment.createRecharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          userId,
          amount: testAmount,
          reference: `REF-E2E-${timestamp}`,
          proofUrl: "https://example.com/proof-e2e.jpg",
        },
      }),
    });
    const data = await res.json();
    console.log("Recarga creada:", data.result?.data?.json);
    expect(data.result?.data?.json?.success).toBe(true);

    // Get the recharge ID from the admin panel
    const adminRes = await fetch(`${API_BASE}/admin.recharges`);
    const adminData = await adminRes.json();
    const recharges = adminData.result?.data?.json || [];
    const myRecharge = recharges.find(
      (r: any) => r.userId === userId && r.amount === testAmount && r.status === "pending"
    );
    console.log("Recarga encontrada:", myRecharge);
    expect(myRecharge).toBeDefined();
    rechargeId = myRecharge!.id;
  });

  it("5. Verificar que la recarga aparece como pendiente en admin", async () => {
    const res = await fetch(`${API_BASE}/admin.recharges`);
    const data = await res.json();
    const recharges = data.result?.data?.json || [];
    const myRecharge = recharges.find((r: any) => r.id === rechargeId);
    expect(myRecharge).toBeDefined();
    expect(myRecharge?.status).toBe("pending");
    expect(myRecharge?.userId).toBe(userId);
    expect(myRecharge?.amount).toBe(testAmount);
  });

  it("6. Aprobar la recarga desde el admin", async () => {
    const res = await fetch(`${API_BASE}/admin.approveRecharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { id: rechargeId } }),
    });
    const data = await res.json();
    console.log("Resultado aprobación:", data.result?.data?.json);
    expect(data.result?.data?.json?.success).toBe(true);
  });

  it("7. Verificar que el saldo del usuario se actualizó a $250,000", async () => {
    const user = await getUser(userId);
    console.log("Usuario después de aprobación:", user);
    expect(user).toBeDefined();
    expect(parseFloat(user.balance)).toBe(parseFloat(testAmount));
  });

  it("8. Verificar que la recarga aparece como aprobada", async () => {
    const res = await fetch(`${API_BASE}/admin.recharges`);
    const data = await res.json();
    const recharges = data.result?.data?.json || [];
    const myRecharge = recharges.find((r: any) => r.id === rechargeId);
    expect(myRecharge?.status).toBe("approved");
  });
});
