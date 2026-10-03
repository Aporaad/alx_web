// ─── Portal Types & Data Contracts ────────────────────────────────────────────
// All data structures for the ALX Web Portal (Client-facing)
// Aligned with Supabase PostgreSQL Live Database Schema Map

export type PortalRole = 'customer' | 'courier' | 'supplier';
export type ApprovalStatus = 'approved' | 'pending_approval' | 'rejected';
export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

// ─── Auth & User ──────────────────────────────────────────────────────────────
// Mirrors portal_users table in PostgreSQL
export interface PortalUser {
  uid: string;              // Supabase Auth UID (also portal_user_id)
  portalUserId?: string;     // Relational PK -> portal_users.portal_user_id
  username: string;         // Login/display name
  email: string;            // Primary login identifier
  fullName: string;         // Full name
  nameAr?: string;          // Name in Arabic
  nameEn?: string;          // Name in English
  phone: string;            // Mobile number
  portalRole: PortalRole;   // 'customer' | 'courier' | 'supplier'
  approvalStatus: ApprovalStatus;
  disabled?: boolean;
  isDisabled?: boolean;
  address?: string;         // Address
  gpsLocation?: string;     // GPS coordinates "lat,lng"
  identityDocUrl?: string;  // Courier national ID
  commercialRegisterUrl?: string; // Supplier commercial register
  profileImageUrl?: string;
  notes?: string;

  // Linked system entity IDs
  linkedAccId?: string;       // Primary link: ID in customers / couriers / sources
  linkedCustomerId?: string;  // FK -> customers.customer_id
  linkedCourierId?: string;   // FK -> couriers.courier_id
  linkedSourceId?: string;    // FK -> sources.source_id

  // Financial fields
  financialAccountId?: string;   // FK -> accounts.account_id
  financialAccountCode?: string; // e.g. "1130-0001"
  financialBalance?: number;
  financialCurrency?: string;
  type?: string;

  // Onboarding & Referral fields
  joinBy?: string;
  referrerId?: string;
  onboardingCompleted?: boolean;

  createdAt: number | string;
  updatedAt: number | string;
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
  joinBy: string;
  referrerId?: string;
  notes?: string;
}

export interface CustomerDetails {
  id: string;                 // Detail record ID / userUid (cust_detail_id)
  custDetailId?: string;       // Relational PK -> cust_details.cust_detail_id
  userUid: string;            // FK -> portal_users.uid
  customerId?: string;        // FK -> customers.customer_id
  privacyPolicyAgreed: boolean;
  privacyPolicyAgreedAt?: number | string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  location?: LocationDetails;
  bodyDetails?: BodyDetails;
  preferredCategories?: string[];
  acquisitionSource?: AcquisitionSource;
  joinBy?: string;
  referrerId?: string;
  onboardingCompleted: boolean;
  createdAt: number | string;
  updatedAt: number | string;
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
  identityDocNote?: string;
  // Supplier-specific
  companyName?: string;
  commercialRegister?: string;
}

// ─── Orders & Items (orders, order_items tables) ───────────────────────────────
export type OrderStatus =
  | 'pending_review'
  | 'accepted'
  | 'in_progress'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PackageType = 'standard' | 'express' | 'factory_cbm' | 'heavy';

export interface OrderItemDto {
  orderItemId: string;         // Relational PK -> order_items.order_item_id
  orderId: string;            // FK -> orders.order_id
  productId?: string;
  productPrice?: number;
  productUrl?: string;
  trackingNumber?: string;
  productSourceId?: string;
  productSourceUrl?: string;
  productCooler?: string;
  quantity: number;
  totalPrice: number;
  totalWeight?: number;
  totalCbm?: number;
  packagingOptionId?: string;
  packagingOptionPrice?: number;
  isInsured?: boolean;
  insuranceFee?: number;
  itemsStatus?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface PortalOrder {
  id: string;                  // Primary ID (order_id)
  orderId?: string;            // Relational PK -> orders.order_id
  orderNumber: string;         // Sequential Order Number
  trackingNumber: string;      // Tracking Number
  customerUid: string;         // FK -> portal_users.uid
  customerId?: string;         // FK -> customers.customer_id
  orderStatusId?: string;      // FK -> order_status.order_status_id
  orderStatus1?: string;
  orderSourceId?: string;      // Source ID
  deliveryCourierId?: string;  // Delivery Courier FK
  shippingCourierId?: string;  // Shipping Courier FK
  customerName: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  deliveryCity: string;
  packageType: PackageType;
  weightKg?: number;
  cbmVolume?: number;
  goodsDescription: string;
  estimatedCost: number;
  currency: string;
  status: OrderStatus;
  items?: OrderItemDto[];
  shipments?: ShipmentDto[];
  source: 'web_portal';
  courierId?: string;
  courierName?: string;
  attachments?: string[];
  notes?: string;
  createdAt: number | string;
  updatedAt: number | string;
}

// ─── Shipments (shipments table) ──────────────────────────────────────────────
export interface ShipmentDto {
  shipmentId: string;          // Relational PK -> shipments.shipment_id
  orderId: string;             // FK -> orders.order_id
  trackingNumber: string;
  shippingCompanyId?: string;
  courierId?: string;
  shipmentStatus: string;
  shippingCost?: number;
  weight?: number;
  shippingCategoryId?: string;
  contentCategoryId?: string;
  contentCategoryName?: string;
  cartonCount?: number;
  customsFee?: number;
  taxFee?: number;
  otherCategoryFee?: number;
  categoryFeesTotal?: number;
  categoryFeeCurrency?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}

// ─── Double-Entry Financial Entries (main_entry, account_trans) ───────────────
export interface MainEntryDto {
  mainEntryId: string;         // Relational PK -> main_entry.main_entry_id
  entryNumber: string;         // Sequential entry number
  moduleId?: string;
  entryTypeId?: string;
  entryCategory?: string;
  postingStatus: 'draft' | 'posted' | 'voided';
  description: string;
  notes?: string;
  paymentMethod?: string;
  orderId?: string;
  shipmentId?: string;
  effectiveAt?: string | number;
  postedAt?: string | number;
  createdAt: string | number;
  transactions?: AccountTransDto[];
}

export interface AccountTransDto {
  accountTransId: string;      // Relational PK -> account_trans.account_trans_id
  mainEntryId: string;         // FK -> main_entry.main_entry_id
  lineNo: number;
  transType: 'debit' | 'credit';
  accountId: string;           // FK -> accounts.account_id
  amount: number;
  amountOriginal?: number;
  conversionRate?: number;
  entityType?: string;
  entityId?: string;
  paymentMethod?: string;
  orderId?: string;
  shipmentId?: string;
  description?: string;
  createdAt: string | number;
}

// ─── Financial Account (accounts table) ───────────────────────────────────────
export interface FinancialAccountDto {
  accountId: string;           // Relational PK -> accounts.account_id
  accountCode: string;         // e.g. "1130-0001"
  accountNumber: string;
  accountPrefix: string;
  parentCode: string;
  entityId: string;
  entityType: 'customer' | 'courier' | 'supplier';
  entityName: string;
  currency: string;
  type: 'Asset' | 'Liability';
  balance: number;
  debitTotal: number;
  creditTotal: number;
  isActive: boolean;
  accNameAr?: string;
  accNameEn?: string;
  createdAt: string | number;
  updatedAt: string | number;
}

// ─── Legacy Ledger Entry (Client Compatibility View) ──────────────────────────
export interface LedgerEntry {
  id: string;
  userUid?: string;
  date: number | string;
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
  assignedAt: number | string;
}

// ─── Supplier Orders ──────────────────────────────────────────────────────────
export type SupplierOrderStage =
  | 'manufacturing'
  | 'packaging'
  | 'ready_to_ship'
  | 'shipped_to_port'
  | 'delivered';

export interface SupplierOrder {
  id: string;
  trackingNumber: string;
  description: string;
  weightKg?: number;
  cbmVolume?: number;
  stage: SupplierOrderStage;
  sourceId: string;
  requestedAt: number | string;
  updatedAt: number | string;
}

// ─── Support Tickets (portal_tickets table) ───────────────────────────────────
export type TicketType = 'suggestion' | 'complaint' | 'inquiry';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface PortalTicket {
  id: string;
  userUid: string;           // FK -> portal_users.uid
  userName: string;
  userRole: PortalRole;
  type: TicketType;
  subject: string;
  message: string;
  status: TicketStatus;
  adminResponse?: string;
  respondedAt?: number | string;
  createdAt: number | string;
}

// ─── Announcements (announcements table) ─────────────────────────────────────
export type AudienceTarget = 'all' | 'customer' | 'courier' | 'supplier';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  targetAudience: AudienceTarget;
  priority: 'normal' | 'high' | 'urgent';
  isActive: boolean;
  createdAt: number | string;
}

// ─── Context State ────────────────────────────────────────────────────────────
export interface PortalAuthState {
  user: PortalUser | null;
  loading: boolean;
  initialized: boolean;
}
