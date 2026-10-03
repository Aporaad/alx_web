import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authGateway } from '../data/gateways/supabase/supabase-auth.gateway';
import type { PortalUser, RegisterFormData, CustomerDetails } from '../types/portalTypes';

interface PortalAuthContextType {
  user: PortalUser | null;
  customerDetails: CustomerDetails | null;
  loading: boolean;
  initialized: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<{ pendingApproval: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<PortalUser>) => Promise<void>;
  saveCustomerDetails: (details: Partial<CustomerDetails>) => Promise<CustomerDetails>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextType | null>(null);
const SESSION_KEY = 'alx_portal_user_profile';

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadCustDetails = useCallback(async (uid: string) => {
    try {
      const details = await authGateway.getCustomerDetails(uid);
      setCustomerDetails(details);
    } catch (_) {}
  }, []);

  const persistProfile = useCallback((profile: PortalUser) => {
    setUser(profile);
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    if (profile.portalRole === 'customer') {
      loadCustDetails(profile.uid);
    }
  }, [loadCustDetails]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const saved = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const uid = parsed.uid || parsed.portalUserId;
          if (uid) {
            const freshProfile = await authGateway.fetchProfile(uid);
            if (freshProfile) {
              persistProfile(freshProfile);
            }
          }
        }
      } catch (e) {
        console.warn('[PortalAuth] Session init error:', e);
      } finally {
        setInitialized(true);
      }
    };

    initAuth();
  }, [persistProfile]);

  const login = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const profile = await authGateway.login(identifier, password);
      persistProfile(profile);
    } finally {
      setLoading(false);
    }
  }, [persistProfile]);

  const register = useCallback(async (formData: RegisterFormData): Promise<{ pendingApproval: boolean }> => {
    setLoading(true);
    try {
      const { user: profile, pendingApproval } = await authGateway.register(formData);
      persistProfile(profile);
      return { pendingApproval };
    } finally {
      setLoading(false);
    }
  }, [persistProfile]);

  const logout = useCallback(async () => {
    setUser(null);
    setCustomerDetails(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.uid) return;
    const profile = await authGateway.fetchProfile(user.uid);
    if (profile) persistProfile(profile);
  }, [user, persistProfile]);

  const updateProfile = useCallback(async (updates: Partial<PortalUser>) => {
    if (!user) return;
    const updated = await authGateway.updateProfile(user.uid, updates);
    persistProfile(updated);
  }, [user, persistProfile]);

  const saveCustomerDetails = useCallback(async (details: Partial<CustomerDetails>): Promise<CustomerDetails> => {
    if (!user) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = await authGateway.saveCustomerDetails({
      ...details,
      userUid: user.uid,
      customerId: user.linkedCustomerId || user.linkedAccId,
    });
    setCustomerDetails(result);
    if (result.onboardingCompleted !== user.onboardingCompleted) {
      const updatedUser = { ...user, onboardingCompleted: result.onboardingCompleted };
      persistProfile(updatedUser);
    }
    return result;
  }, [user, persistProfile]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authGateway.changePassword(newPassword);
  }, []);

  return (
    <PortalAuthContext.Provider value={{
      user, customerDetails, loading, initialized,
      login, register, logout, refreshUser, updateProfile, saveCustomerDetails, changePassword
    }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth(): PortalAuthContextType {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth must be used within PortalAuthProvider');
  return ctx;
}
