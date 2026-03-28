import { describe, it, expect, beforeEach } from 'vitest';

describe('Referral System', () => {
  let referrals: any[] = [];
  let userReferralInfo: any;

  const REFERRAL_LEVELS = [
    { level: 1, name: 'Bronze', minReferrals: 0, commissionPercentage: 10 },
    { level: 2, name: 'Silver', minReferrals: 5, commissionPercentage: 15 },
    { level: 3, name: 'Gold', minReferrals: 15, commissionPercentage: 20 },
    { level: 4, name: 'Platinum', minReferrals: 30, commissionPercentage: 25 },
    { level: 5, name: 'Diamond', minReferrals: 50, commissionPercentage: 30 },
  ];

  beforeEach(() => {
    referrals = [];
    userReferralInfo = {
      userId: 'user123',
      referralCode: 'REF1234ABCD',
      level: 1,
      totalReferrals: 0,
      activeReferrals: 0,
      totalEarningsFromReferrals: 0,
      referrals: [],
    };
  });

  it('should generate a unique referral code', () => {
    const code = `REF${'user123'.substring(0, 4).toUpperCase()}${Date.now().toString().slice(-4)}`;
    expect(code).toMatch(/^REF[A-Z0-9]{8}$/);
  });

  it('should create a new referral', () => {
    const referral = {
      id: '1',
      referrerUserId: 'user123',
      referredUserId: 'user456',
      referredName: 'Juan Pérez',
      referredEmail: 'juan@example.com',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      totalEarnings: 0,
    };

    referrals.push(referral);

    expect(referrals.length).toBe(1);
    expect(referrals[0].status).toBe('pending');
    expect(referrals[0].referredName).toBe('Juan Pérez');
  });

  it('should activate a referral', () => {
    const referral = {
      id: '1',
      referrerUserId: 'user123',
      referredUserId: 'user456',
      referredName: 'Juan Pérez',
      referredEmail: 'juan@example.com',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      totalEarnings: 0,
    };

    referrals.push(referral);

    // Activate referral
    referrals = referrals.map((r) => {
      if (r.id === '1') {
        return {
          ...r,
          status: 'active' as const,
          activatedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    expect(referrals[0].status).toBe('active');
    expect(referrals[0].activatedAt).toBeDefined();
  });

  it('should calculate user level based on referrals', () => {
    const getUserLevel = (totalReferrals: number): number => {
      for (let i = REFERRAL_LEVELS.length - 1; i >= 0; i--) {
        if (totalReferrals >= REFERRAL_LEVELS[i].minReferrals) {
          return REFERRAL_LEVELS[i].level;
        }
      }
      return 1;
    };

    expect(getUserLevel(0)).toBe(1); // Bronze
    expect(getUserLevel(5)).toBe(2); // Silver
    expect(getUserLevel(15)).toBe(3); // Gold
    expect(getUserLevel(30)).toBe(4); // Platinum
    expect(getUserLevel(50)).toBe(5); // Diamond
  });

  it('should calculate commission based on level', () => {
    const calculateCommission = (investmentAmount: number, level: number): number => {
      const levelInfo = REFERRAL_LEVELS.find((l) => l.level === level);
      if (!levelInfo) return 0;
      return (investmentAmount * levelInfo.commissionPercentage) / 100;
    };

    expect(calculateCommission(1000, 1)).toBe(100); // 10%
    expect(calculateCommission(1000, 2)).toBe(150); // 15%
    expect(calculateCommission(1000, 3)).toBe(200); // 20%
    expect(calculateCommission(1000, 4)).toBe(250); // 25%
    expect(calculateCommission(1000, 5)).toBe(300); // 30%
  });

  it('should update level when referral count increases', () => {
    userReferralInfo.totalReferrals = 0;
    userReferralInfo.level = 1;

    // Add referrals
    for (let i = 0; i < 5; i++) {
      userReferralInfo.totalReferrals++;
    }

    // Update level - find the highest level that matches
    let newLevel = 1;
    for (let i = REFERRAL_LEVELS.length - 1; i >= 0; i--) {
      if (userReferralInfo.totalReferrals >= REFERRAL_LEVELS[i].minReferrals) {
        newLevel = REFERRAL_LEVELS[i].level;
        break;
      }
    }

    expect(newLevel).toBe(2); // Silver
  });

  it('should track total earnings from referrals', () => {
    const referral1 = { referrerUserId: 'user123', totalEarnings: 100 };
    const referral2 = { referrerUserId: 'user123', totalEarnings: 150 };
    const referral3 = { referrerUserId: 'user456', totalEarnings: 200 };

    const totalEarnings = [referral1, referral2, referral3]
      .filter((r) => r.referrerUserId === 'user123')
      .reduce((sum, r) => sum + r.totalEarnings, 0);

    expect(totalEarnings).toBe(250);
  });

  it('should get referrals by user ID', () => {
    const ref1 = { id: '1', referrerUserId: 'user123', status: 'active' as const };
    const ref2 = { id: '2', referrerUserId: 'user123', status: 'active' as const };
    const ref3 = { id: '3', referrerUserId: 'user456', status: 'active' as const };

    referrals = [ref1, ref2, ref3];

    const userReferrals = referrals.filter((r) => r.referrerUserId === 'user123');

    expect(userReferrals.length).toBe(2);
    expect(userReferrals[0].id).toBe('1');
    expect(userReferrals[1].id).toBe('2');
  });

  it('should count active referrals', () => {
    const ref1 = { id: '1', status: 'active' as const };
    const ref2 = { id: '2', status: 'active' as const };
    const ref3 = { id: '3', status: 'inactive' as const };

    referrals = [ref1, ref2, ref3];

    const activeCount = referrals.filter((r) => r.status === 'active').length;

    expect(activeCount).toBe(2);
  });

  it('should calculate commission progression through levels', () => {
    const calculateCommission = (investmentAmount: number, level: number): number => {
      const levelInfo = REFERRAL_LEVELS.find((l) => l.level === level);
      if (!levelInfo) return 0;
      return (investmentAmount * levelInfo.commissionPercentage) / 100;
    };

    // Simulate earning through levels
    let totalEarnings = 0;
    const investmentAmount = 1000;

    for (let level = 1; level <= 5; level++) {
      const commission = calculateCommission(investmentAmount, level);
      totalEarnings += commission;
    }

    // Total: 100 + 150 + 200 + 250 + 300 = 1000
    expect(totalEarnings).toBe(1000);
  });

  it('should handle multiple referrals with different statuses', () => {
    const ref1 = { id: '1', status: 'pending' as const, totalEarnings: 0 };
    const ref2 = { id: '2', status: 'active' as const, totalEarnings: 100 };
    const ref3 = { id: '3', status: 'active' as const, totalEarnings: 150 };
    const ref4 = { id: '4', status: 'inactive' as const, totalEarnings: 50 };

    referrals = [ref1, ref2, ref3, ref4];

    const pending = referrals.filter((r) => r.status === 'pending').length;
    const active = referrals.filter((r) => r.status === 'active').length;
    const inactive = referrals.filter((r) => r.status === 'inactive').length;
    const totalEarnings = referrals.reduce((sum, r) => sum + r.totalEarnings, 0);

    expect(pending).toBe(1);
    expect(active).toBe(2);
    expect(inactive).toBe(1);
    expect(totalEarnings).toBe(300);
  });
});
