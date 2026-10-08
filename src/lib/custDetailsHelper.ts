import type { CustomerDetails } from '../types/portalTypes';

/**
 * @deprecated Legacy CustomerDetails helper. Use portalAuthGateway instead.
 */
export async function getCustomerDetails(_userUid: string): Promise<CustomerDetails | null> {
  return null;
}

export async function saveCustomerDetails(
  updates: Partial<CustomerDetails> & { userUid: string; customerId?: string },
): Promise<CustomerDetails> {
  const now = Date.now();
  return {
    id: updates.userUid,
    customerId: updates.customerId || '',
    privacyPolicyAgreed: updates.privacyPolicyAgreed ?? false,
    preferredCategories: updates.preferredCategories || [],
    joinBy: updates.joinBy || '',
    referrerId: updates.referrerId || '',
    onboardingCompleted: updates.onboardingCompleted ?? false,
    createdAt: now,
    updatedAt: now,
    ...updates,
  };
}

