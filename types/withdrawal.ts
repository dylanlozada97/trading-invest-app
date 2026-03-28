/**
 * Tipos para sistema de retiros
 */

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  bankAccount?: string;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
}

export interface WithdrawalContextType {
  withdrawals: Withdrawal[];
  lastWithdrawalDate: string | null;
  canWithdraw: boolean;
  nextWithdrawalDate: string | null;
  requestWithdrawal: (userId: string, amount: number, bankAccount: string) => Promise<void>;
  getWithdrawalsByUserId: (userId: string) => Withdrawal[];
  getLastWithdrawalDate: (userId: string) => string | null;
  getNextWithdrawalDate: (userId: string) => string | null;
  canWithdrawNow: (userId: string) => boolean;
}
