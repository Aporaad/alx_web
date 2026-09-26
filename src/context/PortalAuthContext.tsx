import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase, getDocById, upsertDoc, updateDocData, getCollection } from '../lib/supabase';
import { getNextAccountCode, createFinancialAccountRecord } from '../lib/financialAccountHelper';
import type { PortalUser, PortalRole, ApprovalStatus, RegisterFormData, CustomerDetails } from '../types/portalTypes';
import { getCustomerDetails, saveCustomerDetails as saveCustDetailsHelper } from '../lib/custDetailsHelper';

// ─── Context Interface ────────────────────────────────────────────────────────
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

// ─── Helper: derive a safe username ─────────────────────────────────────────
function deriveUsername(email: string, fullName?: string): string {
  if (fullName) {
    const slug = fullName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9أ-ي]/gi, '');
    if (slug.length >= 3) return slug;
  }
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ─── Helper: generate deterministic entity IDs ──────────────────────────────
function makeCustomerId(accountNumber: string) { return 'cust_' + accountNumber; }
function makeCourierId(accountNumber: string) { return 'cour_' + accountNumber; }
function makeSourceId(accountNumber: string) { return 'src_' + accountNumber; }

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
      const details = await getCustomerDetails(uid);
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

  const fetchPortalProfile = useCallback(async (
    uid: string,
    fallbackEmail?: string,
    fallbackName?: string
  ): Promise<PortalUser | null> => {
    try {
      const doc = await getDocById('portal_users', uid);
      if (doc && doc.portalRole) {
        if (doc.portalRole === 'customer') {
          const custDet = await getCustomerDetails(uid);
          doc.onboardingCompleted = custDet?.onboardingCompleted ?? doc.onboardingCompleted ?? false;
        }
        return doc as PortalUser;
      }

      if (fallbackEmail) {
        const allPortalUsers = await getCollection('portal_users');
        const byEmail = allPortalUsers.find(
          u => u.email && u.email.toLowerCase() === fallbackEmail.toLowerCase()
        );
        if (byEmail && byEmail.portalRole) {
          return byEmail as PortalUser;
        }
      }

      if (fallbackEmail) {
        const customers = await getCollection('customers');
        const linkedCustomer = customers.find(
          c => c.email && c.email.toLowerCase() === fallbackEmail.toLowerCase()
        );
        if (linkedCustomer) {
          const customerId = linkedCustomer.id;
          const username = deriveUsername(fallbackEmail, fallbackName);
          const repairedProfile: PortalUser = {
            uid,
            username,
            email: fallbackEmail,
            fullName: linkedCustomer.fullName || fallbackName || username,
            phone: linkedCustomer.phone || '',
            portalRole: 'customer',
            approvalStatus: 'approved',
            address: linkedCustomer.address || '',
            linkedAccId: customerId,
            linkedCustomerId: customerId,
            financialAccountId: linkedCustomer.financialAccountId || '',
            financialAccountCode: linkedCustomer.financialAccountCode || '',
            financialBalance: linkedCustomer.financialBalance || 0,
            financialCurrency: linkedCustomer.financialCurrency || 'YER',
            notes: '',
            createdAt: linkedCustomer.createdAt || Date.now(),
            updatedAt: Date.now(),
          };
          await upsertDoc('portal_users', uid, repairedProfile);
          return repairedProfile;
        }
      }

      return null;
    } catch (err) {
      console.warn('[PortalAuth] Error fetching profile:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const u = data.session.user;
          const profile = await fetchPortalProfile(u.id, u.email, u.user_metadata?.fullName);
          if (profile) persistProfile(profile);
        }
      } catch (e) {
        console.warn('[PortalAuth] Session init error:', e);
      } finally {
        setInitialized(true);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      } else if (session?.user) {
        const u = session.user;
        const profile = await fetchPortalProfile(u.id, u.email, u.user_metadata?.fullName);
        if (profile) persistProfile(profile);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchPortalProfile, persistProfile]);

  const login = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    try {
      let email = identifier.trim().toLowerCase();

      if (!email.includes('@')) {
        const phone = identifier.trim();
        const portalUsers = await getCollection('portal_users');
        const byPhone = portalUsers.find(u => u.phone && u.phone.trim() === phone);
        if (byPhone?.email) {
          email = byPhone.email;
        } else {
          const customers = await getCollection('customers');
          const custByPhone = customers.find(c => c.phone && c.phone.trim() === phone);
          if (custByPhone?.email) {
            email = custByPhone.email;
          } else {
            throw new Error('لم يتم العثور على حساب بهذا رقم الهاتف');
          }
        }
      }

      if (!email.includes('@')) {
        const username = identifier.trim().toLowerCase();
        const portalUsers = await getCollection('portal_users');
        const byUsername = portalUsers.find(u => u.username && u.username.toLowerCase() === username);
        if (byUsername?.email) {
          email = byUsername.email;
        } else {
          throw new Error('لم يتم العثور على حساب بهذا اسم المستخدم');
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني أو كلمة المرور.');
        }
        throw new Error(error.message);
      }

      if (!data.user) throw new Error('فشل تسجيل الدخول. حاول مجدداً.');

      const profile = await fetchPortalProfile(data.user.id, data.user.email, data.user.user_metadata?.fullName);
      if (!profile) {
        throw new Error('لم يتم العثور على حسابك في بوابة الويب. تواصل مع الدعم.');
      }

      if (profile.approvalStatus === 'rejected') {
        throw new Error('تم رفض طلب حسابك من إدارة الشركة. يرجى التواصل مع الدعم الفني.');
      }

      persistProfile(profile);
    } finally {
      setLoading(false);
    }
  }, [fetchPortalProfile, persistProfile]);

  // ── Register: atomic creation of entity + financial account + portal user ────
  const register = useCallback(async (formData: RegisterFormData): Promise<{ pendingApproval: boolean }> => {
    setLoading(true);
    try {
      const email = formData.email.trim().toLowerCase();
      const password = formData.password;
      const fullName = formData.fullName.trim();
      const phone = formData.phone.trim();
      const address = (formData.address || '').trim();
      const now = Date.now();

      const username = deriveUsername(email, fullName);

      const isCustomer = formData.portalRole === 'customer';
      const isCourier = formData.portalRole === 'courier';
      const isSupplier = formData.portalRole === 'supplier';
      const approvalStatus: ApprovalStatus = isCustomer ? 'approved' : 'pending_approval';
      const entityType: 'customer' | 'courier' | 'supplier' =
        isCustomer ? 'customer' : isCourier ? 'courier' : 'supplier';
      const currency = isSupplier ? 'USD' : 'YER';
      const entityName = isSupplier ? (formData.companyName || fullName) : fullName;

      // ── Step 1: Pre-compute the financial account code BEFORE any DB writes ──
      // This ensures all records are written with the correct codes from the start.
      const { prefix, accountNumber, accountCode, accountId } = await getNextAccountCode(entityType);

      // ── Step 2: Create Supabase Auth user ────────────────────────────────────
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { fullName, phone, username, portalRole: formData.portalRole }
        }
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          throw new Error('هذا البريد الإلكتروني مسجل مسبقاً، يمكنك تسجيل الدخول مباشرة.');
        }
        throw new Error(authError.message);
      }

      if (!authData.user) throw new Error('تعذر إنشاء الحساب. يرجى المحاولة مجدداً.');

      const uid = authData.user.id;

      let linkedAccId = '';
      let linkedCustomerId: string | undefined;
      let linkedCourierId: string | undefined;
      let linkedSourceId: string | undefined;

      // ── Step 3: Create entity record WITH financial codes already embedded ────
      if (isCustomer) {
        linkedAccId = makeCustomerId(accountNumber);
        linkedCustomerId = linkedAccId;

        await upsertDoc('customers', linkedAccId, {
          id: linkedAccId,
          fullName,
          username,
          phone,
          email,
          address,
          gps_location: '',
          notes: 'عميل مسجل عبر بوابة الويب',
          financialAccountId: accountId,
          financialAccountCode: accountCode,
          financialBalance: 0,
          financialCurrency: currency,
          portalUid: uid,
          createdAt: now,
          updatedAt: now,
        });

      } else if (isCourier) {
        linkedAccId = makeCourierId(accountNumber);
        linkedCourierId = linkedAccId;

        const courierNotes = [
          'مندوب مسجل عبر بوابة الويب',
          formData.courierType ? `نوع المهمة: ${formData.courierType === 'sourcing' ? 'توريد' : 'توصيل محلي'}` : '',
          formData.identityDocNote ? `بيانات الهوية: ${formData.identityDocNote}` : '',
        ].filter(Boolean).join(' – ');

        await upsertDoc('couriers', linkedAccId, {
          id: linkedAccId,
          fullName,
          phone,
          email,
          address,
          gpsLocation: '',
          disabled: true,
          courierCustomId: '',
          commissionRate: 0,
          courierType: formData.courierType || 'local',
          notes: courierNotes,
          financialAccountId: accountId,
          financialAccountCode: accountCode,
          financialBalance: 0,
          financialCurrency: currency,
          identityDocUrl: '',
          portalUid: uid,
          createdAt: now,
          updatedAt: now,
        });

      } else if (isSupplier) {
        linkedAccId = makeSourceId(accountNumber);
        linkedSourceId = linkedAccId;

        const supplierNotes = [
          'مورد مسجل عبر بوابة الويب',
          formData.companyName ? `الشركة: ${formData.companyName}` : '',
          formData.commercialRegister ? `السجل التجاري: ${formData.commercialRegister}` : '',
        ].filter(Boolean).join(' – ');

        await upsertDoc('sources', linkedAccId, {
          id: linkedAccId,
          name: entityName,
          phone,
          email,
          address,
          supplierType: '',
          notes: supplierNotes,
          financialAccountId: accountId,
          financialAccountCode: accountCode,
          financialBalance: 0,
          financialCurrency: currency,
          portalUid: uid,
          createdAt: now,
          updatedAt: now,
        });
      }

      // ── Step 4: Create the `accounts` table record ───────────────────────────
      await createFinancialAccountRecord({
        accountId,
        accountCode,
        accountNumber,
        prefix,
        entityType,
        entityId: linkedAccId,
        entityName,
        currency,
      });

      // ── Step 5: Create `portal_users` record with full schema ─────────────────
      const portalProfile: PortalUser = {
        uid,
        username,
        phone,
        email,
        fullName,
        portalRole: formData.portalRole,
        approvalStatus,
        type: formData.portalRole,
        linkedAccId,
        linkedCustomerId,
        linkedCourierId,
        linkedSourceId,
        financialAccountId: accountId,
        financialAccountCode: accountCode,
        financialBalance: 0,
        financialCurrency: currency,
        address,
        gpsLocation: '',
        identityDocUrl: '',
        commercialRegisterUrl: '',
        profileImageUrl: '',
        notes: '',
        onboardingCompleted: isCustomer ? false : true,
        joinBy: formData.joinBy || '',
        referrerId: formData.referrerId || '',
        createdAt: now,
        updatedAt: now,
      };

      await upsertDoc('portal_users', uid, portalProfile);

      if (isCustomer) {
        try {
          await saveCustDetailsHelper({
            userUid: uid,
            customerId: linkedAccId,
            privacyPolicyAgreed: false,
            joinBy: formData.joinBy || '',
            referrerId: formData.referrerId || '',
            onboardingCompleted: false,
          });
        } catch (e) {
          console.warn('[PortalAuth] Error initializing cust_details:', e);
        }
      }

      // ── Step 6: Persist session ───────────────────────────────────────────────
      if (authData.session) {
        persistProfile(portalProfile);
      } else {
        try {
          const { data: loginRes } = await supabase.auth.signInWithPassword({ email, password });
          if (loginRes.session) persistProfile(portalProfile);
        } catch (_) { }
      }

      return { pendingApproval: !isCustomer };
    } finally {
      setLoading(false);
    }
  }, [persistProfile]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) { }
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const profile = await fetchPortalProfile(
      data.user.id,
      data.user.email,
      data.user.user_metadata?.fullName
    );
    if (profile) persistProfile(profile);
  }, [fetchPortalProfile, persistProfile]);

  const updateProfile = useCallback(async (updates: Partial<PortalUser>) => {
    if (!user) return;

    const updatedAt = Date.now();
    await updateDocData('portal_users', user.uid, { ...updates, updatedAt });

    const syncFields = {
      fullName: updates.fullName ?? user.fullName,
      phone: updates.phone ?? user.phone,
      address: updates.address ?? user.address,
      gpsLocation: updates.gpsLocation ?? user.gpsLocation,
      updatedAt,
    };

    if (user.portalRole === 'customer' && user.linkedAccId) {
      await updateDocData('customers', user.linkedAccId, {
        ...syncFields,
        email: updates.email ?? user.email,
      });
    } else if (user.portalRole === 'courier' && user.linkedAccId) {
      await updateDocData('couriers', user.linkedAccId, {
        ...syncFields,
        identityDocUrl: updates.identityDocUrl ?? user.identityDocUrl,
      });
    } else if (user.portalRole === 'supplier' && user.linkedAccId) {
      await updateDocData('sources', user.linkedAccId, {
        name: updates.fullName ?? user.fullName,
        phone: syncFields.phone,
        address: syncFields.address,
        updatedAt,
      });
    }

    const updated: PortalUser = { ...user, ...updates, updatedAt };
    persistProfile(updated);
  }, [user, persistProfile]);

  const saveCustomerDetails = useCallback(async (details: Partial<CustomerDetails>): Promise<CustomerDetails> => {
    if (!user) throw new Error('يرجى تسجيل الدخول أولاً');
    const result = await saveCustDetailsHelper({
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

  const changePassword = useCallback(async (_currentPassword: string, newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message || 'فشل تغيير كلمة المرور. يرجى المحاولة مجدداً.');
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
