import type { PortalUser, CustomerDetails } from '../../../types/portalTypes';

/**
 * Maps raw PostgreSQL row from `portal_users` table to PortalUser DTO.
 */
export function mapPortalUserRowToDto(row: any): PortalUser {
  if (!row) return {} as PortalUser;

  const payload = typeof row.data === 'string'
    ? JSON.parse(row.data)
    : (row.data || {});

  const uid = row.portal_user_id || row.id || row.uid || payload.uid || payload.id || '';
  const portalUserId = row.portal_user_id || uid;

  return {
    uid,
    portalUserId,
    username: row.username || payload.username || '',
    email: row.email || payload.email || '',
    fullName: row.full_name || payload.fullName || row.name_ar || row.username || 'مستخدم البوابة',
    nameAr: row.name_ar || payload.nameAr || '',
    nameEn: row.name_en || payload.nameEn || '',
    phone: payload.phone || '',
    portalRole: (row.portal_role || payload.portalRole || 'customer'),
    approvalStatus: (row.approval_status || payload.approvalStatus || 'approved'),
    disabled: Boolean(row.disabled ?? row.is_disabled ?? payload.disabled),
    isDisabled: Boolean(row.disabled ?? row.is_disabled ?? payload.isDisabled),
    address: payload.address || '',
    gpsLocation: payload.gpsLocation || '',
    identityDocUrl: payload.identityDocUrl || '',
    commercialRegisterUrl: payload.commercialRegisterUrl || '',
    profileImageUrl: payload.profileImageUrl || '',
    notes: payload.notes || '',

    linkedAccId: row.linked_customer_id || payload.linkedAccId || payload.linkedCustomerId || '',
    linkedCustomerId: row.linked_customer_id || payload.linkedCustomerId || '',
    linkedCourierId: payload.linkedCourierId || '',
    linkedSourceId: payload.linkedSourceId || '',

    financialAccountId: row.account_id || payload.financialAccountId || '',
    financialAccountCode: payload.financialAccountCode || '',
    financialBalance: Number(payload.financialBalance || 0),
    financialCurrency: payload.financialCurrency || 'YER',
    type: payload.type || (row.portal_role || 'customer'),

    joinBy: row.join_by || payload.joinBy || '',
    referrerId: row.referrer_id || payload.referrerId || '',
    onboardingCompleted: Boolean(payload.onboardingCompleted),

    createdAt: row.created_at || payload.createdAt || Date.now(),
    updatedAt: row.updated_at || payload.updatedAt || Date.now(),
  };
}

/**
 * Maps raw PostgreSQL row from `cust_details` table to CustomerDetails DTO.
 */
export function mapCustomerDetailsRowToDto(row: any): CustomerDetails {
  if (!row) return {} as CustomerDetails;

  const payload = typeof row.data === 'string'
    ? JSON.parse(row.data)
    : (row.data || {});

  const id = row.cust_detail_id || row.id || row.user_uid || '';

  return {
    id,
    custDetailId: row.cust_detail_id || id,
    userUid: row.user_uid || payload.userUid || '',
    customerId: row.customer_id || payload.customerId || '',
    privacyPolicyAgreed: Boolean(payload.privacyPolicyAgreed),
    privacyPolicyAgreedAt: payload.privacyPolicyAgreedAt,
    gender: payload.gender,
    age: payload.age ? Number(payload.age) : undefined,
    location: payload.location,
    bodyDetails: payload.bodyDetails,
    preferredCategories: payload.preferredCategories || [],
    acquisitionSource: payload.acquisitionSource,
    joinBy: row.join_by || payload.joinBy || '',
    referrerId: row.referrer_id || payload.referrerId || '',
    onboardingCompleted: Boolean(row.onboarding_completed ?? payload.onboardingCompleted),
    createdAt: row.created_at || payload.createdAt || Date.now(),
    updatedAt: row.updated_at || payload.updatedAt || Date.now(),
  };
}
