import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: UserRole; jobTitle?: string; department?: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  switchAccount: (email: string, pass: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_USERS: Record<UserRole, { email: string; pass: string; title: string; name: string }> = {
  ROLE_ADMIN: { email: 'admin@nexora.com', pass: 'admin123', title: 'VP of Engineering', name: 'Sarah Jenkins (Admin)' },
  ROLE_PM: { email: 'pm@nexora.com', pass: 'pm123', title: 'Lead Technical PM', name: 'Alex Vance (PM)' },
  ROLE_CLIENT: { email: 'client@nexora.com', pass: 'client123', title: 'Director of Technology', name: 'Elena Rostova (Client)' },
  ROLE_TEAM_MEMBER: { email: 'team3@nexora.com', pass: 'team123', title: 'Team 3 Delivery Lead', name: 'Aarav Mehta (Team 3 Squad)' },
};

export const DEMO_ACCOUNTS = [
  { id: 'admin', role: 'ROLE_ADMIN' as UserRole, email: 'admin@nexora.com', pass: 'admin123', label: 'Admin', title: 'VP of Engineering', name: 'Sarah Jenkins (Admin)' },
  { id: 'pm', role: 'ROLE_PM' as UserRole, email: 'pm@nexora.com', pass: 'pm123', label: 'Project Manager', title: 'Lead Technical PM', name: 'Alex Vance (PM)' },
  { id: 'client', role: 'ROLE_CLIENT' as UserRole, email: 'client@nexora.com', pass: 'client123', label: 'Client', title: 'Director of Technology', name: 'Elena Rostova (Client)' },
  { id: 'team3', role: 'ROLE_TEAM_MEMBER' as UserRole, email: 'team3@nexora.com', pass: 'team123', label: 'Team 3 Lead', title: 'Team 3 Delivery Lead', name: 'Aarav Mehta (Team 3 Squad)' },
  { id: 'team1', role: 'ROLE_TEAM_MEMBER' as UserRole, email: 'team1@nexora.com', pass: 'team123', label: 'Team 1 Lead', title: 'Team 1 Frontend Lead', name: 'Vikram Rao (Team 1 Lead)' },
  { id: 'team2', role: 'ROLE_TEAM_MEMBER' as UserRole, email: 'team2@nexora.com', pass: 'team123', label: 'Team 2 Lead', title: 'Team 2 Backend Lead', name: 'Siddharth Roy (Team 2 Lead)' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await authApi.getCurrentUser();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try to restore user session on load
    authApi.getCurrentUser()
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setUser(res.data);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; role?: UserRole; jobTitle?: string; department?: string }) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      setUser(res.data);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (role: UserRole) => {
    const creds = DEMO_USERS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const switchAccount = async (email: string, pass: string) => {
    await login(email, pass);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, switchRole, switchAccount, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
