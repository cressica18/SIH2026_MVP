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

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to access context (throws if used outsideProvider)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('vasundhara_token');
    if (token) {
      // Verify the token by calling the refresh endpoint
      // For now, we'll decode it client-side and set user
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.userId,
          phone: payload.phone,
          name: payload.name || payload.phone,
          role: payload.role as UserRole,
          language: payload.language || 'en',
        });
      } catch (e) {
        // Invalid token, clear it
        localStorage.removeItem('vasundhara_token');
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithOtp = async (phone: string): Promise<void> => {
    // Call the OTP send endpoint
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send OTP');
    }

    // In dev mode, the OTP is auto-verified after 5 minutes
    // For now, we'll store the phone and simulate OTP verification
    // The frontend will call verifyOtp after the user enters the OTP
    // For demo, we auto-verify a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[OTP Dev] Phone: ${phone} | OTP: ${otp}`);

    // Simulate successful verification after a short delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Decode JWT and set user
    const payload = JSON.parse(atob(res.headers.get('x-jwt') || '.' split('.')[1] || '{}'));
    setUser({
      id: payload.userId,
      phone,
      name: payload.name || phone,
      role: payload.role as UserRole,
      language: payload.language || 'en',
    });

    // Store token in localStorage
    localStorage.setItem('vasundhara_token', res.headers.get('x-jwt') || '');
  };

  const verifyOtp = async (otp: string): Promise<boolean> => {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otp, phone: user?.phone || '' }),
    });

    if (!res.ok) {
      const err = await res.json();
      // OTP invalid - clear any stored user and show error
      setUser(null);
      localStorage.removeItem('vasundhara_token');
      return false;
    }

    const data = await res.json();
    // Decode JWT from response
    const token = data.tokens.accessToken;
    localStorage.setItem('vasundhara_token', token);

    // Decode payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUser({
      id: payload.userId,
      phone: payload.phone,
      name: payload.name || payload.phone,
      role: payload.role as UserRole,
      language: payload.language || 'en',
    });

    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vasundhara_token');
  };

  const refreshToken = async () => {
    const token = localStorage.getItem('vasundhara_token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: token }),
      });

      if (!res.ok) {
        logout();
        return;
      }

      const data = await res.json();
      localStorage.setItem('vasundhara_token', data.accessToken);
      const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
      setUser({
        id: payload.userId,
        phone: payload.phone,
        name: payload.name || payload.phone,
        role: payload.role as UserRole,
        language: payload.language || 'en',
      });
    } catch (e) {
      logout();
    }
  };

  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, loginWithOtp, verifyOtp, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}