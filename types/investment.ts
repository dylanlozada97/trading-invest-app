/**
 * Tipos para la lógica de inversiones
 */

export interface Investment {
  id: string;
  amount: number;
  investmentDate: string;
  completionDate: string;
  expectedGain: number;
  status: 'active' | 'completed' | 'claimed';
  daysRemaining: number;
  currentGain: number;
}

export interface InvestmentContextType {
  balance: number;
  totalGains: number;
  investments: Investment[];
  addInvestment: (amount: number) => void;
  claimGains: (investmentId: string) => void;
  updateInvestments: () => void;
}

export interface InvestmentStats {
  totalInvested: number;
  totalGains: number;
  activeInvestments: number;
  completedInvestments: number;
}
