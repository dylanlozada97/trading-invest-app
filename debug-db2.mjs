import mysql from 'mysql2/promise';

async function check() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.log('No DATABASE_URL'); return; }
  const conn = await mysql.createConnection(url);
  
  // Find who has referralCode INV-WH0ZFY
  const [referrer] = await conn.query("SELECT id, username, referralCode, totalReferrals, balance FROM app_users WHERE referralCode = 'INV-WH0ZFY'");
  console.log('=== REFERRER (INV-WH0ZFY) ===');
  referrer.forEach(u => console.log(JSON.stringify(u)));
  
  // Find all users referred by INV-WH0ZFY
  const [referred] = await conn.query("SELECT id, username, referralCode, referredBy, balance FROM app_users WHERE referredBy = 'INV-WH0ZFY'");
  console.log('\n=== REFERRED BY INV-WH0ZFY ===');
  referred.forEach(u => console.log(JSON.stringify(u)));
  
  // Find investments by those referred users
  const referredIds = referred.map(u => u.id);
  if (referredIds.length > 0) {
    const [invs] = await conn.query(`SELECT * FROM investments WHERE userId IN (${referredIds.join(',')})`);
    console.log('\n=== INVESTMENTS BY REFERRED USERS ===');
    invs.forEach(i => console.log(JSON.stringify(i)));
  }
  
  // Find commissions for the referrer
  if (referrer.length > 0) {
    const [comms] = await conn.query(`SELECT * FROM commissions WHERE referrerId = ${referrer[0].id}`);
    console.log('\n=== COMMISSIONS FOR REFERRER ===');
    comms.forEach(c => console.log(JSON.stringify(c)));
  }
  
  await conn.end();
}
check().catch(console.error);
