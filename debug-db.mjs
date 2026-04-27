import mysql from 'mysql2/promise';

async function check() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.log('No DATABASE_URL'); return; }
  const conn = await mysql.createConnection(url);
  
  const [users] = await conn.query('SELECT id, username, referralCode, referredBy, totalReferrals, balance FROM app_users');
  console.log('=== USERS ===');
  users.forEach(u => console.log(JSON.stringify(u)));
  
  const [commissions] = await conn.query('SELECT * FROM commissions');
  console.log('\n=== COMMISSIONS ===');
  commissions.forEach(c => console.log(JSON.stringify(c)));
  
  const [investments] = await conn.query('SELECT id, userId, amount, status, createdAt FROM investments');
  console.log('\n=== INVESTMENTS ===');
  investments.forEach(i => console.log(JSON.stringify(i)));
  
  await conn.end();
}
check().catch(console.error);
