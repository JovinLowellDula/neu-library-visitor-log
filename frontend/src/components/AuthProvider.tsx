'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  picture: string;
}

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) fetchUser(token);
    else setLoading(false);
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const res = await api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data);
    } catch { localStorage.removeItem('token'); }
    finally { setLoading(false); }
  };

  const login = () => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
  const logout = () => { localStorage.removeItem('token'); setUser(null); router.push('/'); };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);