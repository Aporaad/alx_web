// ─── Portal Types & Data Contracts ────────────────────────────────────────────
// All data structures for the ALX Web Portal (Client-facing)
// Aligned with DATABASE_SCHEMA_DICTIONARY.md

export type PortalRole = 'customer' | 'courier' | 'supplier';
export type ApprovalStatus = 'approved' | 'pending_approval' | 'rejected';
export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

// ─── Auth & User ──────────────────────────────────────────────────────────────
// Mirrors portal_users table (stored inside `data` JSONB column, id = uid)
export interface PortalUser {
  uid: string;              // Supabase Auth UID (also stored as table `id`)
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

  createdAt: number;          // Epoch milliseconds
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

export type PackageType = 'standard' | 'express' | 'factory_cbm' | 'heavy';

// Mirrors portal_orders table
export interface PortalOrder {
  id: string;
  trackingNumber: string;
  customerUid: string;       // FK -> portal_users.id (uid)
  customerId?: string;       // FK -> customers.id (set after linking)
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
  source: 'web_portal';
  courierId?: string;        // FK -> couriers.id (after assignment)
  courierName?: string;
  attachments?: string[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Financial ────────────────────────────────────────────────────────────────
// Mirrors transactions table
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
  requestedAt: number;
  updatedAt: number;
}

// ─── Support Tickets ──────────────────────────────────────────────────────────
export type TicketType = 'suggestion' | 'complaint' | 'inquiry';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// Mirrors portal_tickets table
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

// ─── Announcements ────────────────────────────────────────────────────────────
export type AudienceTarget = 'all' | 'customer' | 'courier' | 'supplier';

// Mirrors announcements table
export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  targetAudience: AudienceTarget;
  priority: 'normal' | 'high' | 'urgent';
  isActive: boolean;
  createdAt: number;
}

// ─── Context ──────────────────────────────────────────────────────────────────
export interface PortalAuthState {
  user: PortalUser | null;
  loading: boolean;
  initialized: boolean;
}
