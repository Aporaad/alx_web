import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { portalAuthGateway } from '../api/portalAuthGateway';
import type { PortalAuthProfileDto } from '../api/portalAuthGateway';
import type { PortalUser, CustomerDetails, RegisterFormData } from '../types/portalTypes';

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

function requirePortalAuthGateway() {
  if (!portalAuthGateway) {
    throw new Error('PORTAL_API_NOT_CONFIGURED');
  }
  return portalAuthGateway;
}

function toPortalUser(profile: PortalAuthProfileDto, previous: PortalUser | null = null): PortalUser {
  return {
    ...previous,
    uid: profile.portalUserId,
    username: profile.username,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    portalRole: profile.role,
    approvalStatus: profile.approvalStatus,
    onboardingCompleted: profile.onboardingCompleted,
    ...(profile.address !== undefined ? { address: profile.address } : {}),
    ...(profile.linkedAccId !== undefined ? { linkedAccId: profile.linkedAccId } : {}),
    ...(profile.linkedCustomerId !== undefined ? { linkedCustomerId: profile.linkedCustomerId } : {}),
    ...(profile.linkedCourierId !== undefined ? { linkedCourierId: profile.linkedCourierId } : {}),
    ...(profile.linkedSourceId !== undefined ? { linkedSourceId: profile.linkedSourceId } : {}),
    ...(profile.financialAccountId !== undefined ? { financialAccountId: profile.financialAccountId } : {}),
    ...(profile.financialAccountCode !== undefined ? { financialAccountCode: profile.financialAccountCode } : {}),
    ...(profile.financialCurrency !== undefined ? { financialCurrency: profile.financialCurrency } : {}),
    ...(profile.joinBy !== undefined ? { joinBy: profile.joinBy } : {}),
    ...(profile.referrerId !== undefined ? { referrerId: profile.referrerId } : {}),
    createdAt: previous?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
}

function deriveUsername(email: string, fullName?: string): string {
  const candidate = fullName?.trim().split(/\s+/)[0] || email.split('@')[0];
  return candidate.toLowerCase().replace(/[^a-z0-9أ-ي]/gi, '').slice(0, 40) || 'portal-user';
}

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const persistProfile = useCallback((profile: PortalUser | null) => {
    setUser(profile);
    if (profile) sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    else sessionStorage.removeItem(SESSION_KEY);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const profile = await requirePortalAuthGateway().getProfile();
        if (active && profile) {
          setUser((prev) => {
            const nextUser = toPortalUser(profile, prev);
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
            return nextUser;
          });
          if (profile.role === 'customer') {
            try {
              const details = await requirePortalAuthGateway().getCustomerDetails();
              if (active) setCustomerDetails(details);
            } catch {
              // Ignore background fetch error
            }
          }
        }
      } catch (error) {
        if (active && error instanceof Error && error.message === 'PORTAL_AUTH_REQUIRED') {
          setUser(null);
          sessionStorage.removeItem(SESSION_KEY);
        }
      } finally {
        if (active) setInitialized(true);
      }
    })();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const profile = await requirePortalAuthGateway().login(identifier.trim(), password);
      let updatedUser: PortalUser | null = null;
      setUser((prev) => {
        updatedUser = toPortalUser(profile, prev);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
        return updatedUser;
      });
      if (profile.role === 'customer') {
        const details = await requirePortalAuthGateway().getCustomerDetails();
        setCustomerDetails(details);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (formData: RegisterFormData) => {
    setLoading(true);
    try {
      const email = formData.email.trim().toLowerCase();
      const result = await requirePortalAuthGateway().register({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email,
        password: formData.password,
        portalRole: formData.portalRole,
        username: deriveUsername(email, formData.fullName),
        ...(formData.address !== undefined ? { address: formData.address.trim() } : {}),
        ...(formData.joinBy !== undefined ? { joinBy: formData.joinBy } : {}),
        ...(formData.referrerId !== undefined ? { referrerId: formData.referrerId } : {}),
        ...(formData.companyName !== undefined ? { companyName: formData.companyName.trim() } : {}),
        ...(formData.commercialRegister !== undefined ? { commercialRegister: formData.commercialRegister.trim() } : {}),
        ...(formData.courierType !== undefined ? { courierType: formData.courierType } : {}),
        ...(formData.identityDocNote !== undefined ? { identityDocNote: formData.identityDocNote.trim() } : {}),
      });
      if (!result.pendingApproval) {
        setUser((prev) => {
          const nextUser = toPortalUser(result.profile, prev);
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
          return nextUser;
        });
      }
      return { pendingApproval: result.pendingApproval };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await requirePortalAuthGateway().logout(); }
    finally {
      setCustomerDetails(null);
      setUser(null);
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await requirePortalAuthGateway().getProfile();
    if (profile) {
      setUser((prev) => {
        const nextUser = toPortalUser(profile, prev);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
        return nextUser;
      });
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<PortalUser>) => {
    const apiUpdates = {
      ...(updates.fullName ? { fullName: updates.fullName } : {}),
      ...(updates.phone ? { phone: updates.phone } : {}),
      ...(updates.address !== undefined ? { address: updates.address } : {}),
    };
    if (Object.keys(apiUpdates).length === 0) return;
    const profile = await requirePortalAuthGateway().updateProfile(apiUpdates);
    setUser((prev) => {
      const nextUser = toPortalUser(profile, prev);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const saveCustomerDetails = useCallback(async (details: Partial<CustomerDetails>) => {
    const result = await requirePortalAuthGateway().saveCustomerDetails(details);
    setCustomerDetails(result);
    setUser((prev) => {
      if (!prev) return prev;
      if (result.onboardingCompleted !== prev.onboardingCompleted) {
        const updated = { ...prev, onboardingCompleted: result.onboardingCompleted };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
    return result;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await requirePortalAuthGateway().changePassword(currentPassword, newPassword);
  }, []);

  return (
    <PortalAuthContext.Provider value={{
      user, customerDetails, loading, initialized, login, register, logout,
      refreshUser, updateProfile, saveCustomerDetails, changePassword,
    }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth(): PortalAuthContextType {
  const context = useContext(PortalAuthContext);
  if (!context) throw new Error('usePortalAuth must be used within PortalAuthProvider');
  return context;
}
