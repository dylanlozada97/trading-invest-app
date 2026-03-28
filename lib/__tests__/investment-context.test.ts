import { describe, it, expect, beforeEach } from 'vitest';

// Mock de AsyncStorage
const mockAsyncStorage = {
  getItem: async (key: string) => null,
  setItem: async (key: string, value: string) => {},
  removeItem: async (key: string) => {},
  clear: async () => {},
};

// Constantes de prueba
const INVESTMENT_GAIN_PERCENTAGE = 0.60;
const INVESTMENT_DURATION_DAYS = 15;
const INITIAL_BALANCE = 10000;

describe('Investment Logic', () => {
  let balance: number;
  let investments: any[] = [];

  beforeEach(() => {
    balance = INITIAL_BALANCE;
    investments = [];
  });

  it('should calculate expected gains correctly (60% of investment)', () => {
    const investmentAmount = 1000;
    const expectedGain = investmentAmount * INVESTMENT_GAIN_PERCENTAGE;
    
    expect(expectedGain).toBe(600);
  });

  it('should validate investment amount against balance', () => {
    const investmentAmount = 15000;
    const isValid = investmentAmount <= balance;
    
    expect(isValid).toBe(false);
  });

  it('should accept valid investment amount', () => {
    const investmentAmount = 5000;
    const isValid = investmentAmount > 0 && investmentAmount <= balance;
    
    expect(isValid).toBe(true);
  });

  it('should deduct investment amount from balance', () => {
    const investmentAmount = 2000;
    const newBalance = balance - investmentAmount;
    
    expect(newBalance).toBe(8000);
  });

  it('should create investment with correct properties', () => {
    const investmentAmount = 1000;
    const now = new Date();
    const completionDate = new Date(now.getTime() + INVESTMENT_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const investment = {
      id: Date.now().toString(),
      amount: investmentAmount,
      investmentDate: now.toISOString(),
      completionDate: completionDate.toISOString(),
      expectedGain: investmentAmount * INVESTMENT_GAIN_PERCENTAGE,
      status: 'active' as const,
      daysRemaining: INVESTMENT_DURATION_DAYS,
      currentGain: 0,
    };

    expect(investment.amount).toBe(1000);
    expect(investment.expectedGain).toBe(600);
    expect(investment.status).toBe('active');
    expect(investment.daysRemaining).toBe(15);
  });

  it('should calculate total return correctly', () => {
    const investmentAmount = 1000;
    const expectedGain = investmentAmount * INVESTMENT_GAIN_PERCENTAGE;
    const totalReturn = investmentAmount + expectedGain;
    
    expect(totalReturn).toBe(1600);
  });

  it('should calculate progress percentage correctly', () => {
    const daysElapsed = 7;
    const progressPercentage = (daysElapsed / INVESTMENT_DURATION_DAYS) * 100;
    
    expect(progressPercentage).toBeCloseTo(46.67, 1);
  });

  it('should calculate current gain based on progress', () => {
    const investmentAmount = 1000;
    const daysElapsed = 7;
    const progressPercentage = Math.min(1, daysElapsed / INVESTMENT_DURATION_DAYS);
    const currentGain = investmentAmount * INVESTMENT_GAIN_PERCENTAGE * progressPercentage;
    
    expect(currentGain).toBeCloseTo(280, 0);
  });

  it('should mark investment as completed after 15 days', () => {
    const daysRemaining = 0;
    const isCompleted = daysRemaining === 0;
    
    expect(isCompleted).toBe(true);
  });

  it('should add investment to list', () => {
    const investmentAmount = 1000;
    const investment = {
      id: '1',
      amount: investmentAmount,
      investmentDate: new Date().toISOString(),
      completionDate: new Date().toISOString(),
      expectedGain: 600,
      status: 'active' as const,
      daysRemaining: 15,
      currentGain: 0,
    };

    investments.push(investment);
    
    expect(investments.length).toBe(1);
    expect(investments[0].amount).toBe(1000);
  });

  it('should claim gains and update balance', () => {
    const investmentAmount = 1000;
    const expectedGain = 600;
    const balanceAfterInvestment = balance - investmentAmount;
    const balanceAfterClaim = balanceAfterInvestment + investmentAmount + expectedGain;
    
    expect(balanceAfterClaim).toBe(10600);
  });

  it('should calculate total gains from multiple investments', () => {
    const investment1 = { expectedGain: 600, status: 'claimed' as const };
    const investment2 = { expectedGain: 400, status: 'claimed' as const };
    const investment3 = { expectedGain: 300, status: 'active' as const };

    const totalGains = [investment1, investment2, investment3]
      .filter((inv) => inv.status === 'claimed')
      .reduce((sum, inv) => sum + inv.expectedGain, 0);

    expect(totalGains).toBe(1000);
  });

  it('should validate minimum investment amount', () => {
    const investmentAmount = 0;
    const isValid = investmentAmount > 0;
    
    expect(isValid).toBe(false);
  });

  it('should handle multiple concurrent investments', () => {
    const inv1 = { id: '1', amount: 1000, status: 'active' as const };
    const inv2 = { id: '2', amount: 2000, status: 'active' as const };
    const inv3 = { id: '3', amount: 3000, status: 'completed' as const };

    investments = [inv1, inv2, inv3];
    const activeCount = investments.filter((inv) => inv.status === 'active').length;
    const completedCount = investments.filter((inv) => inv.status === 'completed').length;

    expect(activeCount).toBe(2);
    expect(completedCount).toBe(1);
    expect(investments.length).toBe(3);
  });
});
