import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext } from "react";

export interface AppUser {
  id: number;
  username: string;
  email: string;
  balance: string;
  totalReferrals: number;
  referralCode: string;
  referredBy: string | null;
}

export interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = "auth_user";

export async function saveUser(user: AppUser): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export async function loadUser(): Promise<AppUser | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

export async function syncUserFromServer(userId: number): Promise<AppUser | null> {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/trpc/investment.getUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: { userId } })
    });
    const data = await response.json();
    const user = data.result?.data?.json;
    if (user) {
      await saveUser(user);
      return user;
    }
  } catch (error) {
    console.error('Error syncing user:', error);
  }
  return null;
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "INV-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getReferralLevel(totalReferrals: number): { name: string; percentage: number } {
  if (totalReferrals >= 25) return { name: "Diamond", percentage: 30 };
  if (totalReferrals >= 20) return { name: "Platinum", percentage: 25 };
  if (totalReferrals >= 15) return { name: "Gold", percentage: 20 };
  if (totalReferrals >= 10) return { name: "Silver", percentage: 15 };
  if (totalReferrals >= 5) return { name: "Bronze", percentage: 10 };
  return { name: "Bronce", percentage: 5 };
}
