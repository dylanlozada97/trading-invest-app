/**
 * Tipos para recargas por consignación bancaria
 */

export interface BankAccount {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  accountType: 'Corriente' | 'Ahorros';
  documentNumber: string;
}

export interface Recharge {
  id: string;
  amount: number;
  reference: string;
  photoUri: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface RechargeContextType {
  bankAccount: BankAccount;
  recharges: Recharge[];
  addRecharge: (amount: number, reference: string, photoUri: string) => void;
  approveRecharge: (rechargeId: string) => void;
  rejectRecharge: (rechargeId: string, reason: string) => void;
  getPendingRecharges: () => Recharge[];
}
