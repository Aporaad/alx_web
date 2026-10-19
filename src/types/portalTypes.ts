// ─── Portal Types & Data Contracts ────────────────────────────────────────────
// All data structures for the ALX Web Portal (Client-facing).
// كل البيانات تمر عبر alx_api ثم PostgreSQL (أعمدة حقيقية، بلا JSONB) — no Supabase, no `data` blob.
// نماذج الواجهة مطابقة لعقود alx_api في modules/portal/*.contracts.ts.

export type PortalRole = 'customer' | 'courier' | 'supplier';
export type ApprovalStatus = 'approved' | 'pending_approval' | 'rejected';
export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

// ─── Auth & User ──────────────────────────────────────────────────────────────
// نموذج المستخدم في الواجهة، يُبنى من PortalAuthProfileDto العائد من alx_api.
// Local UI model mapped from the API's PortalAuthProfileDto (flattened portal_users table).
export interface PortalUser {
  uid: string;              // Portal user id (portal_users.portal_user_id via alx_api)
  username: string;         // Login/display name (derived from email prefix or chosen)
  email: string;            // Primary login identifier
  fullName: string;         // Full Arabic/English name
  phone: string;            // Mobile number (WhatsApp-compatible)
  portalRole: PortalRole;   // 'customer' | 'courier' | 'supplier'
  approvalStatus: ApprovalStatus;
  address?: string;         // Residential/business address
  gpsLocation?: string;     // GPS coordinates "lat,lng"
  identityDocUrl?: string;  // National ID scan URL (couriers)
  commercialRegisterUrl?: string; // Commercial register URL (suppliers)
  profileImageUrl?: string;
  notes?: string;           // Admin verification notes

  // Linked system entity IDs
  linkedAccId?: string;       // Primary link: ID in customers / couriers / sources
  linkedCustomerId?: string;  // FK -> customers.id  (customer role)
  linkedCourierId?: string;   // FK -> couriers.id   (courier role)
  linkedSourceId?: string;    // FK -> sources.id    (supplier role)

  // Financial fields
  financialAccountId?: string;
  financialAccountCode?: string;
  financialBalance?: number;
  financialCurrency?: string;
  type?: string;

  // Onboarding & Referral fields
  joinBy?: string;            // 'ad' | 'facebook' | 'instagram' | 'friend' | 'courier' | 'employee' | 'other'
  referrerId?: string;        // ID of referring customer/courier/employee
  onboardingCompleted?: boolean;

  createdAt: number;          // Epoch milliseconds
  updatedAt: number;
}

// ─── Customer Details Schema (cust_details table) ──────────────────────────────
export interface LocationDetails {
  country: string;
  governorate: string;
  city: string;
  street: string;
  addressDetails?: string;
  lat?: number | null;
  lng?: number | null;
}

export interface BodyDetails {
  heightCm?: number | null;
  weightKg?: number | null;
  shortsSize?: string;
  coatSize?: string;
  pantsSize?: string;
  shoeSize?: string;
  preferredColors?: string[];
}

export interface AcquisitionSource {
  joinBy: string;             // 'ad' | 'facebook' | 'instagram' | 'friend' | 'courier' | 'employee' | 'other'
  referrerId?: string;        // ID of referrer
  notes?: string;
}

// يطابق PortalCustomerDetailsDto في alx_api (أعمدة حقيقية في cust_details، بلا JSONB).
export interface CustomerDetails {
  id: string;                 // Detail record ID / userUid
  userUid: string;            // FK -> portal_users (user_uid in DB)
  customerId?: string;        // FK -> customers.id (customer_id in DB)
  privacyPolicyAgreed: boolean;
  privacyPolicyAgreedAt?: number;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  location?: LocationDetails;
  bodyDetails?: BodyDetails;
  preferredCategories?: string[];
  acquisitionSource?: AcquisitionSource;
  joinBy?: string;            // (join_by top-level column)
  referrerId?: string;        // (referrer_id top-level column)
  onboardingCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

// ─── Registration Form ────────────────────────────────────────────────────────
export interface RegisterFormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  portalRole: PortalRole;
  address?: string;
  joinBy?: string;
  referrerId?: string;
  // Courier-specific
  courierType?: 'local' | 'sourcing';
  identityDocNote?: string;  // Textual ID info (e.g. "ID: 1234567") until upload
  // Supplier-specific
  companyName?: string;
  commercialRegister?: string;
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending_review'
  | 'accepted'
  | 'in_progress'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

// ─── Financial ────────────────────────────────────────────────────────────────
// نموذج عرض في الواجهة فقط، يُبنى من PortalLedgerEntryDto العائد من alx_api.
// UI view-model for the customer ledger, mapped from the API's PortalLedgerEntryDto.
export interface LedgerEntry {
  id: string;
  userUid?: string;          // FK -> portal_users.id (optional when built from system tables)
  date: number;
  description: string;
  refNumber: string;
  amount: number;
  currency: string;
  type: 'debit' | 'credit';
  runningBalance: number;
  notes?: string;
}

// ─── Courier Tasks ────────────────────────────────────────────────────────────
export interface CourierTask {
  orderId: string;
  trackingNumber: string;
  customerName: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  deliveryCity: string;
  status: OrderStatus;
  cashOnDelivery?: number;
  currency: string;
  assignedAt: number;
}

// ─── Supplier Orders ──────────────────────────────────────────────────────────
// مراحل شحنة المورد كما يعيدها alx_api (SupplierOrderDto.stage) — stages exactly as the API returns them.
export type SupplierOrderStage =
  | 'manufacturing'
  | 'in_transit'
  | 'delivered';

// يطابق SupplierOrderDto في alx_api (portal-owned.contracts.ts).
export interface SupplierOrder {
  id: string;
  trackingNumber: string;
  description: string;
  weightKg: number;
  cbmVolume: number;
  stage: SupplierOrderStage;
  requestedAt: number;
  updatedAt: number;
}

// ─── Support Tickets ──────────────────────────────────────────────────────────
export type TicketType = 'suggestion' | 'complaint' | 'inquiry';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// يطابق PortalTicketDto في alx_api (portal-owned.contracts.ts).
export interface PortalTicket {
  id: string;
  userUid: string;           // FK -> portal_users.id
  userName: string;
  userRole: PortalRole;
  type: TicketType;
  subject: string;
  message: string;
  status: TicketStatus;
  adminResponse?: string;
  respondedAt?: number;
  createdAt: number;
}
