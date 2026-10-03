import { supabase, updateDocData } from './supabase';
import type { CustomerDetails } from '../types/portalTypes';

/**
 * Fetch CustomerDetails by Supabase Auth user UID.
 * Maps top-level DB columns (user_uid, customer_id, join_by, referrer_id, onboarding_completed)
 * and JSONB data column into a single typed object.
 */
export async function getCustomerDetails(userUid: string): Promise<CustomerDetails | null> {
  if (!userUid) return null;
  try {
    const { data, error } = await supabase
      .from('cust_details')
      .select('*')
      .eq('user_uid', userUid)
      .maybeSingle();

    if (error || !data) return null;

    const payload = typeof data.data === 'string' ? JSON.parse(data.data) : (data.data || {});
    return {
      id: data.id,
      userUid: data.user_uid,
      customerId: data.customer_id || payload.customerId || '',
      joinBy: data.join_by || payload.joinBy || '',
      referrerId: data.referrer_id || payload.referrerId || '',
      onboardingCompleted: Boolean(data.onboarding_completed ?? payload.onboardingCompleted),
      privacyPolicyAgreed: Boolean(payload.privacyPolicyAgreed),
      privacyPolicyAgreedAt: payload.privacyPolicyAgreedAt,
      gender: payload.gender,
      age: payload.age,
      location: payload.location,
      bodyDetails: payload.bodyDetails,
      preferredCategories: payload.preferredCategories || [],
      acquisitionSource: payload.acquisitionSource,
      createdAt: Number(data.created_at || payload.createdAt || Date.now()),
      updatedAt: Number(data.updated_at || payload.updatedAt || Date.now()),
    };
  } catch (err) {
    console.warn('[custDetailsHelper] getCustomerDetails error:', err);
    return null;
  }
}

/**
 * Save or update CustomerDetails in `cust_details` table.
 * Populates top-level columns (user_uid, customer_id, join_by, referrer_id, onboarding_completed)
 * and JSONB `data` column, then syncs join_by & referrer_id to `portal_users` and `customers`.
 */
export async function saveCustomerDetails(
  updates: Partial<CustomerDetails> & { userUid: string; customerId?: string }
): Promise<CustomerDetails> {
  const now = Date.now();
  const existing = await getCustomerDetails(updates.userUid);

  const id = existing?.id || updates.userUid;
  const user_uid = updates.userUid;
  const customer_id = updates.customerId || existing?.customerId || '';
  const join_by = updates.joinBy || updates.acquisitionSource?.joinBy || existing?.joinBy || '';
  const referrer_id = updates.referrerId || updates.acquisitionSource?.referrerId || existing?.referrerId || '';
  const onboarding_completed = updates.onboardingCompleted ?? existing?.onboardingCompleted ?? false;
  const created_at = existing?.createdAt || now;
  const updated_at = now;

  const dataPayload = {
    privacyPolicyAgreed: updates.privacyPolicyAgreed ?? existing?.privacyPolicyAgreed ?? false,
    privacyPolicyAgreedAt: updates.privacyPolicyAgreedAt ?? existing?.privacyPolicyAgreedAt ?? (updates.privacyPolicyAgreed ? now : undefined),
    gender: updates.gender ?? existing?.gender,
    age: updates.age ?? existing?.age,
    location: updates.location ?? existing?.location,
    bodyDetails: updates.bodyDetails ?? existing?.bodyDetails,
    preferredCategories: updates.preferredCategories ?? existing?.preferredCategories ?? [],
    acquisitionSource: updates.acquisitionSource ?? existing?.acquisitionSource ?? (join_by ? { joinBy: join_by, referrerId: referrer_id } : undefined),
    joinBy: join_by,
    referrerId: referrer_id,
    onboardingCompleted: onboarding_completed,
    createdAt: created_at,
    updatedAt: updated_at,
  };

  const row = {
    cust_detail_id: id,
    id,
    user_uid,
    customer_id: customer_id || null,
    join_by: join_by || null,
    referrer_id: referrer_id || null,
    onboarding_completed,
    created_at,
    updated_at,
    data: dataPayload,
  };

  const { error } = await supabase.from('cust_details').upsert(row);
  if (error) {
    console.error('[custDetailsHelper] saveCustomerDetails DB error:', error.message);
    throw new Error(error.message);
  }

  // Sync fields to portal_users
  try {
    await updateDocData('portal_users', user_uid, {
      joinBy: join_by,
      referrerId: referrer_id,
      onboardingCompleted: onboarding_completed,
      updatedAt: now,
    });
    await supabase.from('portal_users').update({
      join_by: join_by || null,
      referrer_id: referrer_id || null,
    }).eq('portal_user_id', user_uid);
  } catch (err: any) {
    console.warn('[custDetailsHelper] sync to portal_users warning:', err.message);
  }

  // Sync fields to customers table if customer_id exists
  if (customer_id) {
    try {
      await updateDocData('customers', customer_id, {
        joinBy: join_by,
        referrerId: referrer_id,
        updatedAt: now,
      });
      await supabase.from('customers').update({
        join_by: join_by || null,
        referrer_id: referrer_id || null,
      }).eq('customer_id', customer_id);
    } catch (err: any) {
      console.warn('[custDetailsHelper] sync to customers warning:', err.message);
    }
  }

  return {
    id,
    userUid: user_uid,
    customerId: customer_id,
    ...dataPayload,
  };
}
