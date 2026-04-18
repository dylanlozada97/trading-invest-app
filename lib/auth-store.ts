import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "@/constants/oauth";
import { Platform } from "react-native";

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

// Global auth state listeners - allows components to react to logout
type AuthListener = (user: AppUser | null) => void;
const listeners: Set<AuthListener> = new Set();

export function subscribeToAuthChanges(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(user: AppUser | null) {
  listeners.forEach(l => l(user));
}

export async function saveUser(user: AppUser): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  // Also set in web localStorage directly for reliability
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
  }
  notifyListeners(user);
}

export async function loadUser(): Promise<AppUser | null> {
  // On web, try localStorage first for reliability
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const webData = window.localStorage.getItem(STORAGE_KEY);
      if (webData) return JSON.parse(webData);
    } catch {}
  }
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
  const apiBase = getApiBaseUrl() || 'http://localhost:3000';

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
  // Remove from AsyncStorage
  await AsyncStorage.removeItem(STORAGE_KEY);
  // Also remove from web localStorage directly
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    try { window.sessionStorage.clear(); } catch {}
  }
  // Notify all listeners that user is logged out
  notifyListeners(null);
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
