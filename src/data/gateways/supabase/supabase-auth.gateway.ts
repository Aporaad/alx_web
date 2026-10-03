import { supabase, upsertDoc, updateDocData, getDocById } from '../../../lib/supabase';
import { getNextAccountCode, createFinancialAccountRecord } from '../../../lib/financialAccountHelper';
import { getCustomerDetails as getCustDetHelper, saveCustomerDetails as saveCustDetHelper } from '../../../lib/custDetailsHelper';
import type { PortalAuthGateway } from '../../contracts/auth.gateway';
import type { PortalUser, RegisterFormData, CustomerDetails, ApprovalStatus } from '../../../types/portalTypes';
import { mapPortalUserRowToDto } from '../../dtos/mappers/user.mapper';

function deriveUsername(email: string, fullName?: string): string {
  if (fullName) {
    const slug = fullName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9أ-ي]/gi, '');
    if (slug.length >= 3) return slug;
  }
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
}

function makeCustomerId(accountNumber: string) { return 'cust_' + accountNumber; }
function makeCourierId(accountNumber: string) { return 'cour_' + accountNumber; }
function makeSourceId(accountNumber: string) { return 'src_' + accountNumber; }

export class SupabaseAuthGateway implements PortalAuthGateway {
  async fetchProfile(uid: string, fallbackEmail?: string, fallbackName?: string): Promise<PortalUser | null> {
    try {
      const { data, error } = await supabase.from('portal_users').select('*').eq('portal_user_id', uid).maybeSingle();
      if (!error && data && data.portal_role) {
        const dto = mapPortalUserRowToDto(data);
        if (dto.portalRole === 'customer') {
          const custDet = await this.getCustomerDetails(uid);
          dto.onboardingCompleted = custDet?.onboardingCompleted ?? dto.onboardingCompleted ?? false;
        }
        return dto;
      }

      // Fallback: search by id or email
      const doc = await getDocById('portal_users', uid);
      if (doc && doc.portalRole) {
        if (doc.portalRole === 'customer') {
          const custDet = await this.getCustomerDetails(uid);
          doc.onboardingCompleted = custDet?.onboardingCompleted ?? doc.onboardingCompleted ?? false;
        }
        return doc as PortalUser;
      }

      return null;
    } catch (err) {
      console.warn('[SupabaseAuthGateway] Error fetching profile:', err);
      return null;
    }
  }

  async login(identifier: string, password: string): Promise<PortalUser> {
    const inputVal = identifier.trim();
    let query = supabase.from('portal_users').select('*');

    if (inputVal.includes('@')) {
      query = query.eq('email', inputVal.toLowerCase());
    } else {
      query = query.or(`username.eq.${inputVal},data->>'phone'.eq.${inputVal}`);
    }

    const { data: userRow, error } = await query.maybeSingle();

    if (error || !userRow) {
      // Secondary fallback check on email/phone/username in JSONB data column
      const { data: jsonUser } = await supabase
        .from('portal_users')
        .select('*')
        .or(`data->>'email'.eq.${inputVal.toLowerCase()},data->>'username'.eq.${inputVal},data->>'phone'.eq.${inputVal}`)
        .maybeSingle();

      if (!jsonUser) {
        throw new Error('بيانات الدخول غير صحيحة. لم يتم العثور على حساب بهذا البريد الإلكتروني أو اسم المستخدم أو الهاتف.');
      }
      return this.verifyAndMapUser(jsonUser, password);
    }

    return this.verifyAndMapUser(userRow, password);
  }

  private async verifyAndMapUser(userRow: any, inputPassword?: string): Promise<PortalUser> {
    const payload = typeof userRow.data === 'string'
      ? JSON.parse(userRow.data)
      : (userRow.data || {});

    const storedPassword = userRow.password || payload.password;
    if (inputPassword && storedPassword && storedPassword !== inputPassword) {
      throw new Error('كلمة المرور غير صحيحة. يرجى التأكد وإعادة المحاولة.');
    }

    if (userRow.disabled || payload.disabled || payload.isDisabled) {
      throw new Error('تم تعطيل هذا الحساب. يرجى التواصل مع الدعم الفني.');
    }

    const status = userRow.approval_status || payload.approvalStatus || 'approved';
    if (status === 'rejected') {
      throw new Error('تم رفض طلب حسابك من إدارة الشركة. يرجى التواصل مع الدعم الفني.');
    }

    const uid = userRow.portal_user_id || userRow.id || userRow.uid || payload.uid || payload.id;
    const dto = mapPortalUserRowToDto(userRow);

    if (dto.portalRole === 'customer') {
      const custDet = await this.getCustomerDetails(uid);
      dto.onboardingCompleted = custDet?.onboardingCompleted ?? dto.onboardingCompleted ?? false;
    }

    return dto;
  }

  async register(formData: RegisterFormData): Promise<{ user: PortalUser; pendingApproval: boolean }> {
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const fullName = formData.fullName.trim();
    const phone = formData.phone.trim();
    const address = (formData.address || '').trim();
    const now = Date.now();
    const isoNow = new Date().toISOString();

    const username = deriveUsername(email, fullName);
    const isCustomer = formData.portalRole === 'customer';
    const isCourier = formData.portalRole === 'courier';
    const isSupplier = formData.portalRole === 'supplier';
    const approvalStatus: ApprovalStatus = isCustomer ? 'approved' : 'pending_approval';
    const entityType: 'customer' | 'courier' | 'supplier' = isCustomer ? 'customer' : isCourier ? 'courier' : 'supplier';
    const currency = isSupplier ? 'USD' : 'YER';
    const entityName = isSupplier ? (formData.companyName || fullName) : fullName;

    // Check if user already exists in public.portal_users
    const { data: existingUser } = await supabase
      .from('portal_users')
      .select('*')
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();

    if (existingUser) {
      throw new Error('هذا البريد الإلكتروني أو اسم المستخدم مسجل مسبقاً، يمكنك تسجيل الدخول مباشرة.');
    }

    // Generate unique portal_user_id for public.portal_users
    const uid = `usr_${now}_${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Get next financial account code
    const { prefix, accountNumber, accountCode, accountId } = await getNextAccountCode(entityType);

    let linkedAccId = '';
    let linkedCustomerId: string | undefined;

    // 2. Create entity record (customers/couriers/sources)
    if (isCustomer) {
      linkedAccId = makeCustomerId(accountNumber);
      linkedCustomerId = linkedAccId;

      await upsertDoc('customers', linkedAccId, {
        customer_id: linkedAccId,
        id: linkedAccId,
        fullName,
        username,
        phone,
        email,
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
      await upsertDoc('couriers', linkedAccId, {
        courier_id: linkedAccId,
        id: linkedAccId,
        fullName,
        phone,
        email,
        address,
        financialAccountId: accountId,
        financialAccountCode: accountCode,
        portalUid: uid,
        createdAt: now,
        updatedAt: now,
      });
    } else if (isSupplier) {
      linkedAccId = makeSourceId(accountNumber);
      await upsertDoc('sources', linkedAccId, {
        source_id: linkedAccId,
        id: linkedAccId,
        name: entityName,
        phone,
        email,
        address,
        financialAccountId: accountId,
        financialAccountCode: accountCode,
        portalUid: uid,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 3. Create financial account
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

    // 4. Create public.portal_users record directly
    const portalProfile: PortalUser = {
      uid,
      portalUserId: uid,
      username,
      phone,
      email,
      fullName,
      portalRole: formData.portalRole,
      approvalStatus,
      type: formData.portalRole,
      linkedAccId,
      linkedCustomerId,
      financialAccountId: accountId,
      financialAccountCode: accountCode,
      financialBalance: 0,
      financialCurrency: currency,
      address,
      onboardingCompleted: isCustomer ? false : true,
      joinBy: formData.joinBy || '',
      referrerId: formData.referrerId || '',
      createdAt: now,
      updatedAt: now,
    };

    await upsertDoc('portal_users', uid, { ...portalProfile, password });

    if (isCustomer) {
      try {
        await saveCustDetHelper({
          userUid: uid,
          customerId: linkedAccId,
          privacyPolicyAgreed: false,
          joinBy: formData.joinBy || '',
          referrerId: formData.referrerId || '',
          onboardingCompleted: false,
        });
      } catch (e) {
        console.warn('[SupabaseAuthGateway] cust_details init warning:', e);
      }
    }

    return { user: portalProfile, pendingApproval: !isCustomer };
  }

  async updateProfile(uid: string, updates: Partial<PortalUser>): Promise<PortalUser> {
    const updatedAt = Date.now();
    await updateDocData('portal_users', uid, { ...updates, updatedAt });

    const updated = await this.fetchProfile(uid);
    if (!updated) throw new Error('فشل تحديث ملف المستخدم');
    return updated;
  }

  async getCustomerDetails(userUid: string): Promise<CustomerDetails | null> {
    return await getCustDetHelper(userUid);
  }

  async saveCustomerDetails(updates: Partial<CustomerDetails> & { userUid: string; customerId?: string }): Promise<CustomerDetails> {
    return await saveCustDetHelper(updates);
  }

  async changePassword(newPassword: string): Promise<void> {
    // Update password in public.portal_users table directly
    const storedUserStr = localStorage.getItem('alx_portal_user_profile') || sessionStorage.getItem('alx_portal_user_profile');
    if (!storedUserStr) throw new Error('لم يتم العثور على بيانات الجلسة');

    const currentUser = JSON.parse(storedUserStr);
    const uid = currentUser.uid || currentUser.portalUserId;

    if (!uid) throw new Error('لم يتم العثور على معرف المستخدم');

    const { error } = await supabase
      .from('portal_users')
      .update({ password: newPassword, updated_at: new Date().toISOString() })
      .eq('portal_user_id', uid);

    if (error) {
      throw new Error(`فشل تغيير كلمة المرور: ${error.message}`);
    }

    await updateDocData('portal_users', uid, { password: newPassword, updatedAt: Date.now() });
  }
}

export const authGateway = new SupabaseAuthGateway();
