import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "@/constants/oauth";

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

/**
 * Sync user data from the server using the correct API base URL.
 * If userId is 0 or invalid, falls back to searching by username.
 */
export async function syncUserFromServer(userId: number, username?: string): Promise<AppUser | null> {
  // Use the same URL helper as the rest of the app
  const apiBase = getApiBaseUrl() || 'http://localhost:3000';

  // If userId is valid (> 0), try fetching by ID first (getUser is a GET query)
  if (userId > 0) {
    try {
      const input = encodeURIComponent(JSON.stringify({ json: { userId } }));
      const response = await fetch(`${apiBase}/api/trpc/investment.getUser?input=${input}`);
      if (response.ok) {
        const data = await response.json();
        const user = data?.result?.data?.json;
        if (user && user.id > 0) {
          const appUser: AppUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            balance: user.balance,
            totalReferrals: user.totalReferrals,
            referralCode: user.referralCode,
            referredBy: user.referredBy || null,
          };
          await saveUser(appUser);
          return appUser;
        }
      }
    } catch (error) {
      console.error('[syncUser] Error fetching by ID:', error);
    }
  }

  // Fallback: search by username (getUserByUsername is a POST mutation)
  if (username) {
    try {
      const response = await fetch(`${apiBase}/api/trpc/investment.getUserByUsername`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { username } })
      });
      if (response.ok) {
        const data = await response.json();
        const user = data?.result?.data?.json;
        if (user && user.id > 0) {
          const appUser: AppUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            balance: user.balance,
            totalReferrals: user.totalReferrals,
            referralCode: user.referralCode,
            referredBy: user.referredBy || null,
          };
          await saveUser(appUser);
          return appUser;
        }
      }
    } catch (error) {
      console.error('[syncUser] Error fetching by username:', error);
    }
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
