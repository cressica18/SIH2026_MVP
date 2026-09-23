import { createContext, useContext, useState, useEffect } from 'react';

// Types for auth state
export type UserRole = 'farmer' | 'buyer' | 'logistics' | 'admin';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  language: 'en' | 'hi' | 'mr' | 'te' | 'pa';
}

// Demo phone numbers for each role (from seed data)
export const DEMO_PHONES: Record<UserRole, string> = {
  farmer: '+91 98231 44521',
  buyer: '+91 99801 88301',
  logistics: '+91 98224 55198',
  admin: '+91 99999 99999',
};

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingPhone: string | null;
  loginWithOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; role?: UserRole }>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to access context (throws if used outside Provider)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Stores phone between OTP send and OTP verify steps
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('vasundhara_token');
    if (token) {
      const payload = decodeJwt(token);
      if (payload && payload.exp && (payload.exp as number) * 1000 > Date.now()) {
        // Validate that the role is a valid UserRole
        const validRoles: UserRole[] = ['farmer', 'buyer', 'logistics', 'admin'];
        if (validRoles.includes(payload.role as UserRole)) {
          setUser({
            id: payload.userId as string,
            phone: payload.phone as string,
            name: (payload.name as string) || (payload.phone as string),
            role: payload.role as UserRole,
            language: (payload.language as 'en' | 'hi' | 'mr' | 'te' | 'pa') || 'en',
          });
        } else {
          // Invalid role in token, clear stale auth state
          localStorage.removeItem('vasundhara_token');
          localStorage.removeItem('vasundhara_refresh_token');
          setUser(null);
        }
      } else {
        // Token expired, clear it
        localStorage.removeItem('vasundhara_token');
        localStorage.removeItem('vasundhara_refresh_token');
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  // Step 1: Request OTP to be sent to phone
  const loginWithOtp = async (phone: string): Promise<void> => {
    // Reset pending phone from any previous attempt
    setPendingPhone(null);

    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send OTP');
    }

    // Store phone so verifyOtp can use it
    setPendingPhone(phone);
  };

  // Step 2: Submit OTP for verification — returns success + role for redirect
  const verifyOtp = async (
    phone: string,
    otp: string
  ): Promise<{ success: boolean; role?: UserRole }> => {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });

    if (!res.ok) {
      return { success: false };
    }

    const data = await res.json();
    const accessToken: string = data.tokens?.accessToken || data.accessToken;
    const refreshTokenStr: string = data.tokens?.refreshToken || data.refreshToken;

    if (!accessToken) return { success: false };

    localStorage.setItem('vasundhara_token', accessToken);
    if (refreshTokenStr) {
      localStorage.setItem('vasundhara_refresh_token', refreshTokenStr);
    }

    const payload = decodeJwt(accessToken);
    if (!payload) return { success: false };

    const userObj: User = {
      id: (payload.userId as string) || `user_${Date.now()}`,
      phone: (payload.phone as string) || phone,
      name: (payload.name as string) || data.user?.name || phone,
      role: payload.role as UserRole,
      language: (payload.language as 'en' | 'hi' | 'mr' | 'te' | 'pa') || 'en',
    };

    setUser(userObj);
    setPendingPhone(null);
    return { success: true, role: userObj.role };
  };

  const logout = () => {
    setUser(null);
    setPendingPhone(null);
    localStorage.removeItem('vasundhara_token');
    localStorage.removeItem('vasundhara_refresh_token');
  };

  const refreshToken = async () => {
    const token = localStorage.getItem('vasundhara_refresh_token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });

      if (!res.ok) {
        logout();
        return;
      }

      const data = await res.json();
      const newAccess = data.accessToken;
      const newRefresh = data.refreshToken;

      if (newAccess) localStorage.setItem('vasundhara_token', newAccess);
      if (newRefresh) localStorage.setItem('vasundhara_refresh_token', newRefresh);

      const payload = decodeJwt(newAccess);
      if (payload) {
        setUser({
          id: payload.userId as string,
          phone: payload.phone as string,
          name: (payload.name as string) || (payload.phone as string),
          role: payload.role as UserRole,
          language: (payload.language as 'en' | 'hi' | 'mr' | 'te' | 'pa') || 'en',
        });
      }
    } catch {
      logout();
    }
  };

  const switchRole = async (role: UserRole) => {
    // Log out current user and clear all auth state
    logout();
    // Initiate login with demo phone for the target role
    // logout already clears user, pendingPhone, and localStorage tokens
    const phone = DEMO_PHONES[role];
    await loginWithOtp(phone);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="text-stone-600 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        pendingPhone,
        loginWithOtp,
        verifyOtp,
        logout,
        refreshToken,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}