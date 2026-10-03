import type { PortalUser, RegisterFormData, CustomerDetails } from '../../types/portalTypes';

export interface PortalAuthGateway {
  fetchProfile(uid: string, fallbackEmail?: string, fallbackName?: string): Promise<PortalUser | null>;
  login(identifier: string, password: string): Promise<PortalUser>;
  register(formData: RegisterFormData): Promise<{ user: PortalUser; pendingApproval: boolean }>;
  updateProfile(uid: string, updates: Partial<PortalUser>): Promise<PortalUser>;
  getCustomerDetails(userUid: string): Promise<CustomerDetails | null>;
  saveCustomerDetails(updates: Partial<CustomerDetails> & { userUid: string; customerId?: string }): Promise<CustomerDetails>;
  changePassword(newPassword: string): Promise<void>;
}
