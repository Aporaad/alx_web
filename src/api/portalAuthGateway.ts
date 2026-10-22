import type {
  ApprovalStatus,
  CustomerDetails,
  PortalRole,
} from "../types/portalTypes";
import { portalApiConfig } from "./config";

export type PortalTicketType = "inquiry" | "suggestion" | "complaint";

export interface PortalTicketDto {
  id: string;
  userUid: string;
  userName: string;
  userRole: PortalRole;
  type: PortalTicketType;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  adminResponse?: string;
  respondedAt?: number;
  createdAt: number;
}

/** طلب توظيف (§4.8/D5): حقول مقدم الطلب فقط؛ الحالة يديرها الموظف. */
/** Job request (D5): applicant fields only; status is staff-managed. */
export interface PortalJobRequestDto {
  id: string;
  fullName?: string;
  phone?: string;
  email?: string;
  jobPosition?: string;
  category?: string;
  city?: string;
  qualification?: string;
  experienceYears?: number;
  notes?: string;
  status: string;
  createdAt: number;
}

export interface PortalJobRequestInput {
  fullName: string;
  phone: string;
  email?: string;
  jobPosition: string;
  category?: string;
  city?: string;
  qualification?: string;
  experienceYears?: number;
  notes?: string;
}

export interface PortalOrderDto {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  status: string;
  orderStatus: string;
  createdAt: number;
  [customerVisibleField: string]: unknown;
}

/** مصدر شراء مفعّل يُعرض في الخطوة الأولى من نموذج الطلب — لا بيانات خاصة. */
export interface PortalOrderSourceDto {
  id: string;
  name: string;
  type: string;
}

/** صنف من أصناف العميل (order_items) بلا معرّفات مصدر داخلية ولا تكلفة/ربح. */
export interface PortalCustomerOrderItemDto {
  orderItemId: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  productUrl?: string;
  quantity: number;
  productPrice: number;
  unitWeight: number;
  unitCbm: number;
  trackingNumber?: string;
  itemsStatus?: string;
  createdAt: number;
}

/** لقطة آخر طلب لمنتج سبق للعميل طلبه — تُستخدم في زر "اختيار منتج سابق". */
export interface PortalPreviousProductDto {
  productName: string;
  productUrl?: string;
  quantity: number;
  productPrice: number;
  unitWeight: number;
  unitCbm: number;
  timesOrdered: number;
  lastOrderedAt: number;
}

/** عنصر سلة/مرتجعات العميل — بلا تكلفة أو ربح أو معرّفات داخلية غير مرتبطة به. */
export interface PortalCartItemDto {
  returnId: string;
  orderId?: string;
  orderNumber?: string;
  productName: string;
  productUrl?: string;
  quantity: number;
  returnStatus?: string;
  returnedAt: number;
}

/** شحنة العميل — بلا تكلفة شحن داخلية ولا معرّف ناقل. */
export interface PortalShipmentDto {
  shipmentId: string;
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  status: string;
  orderStatus?: string;
  shippingType?: string;
  source?: string;
  destination?: string;
  contentCategoryName?: string;
  cartonCount?: number;
  weight?: number;
  shippedAt?: number;
  expectedArrival?: number;
  deliveredAt?: number;
  createdAt: number;
}

/** خيار بنك في خطوة الدفع (D4): رمز الحساب + الاسم فقط — لا رصيد ولا كيان. */
export interface PortalBankDto {
  accountId: string;
  accountCode: string;
  name: string;
}

/** خيار مرجعي من order_option (فئة شحن أو تغليف). */
export interface PortalReferenceOptionDto {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  price: number;
  duration: number;
}

/** فئة محتوى شحنة من items_category — تشمل رسوم الكرتون. */
export interface PortalItemCategoryDto {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  feeCurrency: string;
  customsPerCarton: number;
  taxPerCarton: number;
  otherFeesPerCarton: number;
  requiresReview: boolean;
}

/** حالة طلب مرجعية من order_status — للعرض/الفلترة. */
export interface PortalOrderStatusDto {
  id: string;
  nameAr: string;
  nameEn: string;
  color: string;
  sortOrder: number;
}

/** إعدادات نموذج البوابة من الخادم: تأمين افتراضي + عملة افتراضية + مدة شحن افتراضية (بلا أسرار). */
export interface PortalFormSettingsDto {
  defaultProductInsuranceFee: number;
  defaultCurrencyCode: string;
  defaultCurrencySymbol: string;
  /** مدة الشحن الافتراضية بالأيام من settings_general — تُعبّئ حقل المدة للقراءة فقط. */
  /** Default shipping duration in days from settings_general — fills the read-only duration field. */
  defaultShippingDurationDays: number;
}

/**
 * جسم إنشاء شحنة من البوابة (POST /portal/shipments) — مدة الوصول والوصول المتوقع يحسبهما الخادم
 * من الإعدادات ولا يُقبلان من العميل.
 * Portal shipment-create body (POST /portal/shipments) — duration and expected arrival are computed
 * server-side from settings and never accepted from the customer.
 */
export interface PortalShipmentCreateInput {
  contentCategoryId?: string;
  cartonCount: number;
  weight: number;
  shippingType?: string;
  shippingSource?: string;
  shippingDestination?: string;
  description?: string;
  paymentCurrencyCode?: string;
  payLater?: boolean;
  amountPaid?: number;
  bankReference?: string;
  bankAccountId?: string;
}

/** معاينة رقم الطلب/الشحنة (ALX-YYMM-nnnn) محسوبة خادميًا على طلبات العميل نفسه؛ غير محفوظة. */
export interface PortalOrderCodePreviewDto {
  previewCode: string;
}

/** عملة مرجعية من currency مع آخر سعر صرف (الأساس=1) لأداة المصارفة. */
export interface PortalCurrencyRefDto {
  currencyId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  flag: string;
  isDefault: boolean;
  rate: number;
}

/** عملة محلولة من public.currency — رمز + رمز مختصر (D2، بلا حرفية). */
export interface PortalCurrencyDto {
  code: string;
  symbol: string;
}

/**
 * عرض سعر من الخادم: المستحق بعملة واحدة + وزن/حجم. لا ربح/تكلفة داخلية/سعر صرف.
 * Server quote: single payable + weight/CBM. No profit, internal shipping cost, or FX rate.
 * الحقول الاختيارية = تكاليف موجّهة للعميل فقط (تغليف/تأمين/كوبون) ومصروفة لعملة الدفع عند الطلب.
 * Optional fields are customer-facing charges only (packaging/insurance/coupon) plus FX payable.
 */
export interface PortalOrderQuoteDto {
  payableAmount: number;
  currency: PortalCurrencyDto;
  totalWeight: number;
  totalCBM: number;
  packagingOptionsFee?: number;
  productInsuranceFee?: number;
  couponDeduction?: number;
  paymentPayable?: {
    amount: number;
    currency: PortalCurrencyDto;
    rate: number;
  };
}

/** رصيد الحساب المالي للعميل المرتبط فقط، بعملة الحساب نفسه. */
export interface PortalCustomerBalanceDto {
  balance: number;
  currency: PortalCurrencyDto;
}

/** إحصاءات مالية على طلبات العميل المملوكة فقط: عدّ بالحالة + مدفوع/متبقٍّ بعملة المستحق. */
export interface PortalCustomerFinanceStatsDto {
  totalOrders: number;
  statusCounts: Record<string, number>;
  totalPaid: number;
  totalOutstanding: number;
  currency: PortalCurrencyDto;
}

/** حقول تواصل قابلة للتعديل على طلب المعلّق (D7) — نصّية فقط. */
export interface PortalCustomerOrderUpdateFields {
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  deliveryCity?: string;
  goodsDescription?: string;
}

export interface PortalPaymentRequestDto {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: "cash" | "transfer" | "wallet" | "check";
  reference?: string;
  notes?: string;
  status: "pending_verification" | "settled" | "rejected";
  financeEntryId?: string;
  reviewNote?: string;
  createdAt: number;
  reviewedAt?: number;
}

export interface PortalPaymentRequestInput {
  amount: number;
  currency: PortalPaymentRequestDto["currency"];
  paymentMethod: PortalPaymentRequestDto["paymentMethod"];
  reference?: string;
  notes?: string;
  /** حساب البنك المحوَّل إليه — يبني القيد غير المرحّل (مدين: بنك 112 / دائن: حساب العميل). */
  /** The transferred-to bank account — builds the draft entry (debit: bank 112 / credit: customer account). */
  bankAccountId?: string;
}

export interface PortalLedgerEntryDto {
  transactionId: string;
  entryId: string;
  entryNumber: string;
  transType: string;
  accountId: string;
  amount: number;
  amountOriginal: number;
  currencyOriginalNo: number;
  paymentMethod?: string;
  description?: string;
  note?: string;
  createdAt: number;
}

/** إعلان عام للوحة التحكم — نص عام بلا بيانات ملكية أو داخلية. */
export interface PortalAnnouncementDto {
  id: string;
  title: string;
  content: string;
  priority: "normal" | "high" | "urgent";
  createdAt: number;
}

/** حركة ضمن كشف حساب العميل — بلا معرّف حساب داخلي ولا رقم عملة داخلية (D3). */
export interface PortalStatementEntryDto {
  entryNumber: string;
  transType: string;
  amount: number;
  paymentMethod?: string;
  description?: string;
  note?: string;
  createdAt: number;
}

/** كشف حساب مخصص (D3): حركات مُرحّلة مملوكة للعميل ضمن فترة/نوع + عملة الحساب. */
export interface PortalCustomerStatementDto {
  currency: PortalCurrencyDto;
  from?: number;
  to?: number;
  type?: string;
  entries: PortalStatementEntryDto[];
}

export interface PortalStatementQuery {
  from?: number;
  to?: number;
  type?: string;
  limit?: number;
  offset?: number;
}

export type PortalCustomerDetailsDto = CustomerDetails;
export type PortalCustomerDetailsUpdateInput = Partial<
  Pick<
    CustomerDetails,
    | "privacyPolicyAgreed"
    | "gender"
    | "age"
    | "location"
    | "bodyDetails"
    | "preferredCategories"
    | "acquisitionSource"
    | "joinBy"
    | "referrerId"
    | "onboardingCompleted"
  >
>;

export interface PortalOrderCreateInput {
  orderSourceId?: string;
  externalOrderNumber?: string;
  cartShareCode?: string;
  /** رقم التتبع الدولي الذي يدخله العميل في الخطوة 1 (نص حر كما نموذج النظام). */
  trackingNumber?: string;
  items: Array<{
    productName: string;
    productUrl?: string;
    quantity: number;
    productPrice: number;
    weight?: number;
    cbm?: number;
    length?: number;
    width?: number;
    height?: number;
    trackingNumber?: string;
    /** فئة الصنف من items_category (بيانات حقيقية) — تُحفَظ داخل order_data. */
    itemCategoryId?: string;
    itemCategoryName?: string;
    /** خيار التغليف من order_option — السعر يُقبل من الخادم فقط. */
    packagingOptionId?: string;
    packagingOptionPrice?: number;
    isInsured?: boolean;
    insuranceFee?: number;
  }>;
  packagingType: "normal" | "gift" | "vip";
  isUrgent: boolean;
  packageType: "standard" | "express" | "factory_cbm" | "heavy";
  paymentMethod?: "Cash" | "Transfer" | "Wallet";
  notes?: string;
  /** كوبون الخصم (الخطوة 2) — مبلغ يخصمه الخادم (D8). */
  couponEnabled?: boolean;
  couponRate?: number;
  /** P9: رمز كوبون نظام إدارة الميزات — يُتحقّى ويُحسب الخصم خادميًا ولا يُستهلك إلا عند إنشاء الطلب. */
  /** P9: a featuresManagement coupon code — validated & priced server-side; consumed only on order create. */
  couponCode?: string;
  /** دفعة الخطوة 4 عبر بنك — الخادم يحلّ العملة ويحوّل ويسقف المدفوع. */
  payLater?: boolean;
  amountPaid?: number;
  paymentCurrencyCode?: string;
  bankReference?: string;
  bankAccountId?: string;
  /** فئة الشحن (الخطوة 3) من order_option (shipping_category) — تُخزَّن داخل order_data. لا DDL. */
  shippingCategoryId?: string;
}

// ── P11: عقود بوابة العميل لنظام إدارة الميزات (المسابقات/الجوائز/الكوبونات) ──
// P11: customer-facing contracts for the features-management system (contests / awards / coupons).
// كل الحقول مسطّحة وcamelCase؛ الواجهة لا تحسب خصمًا ولا تقرر أهلية ولا تلمس قاعدة البيانات.
// Every field is a flat camelCase property; the UI computes no discount, decides no eligibility, touches no DB.
export interface PortalFeatureContestDto {
  contestId: string;
  title: string;
  description: string;
  status: string;
  startsAt: number;
  endsAt: number;
  termsVersion: string;
}

export interface PortalFeatureContestDetailDto {
  contest: PortalFeatureContestDto;
  prizes: Array<{ name: string; prizeType: string }>;
  entryStatus: string | null;
  hasEntered: boolean;
}

export interface PortalFeatureAwardDto {
  awardId: string;
  contestTitle: string;
  prizeName: string;
  prizeType: string;
  status: string;
  claimDeadline: number | null;
  claimedAt: number | null;
  deliveredAt: number | null;
}

/** §11.2 مشاركاتي: سجل مشاركة العميل في المسابقات — قراءة فقط من الخادم. */
/** §11.2 My Entries: the customer's contest participation list — read-only from the server. */
export interface PortalFeatureEntryDto {
  entryId: string;
  contestId: string;
  contestTitle: string;
  status: string;
  termsVersion: string;
  termsAcceptedAt: number | null;
  createdAt: number | null;
}

export interface PortalFeatureCouponDto {
  issuanceId: string;
  issuedCode: string;
  status: string;
  expiresAt: number | null;
  code: string;
  discountType: string;
  amount: number;
  percent: number;
  currencyCode: string;
  minimumProductsSubtotal: number;
  maxDiscount: number;
}

export interface PortalCouponValidationDto {
  eligible: boolean;
  discount: number;
  couponId: string | null;
  reason?: string;
}

export interface PortalAuthProfileDto {
  portalUserId: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: PortalRole;
  approvalStatus: ApprovalStatus;
  onboardingCompleted: boolean;
  address?: string;
  linkedAccId?: string;
  linkedCustomerId?: string;
  linkedCourierId?: string;
  linkedSourceId?: string;
  financialAccountId?: string;
  financialAccountCode?: string;
  financialCurrency?: string;
  joinBy?: string;
  referrerId?: string;
}

export interface PortalRegistrationInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  portalRole: PortalRole;
  username?: string;
  address?: string;
  joinBy?: string;
  referrerId?: string;
  companyName?: string;
  commercialRegister?: string;
  courierType?: "local" | "sourcing";
  identityDocNote?: string;
}

export interface PortalRegistrationResult {
  profile: PortalAuthProfileDto;
  pendingApproval: boolean;
  tokens: PortalAuthTokenPairDto | null;
}

interface PortalAuthTokenPairDto {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  /** عمر رمز الوصول بالثواني كما أعاده الخادم، لجدولة التجديد قبل انتهائه. The access-token lifetime from the server, so renewal is armed before it lapses. */
  expiresInSeconds: number;
  /** نهاية نافذة الخمول من زمن الخادم؛ تُستخدم لجدولة التجديد الصامت. The server's idle deadline, used to schedule silent renewal. */
  sessionExpiresAt?: string;
}

export interface PortalCourierTaskDto {
  orderId: string;
  trackingNumber: string;
  customerName: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  deliveryCity: string;
  status: string;
  cashOnDelivery: number;
  currency: string;
  assignedAt: number;
}

export interface PortalCourierStatsDto {
  activeTasks: number;
  deliveredToday: number;
  pendingEarnings: number;
  currency: string;
}

export interface PortalCourierLedgerEntryDto {
  orderId: string;
  trackingNumber: string;
  recipientName: string;
  estimatedCost: number;
  currency: string;
  deliveredAt: number;
}

export interface PortalSupplierOrderDto {
  id: string;
  trackingNumber: string;
  description: string;
  weightKg: number;
  cbmVolume: number;
  stage: "manufacturing" | "in_transit" | "delivered";
  requestedAt: number;
  updatedAt: number;
}

export interface PortalAuthGateway {
  login(identifier: string, password: string): Promise<PortalAuthProfileDto>;
  register(input: PortalRegistrationInput): Promise<PortalRegistrationResult>;
  getProfile(): Promise<PortalAuthProfileDto | null>;
  updateProfile(
    input: Partial<Pick<PortalAuthProfileDto, "fullName" | "phone" | "address">>
  ): Promise<PortalAuthProfileDto>;
  getCustomerDetails(): Promise<PortalCustomerDetailsDto | null>;
  saveCustomerDetails(
    input: PortalCustomerDetailsUpdateInput
  ): Promise<PortalCustomerDetailsDto>;
  listTickets(): Promise<PortalTicketDto[]>;
  createTicket(input: {
    type: PortalTicketType;
    subject: string;
    message: string;
  }): Promise<PortalTicketDto>;
  listJobRequests(): Promise<PortalJobRequestDto[]>;
  createJobRequest(input: PortalJobRequestInput): Promise<PortalJobRequestDto>;
  listCustomerOrders(search?: string): Promise<PortalOrderDto[]>;
  createCustomerOrder(
    input: PortalOrderCreateInput,
    idempotencyKey: string
  ): Promise<PortalOrderDto>;
  /** قائمة مصادر الشراء المفعّلة (الخطوة 1) - Active purchase sources for wizard step 1 */
  listOrderSources(): Promise<PortalOrderSourceDto[]>;
  /** أصناف العميل (order_items) لطلباته فقط — تبويب "منتجاتي" */
  listCustomerOrderItems(
    search?: string
  ): Promise<PortalCustomerOrderItemDto[]>;
  /** منتجات العميل السابقة فقط — زر "اختيار منتج سابق" (الخطوة 2) */
  listCustomerPreviousProducts(
    search?: string
  ): Promise<PortalPreviousProductDto[]>;
  /** سلة العميل: مرتجعات/عناصر مرتبطة به فقط — لا تسريب لبيانات ملكية أخرى */
  listCustomerCart(): Promise<PortalCartItemDto[]>;
  /** شحنات طلبات العميل — تبويب "الشحنات" */
  listCustomerShipments(search?: string): Promise<PortalShipmentDto[]>;
  /** إنشاء شحنة حقيقية (طلب حاوية + صف shipments) — المدة والوصول المتوقع من إعدادات الخادم. */
  /** Create a real shipment (container order + shipments row) — duration/arrival come from server settings. */
  createCustomerShipment(
    input: PortalShipmentCreateInput,
    idempotencyKey: string
  ): Promise<PortalShipmentDto>;
  /** تتبّع شحنة يملكها العميل برقمها؛ لا يملكها → null (404 بلا تسريب وجود) */
  getTrackingByNumber(
    trackingNumber: string
  ): Promise<PortalShipmentDto | null>;
  /** قائمة البنوك لخطوة الدفع (D4) — من شجرة الحسابات، بلا أرصدة */
  listBanks(): Promise<PortalBankDto[]>;
  /** عملات مرجعية مع أسعار الصرف (لقوائم العملة + أداة المصارفة). */
  listCurrencies(): Promise<PortalCurrencyRefDto[]>;
  /** فئات الشحن من order_option (نوع=shipping_category). */
  listShippingCategories(): Promise<PortalReferenceOptionDto[]>;
  /** خيارات التغليف من order_option (نوع=packaging). */
  listPackagingOptions(): Promise<PortalReferenceOptionDto[]>;
  /** فئات محتوى الشحنات من items_category. */
  listItemCategories(): Promise<PortalItemCategoryDto[]>;
  /** حالات الطلب المرجعية من order_status. */
  listOrderStatuses(): Promise<PortalOrderStatusDto[]>;
  /** إعدادات نموذج الطلب: عملة افتراضية + رسوم تأمين من الإعدادات. */
  getFormSettings(): Promise<PortalFormSettingsDto>;
  /** معاينة رقم الطلب القادم قبل الإنشاء (ALX-YYMM-nnnn). */
  previewOrderCode(): Promise<PortalOrderCodePreviewDto>;
  /** عرض سعر على الخادم بنفس محرّك الإنشاء؛ يعيد المستحق بعملة واحدة فقط (D2) */
  quoteCustomerOrder(
    input: PortalOrderCreateInput
  ): Promise<PortalOrderQuoteDto>;
  /** الرصيد المالي لحساب العميل المرتبط فقط، بعملة الحساب نفسه (D3) */
  getCustomerBalance(): Promise<PortalCustomerBalanceDto>;
  /** إحصاءات مالية على طلبات العميل المملوكة فقط: عدّ بالحالة + مدفوع/متبقٍّ (D3) */
  getCustomerFinanceStats(): Promise<PortalCustomerFinanceStatsDto>;
  /** حذف طلب يملكه العميل وهو معلّق فقط (D7)؛ الخادم يفرّق 404/409 بأكواد ثابتة */
  deleteCustomerOrder(orderId: string): Promise<void>;
  /** تعديل حقول تواصل على طلب يملكه العميل وهو معلّق فقط (D7) */
  updateCustomerOrder(
    orderId: string,
    fields: PortalCustomerOrderUpdateFields
  ): Promise<PortalOrderDto>;
  listPaymentRequests(): Promise<PortalPaymentRequestDto[]>;
  listCustomerLedger(): Promise<PortalLedgerEntryDto[]>;
  /** إعلانات عامة للوحة التحكم — نص عام فقط، بلا ملكية أو أسرار. */
  listAnnouncements(): Promise<PortalAnnouncementDto[]>;
  /** كشف حساب مخصص (D3): حركات العميل المملوكة ضمن فترة/نوع، بعملة الحساب. */
  getCustomerStatement(
    query: PortalStatementQuery
  ): Promise<PortalCustomerStatementDto>;
  createPaymentRequest(
    input: PortalPaymentRequestInput,
    idempotencyKey: string
  ): Promise<PortalPaymentRequestDto>;
  /** === P11: بيانات المسابقات/الجوائز/الكوبونات للبوابة — عرض فقط؛ الخصم والأهلية والفوز خادميًا بالكامل === */
  /** P11 portal feature data: display only; discount/eligibility/winners are computed entirely server-side. */
  listFeatureContests(): Promise<PortalFeatureContestDto[]>;
  getFeatureContest(contestId: string): Promise<PortalFeatureContestDetailDto>;
  joinFeatureContest(contestId: string, idempotencyKey: string): Promise<void>;
  listMyFeatureAwards(): Promise<PortalFeatureAwardDto[]>;
  /** §10.2: مشاركات العميل في المسابقات (تبويب "مشاركاتي"). */
  /** §10.2: the customer's contest entries ("My Entries" tab). */
  listMyFeatureEntries(): Promise<PortalFeatureEntryDto[]>;
  claimFeatureAward(
    awardId: string,
    input: { claimAddress?: string; claimPhone?: string }
  ): Promise<PortalFeatureAwardDto>;
  listMyFeatureCoupons(): Promise<PortalFeatureCouponDto[]>;
  validateCoupon(input: {
    code: string;
    productsSubtotal: number;
    currencyCode: string;
  }): Promise<PortalCouponValidationDto>;
  logout(): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  /** تجديد صامت مجدوَل من زمن الخادم حتى مع خمول العميل. Scheduled silent renewal, server-clock driven, works even when the customer is idle. */
  renewSession(): Promise<boolean>;
  /** موعد التجديد الصامت التالي (أقرب نهاية: رمز الوصول أم الجلسة) أو null. The next silent-renewal deadline — whichever of the access-token or session deadlines comes first — or null. */
  getNextRenewalAt(): number | null;
  /** === Courier Portal Methods === */
  /** جلب مهام التوصيل النشطة للمنديب - List courier active delivery tasks */
  listCourierTasks(): Promise<PortalCourierTaskDto[]>;
  /** إحصاءات المنديب - Get courier dashboard stats */
  getCourierStats(): Promise<PortalCourierStatsDto>;
  /** سجل توصيلات المنديب - Courier delivery ledger */
  listCourierLedger(): Promise<PortalCourierLedgerEntryDto[]>;
  /** === Supplier Portal Methods === */
  /** قائمة طلبات المورد - List supplier orders */
  listSupplierOrders(): Promise<PortalSupplierOrderDto[]>;
  /** تحديث بيانات شحنة المورد - Update supplier order CBM/weight */
  updateSupplierOrder(
    orderId: string,
    cbmVolume: number,
    weightKg: number
  ): Promise<PortalSupplierOrderDto>;
}

export interface PortalAuthGatewayConfig {
  apiBaseUrl: string;
  enabled: boolean;
}

const ACCESS_TOKEN_KEY = "alx_portal_api_access_token";
const REFRESH_TOKEN_KEY = "alx_portal_api_refresh_token";
// نهاية نافذة الخمول التي أعادها الخادم: تُخزَّن ليجدول التجديد الصامت من زمن الخادم لا من تخمين العميل.
// The server's idle deadline: stored so silent renewal schedules from the server's clock, not the client's guess.
const SESSION_EXPIRES_KEY = "alx_portal_api_session_expires_at";
// نهاية رمز الوصول: تُخزَّن حتى يُجدَّد بصمت قبل أول 401 بدل الانتظار حتى يحدث.
// The access-token deadline: stored so renewal happens silently before the first 401 instead of waiting for one.
const ACCESS_TOKEN_EXPIRES_KEY = "alx_portal_api_access_token_expires_at";
// هامش التجديد الاستباقي: قبل هذه المدة على نهاية الرمز يبدأ التجديد الصامت.
// Proactive-renewal margin: silent renewal starts this long before the access token lapses.
const ACCESS_RENEWAL_LEAD_MS = 60_000;
// قفل الدوران بين التبويبات والنداءات المتزامنة: لا يُرسَل رمز تجديد مرتين أبداً، لأن إعادة الاستخدام تُلغي عائلة الجلسات.
// Rotation lock across tabs and concurrent calls: a refresh token is never presented twice, because reuse revokes the whole family.
const REFRESH_LOCK_NAME = "alx-portal:refresh";

/** إشارة انتهاء الجلسة القاطع: تُصدرها طبقة البيانات ليسمعها مزوّد الحالة فيُنهي الحالة ويوقف الجلب.
 *  The decisive session-end signal: emitted by the data layer so the auth provider drops state and halts polling. */
export const PORTAL_SESSION_TERMINATED_EVENT = "alx-portal:session-terminated";

function announcePortalSessionTermination(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PORTAL_SESSION_TERMINATED_EVENT));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProfile(value: unknown): value is PortalAuthProfileDto {
  return (
    isRecord(value) &&
    typeof value.portalUserId === "string" &&
    typeof value.username === "string" &&
    typeof value.email === "string" &&
    typeof value.fullName === "string" &&
    typeof value.phone === "string" &&
    (value.role === "customer" ||
      value.role === "courier" ||
      value.role === "supplier") &&
    (value.approvalStatus === "approved" ||
      value.approvalStatus === "pending_approval" ||
      value.approvalStatus === "rejected") &&
    typeof value.onboardingCompleted === "boolean" &&
    [
      "address",
      "linkedAccId",
      "linkedCustomerId",
      "linkedCourierId",
      "linkedSourceId",
      "financialAccountId",
      "financialAccountCode",
      "financialCurrency",
      "joinBy",
      "referrerId",
    ].every(key => value[key] === undefined || typeof value[key] === "string")
  );
}

function isTokenPair(value: unknown): value is PortalAuthTokenPairDto {
  return (
    isRecord(value) &&
    typeof value.accessToken === "string" &&
    typeof value.refreshToken === "string" &&
    value.tokenType === "Bearer" &&
    typeof value.expiresInSeconds === "number"
  );
}

/** رفض قاطع من الخادم يعني انتهاء الجلسة: الرمز غير الصالح أو معاد استخدامه، فإما التمديد أو النهاية بلا رجعة.
 *  A decisive server rejection means the session is over: an invalid or reused token, so it ends irrevocably.
 *  Anything else (الشبكة/5xx/429) عارض ويجب ألّا يُمحو جلسة عميلٍ نشط. Everything else (network/5xx/429) is transient and must never wipe an active customer's session. */
function isDecisivePortalAuthFailure(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message === "PORTAL_AUTH_INVALID_CREDENTIALS"
  );
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function read(key: string): string | null {
  return storage()?.getItem(key) ?? null;
}

function writeTokens(tokens: PortalAuthTokenPairDto): void {
  const store = storage();
  if (!store) return;
  store.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  store.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  store.setItem(
    ACCESS_TOKEN_EXPIRES_KEY,
    String(Date.now() + Math.max(0, tokens.expiresInSeconds) * 1000)
  );
  // نهاية الجلسة من زمن الخادم: مع أمد رمز التجديد تصبح بعيدة جدًا، فيبقى الموعد الأقرب هو المحرِّك.
  // The server's session deadline: with the refresh-token horizon it is far out, so the nearer deadline drives renewal.
  if (tokens.sessionExpiresAt)
    store.setItem(
      SESSION_EXPIRES_KEY,
      String(Date.parse(tokens.sessionExpiresAt))
    );
}

function clearTokens(): void {
  const store = storage();
  if (!store) return;
  store.removeItem(ACCESS_TOKEN_KEY);
  store.removeItem(REFRESH_TOKEN_KEY);
  store.removeItem(ACCESS_TOKEN_EXPIRES_KEY);
  store.removeItem(SESSION_EXPIRES_KEY);
}

/** يمحو الرموز ويُبلّغ النهاية القاطعة: تمسكه تُنهي حالة العميل فيتوقف الجلب غير الموثّق بدل سيل 401.
 *  Clears the tokens and broadcasts the decisive end: holders finish the session, so unauthenticated polling stops instead of a 401 flood. */
function endPortalSession(): void {
  clearTokens();
  announcePortalSessionTermination();
}

/** هل رمز الوصول على وشك الانتهاء مع وجود رمز تجديد؟ التجديد الاستباقي يُسقط عاصفة الـ401 المتوازية من أساسها.
 *  Is the access token lapsing while a refresh token exists? Proactive renewal removes the parallel-401 storm at its root. */
function needsProactiveRenewal(): boolean {
  if (!read(REFRESH_TOKEN_KEY)) return false;
  const raw = read(ACCESS_TOKEN_EXPIRES_KEY);
  if (!raw) return false;
  const deadline = Number(raw);
  return (
    Number.isFinite(deadline) && deadline - Date.now() <= ACCESS_RENEWAL_LEAD_MS
  );
}

export function portalAuthGatewayConfig(): PortalAuthGatewayConfig {
  return portalApiConfig();
}

class HttpPortalAuthGateway implements PortalAuthGateway {
  // مسار التجديد معرَّف ثابت: يُميَّز حتى لا يحاول تجديد نفسه داخل طلب التجديد.
  // The refresh path is a constant so a refresh call never tries to renew itself.
  private static readonly REFRESH_PATH = "/api/v1/portal/auth/refresh";

  /** عملية التجديد الجارية: كل نداء متزامن ينتظرها بدل أن يدير رمز تجديد آخر ويُثار كشف إعادة الاستخدام.
   *  The in-flight refresh: concurrent callers await it instead of rotating another refresh token and tripping reuse detection. */
  private refreshing: Promise<boolean> | null = null;

  constructor(private readonly baseUrl: string) {}

  private async request(
    path: string,
    init: RequestInit = {},
    allowUnauthorized = false
  ): Promise<unknown | null> {
    // التجديد الاستباقي قبل الإرسال: طلبٌ كان سيُرفض 401 يُبدَّل رمزه بصمت، فتموت عاصفة المتوازي في مهدها.
    // Renewal happens before sending: a request that would have been rejected 401 swaps its token silently, so the parallel storm dies early.
    if (path !== HttpPortalAuthGateway.REFRESH_PATH && needsProactiveRenewal())
      await this.refresh();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body) headers.set("Content-Type", "application/json");
    const accessToken = read(ACCESS_TOKEN_KEY);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });
    if (allowUnauthorized && response.status === 401) return null;
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      const code =
        isRecord(payload) &&
        isRecord(payload.error) &&
        typeof payload.error.code === "string"
          ? payload.error.code
          : "PORTAL_AUTH_API_ERROR";
      throw new Error(code);
    }
    const payload: unknown = await response.json();
    if (
      !isRecord(payload) ||
      payload.success !== true ||
      !("data" in payload)
    ) {
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    }
    return payload.data;
  }

  /**
   * تجديدٌ واحد بصوت مسموع: كل نداء متزامن ينتظر نفس العملية، فلا يُعرَض رمز التجديد مرتين. إعادة استخدام رمزٍ مُستهلَك
   * تجعل الخادم يُلغي عائلته كلها ويسجّل خروج عميلٍ نشط — وهذا هو السبب الذي أثبته ملف HAR (ثلاثة /auth/refresh متزامنة).
   * Exactly one refresh runs: concurrent callers await the same promise, so a refresh token is never presented twice. Replaying a spent
   * token makes the server revoke the whole family and signs an active customer out — the cause the HAR proved (three parallel /auth/refresh calls).
   */
  private refresh(): Promise<boolean> {
    const refreshToken = read(REFRESH_TOKEN_KEY);
    if (!refreshToken) return Promise.resolve(false);
    if (this.refreshing) return this.refreshing;
    this.refreshing = this.refreshUnderLock(refreshToken)
      .catch(() => false)
      .finally(() => {
        this.refreshing = null;
      });
    return this.refreshing;
  }

  /** قفل بين التبويبات: إن سبقنا تبويبٌ أو نداء أثناء الانتظار فالرمز المخزَّن صار جديدًا وتُنجَز الجلسة بلا دوران ثانٍ.
   *  Cross-tab lock: if a tab or caller rotated while we waited, the stored token is already new, so the session succeeds without a second rotation. */
  private async refreshUnderLock(presentedToken: string): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.locks)
      return this.rotateRefreshToken(presentedToken);
    return navigator.locks.request(REFRESH_LOCK_NAME, () => {
      if (read(REFRESH_TOKEN_KEY) !== presentedToken) return true;
      return this.rotateRefreshToken(presentedToken);
    });
  }

  /** عارضٌ لا يُنهي جلسة عميل: الشبكة/5xx/429 تُعيد false بلا محو، والرفض القاطع يُمحو فقط إن كان الرمز المرفوض هو المخزَّن.
   *  A transient fault never ends a customer session: network/5xx/429 return false without wiping; only a decisive rejection clears, and only when the rejected token is the stored one. */
  private async rotateRefreshToken(presentedToken: string): Promise<boolean> {
    try {
      const data = await this.request(
        HttpPortalAuthGateway.REFRESH_PATH,
        {
          method: "POST",
          body: JSON.stringify({ refreshToken: presentedToken }),
        },
        true
      );
      if (data === null) return this.endIfRejectionIsOurs(presentedToken);
      if (!isTokenPair(data)) return false;
      writeTokens(data);
      return true;
    } catch (error) {
      if (!isDecisivePortalAuthFailure(error)) return false;
      return this.endIfRejectionIsOurs(presentedToken);
    }
  }

  /** رفضُ رمزٍ لم يعد مخزَّنًا معناه أن تجديدًا أنجح سبقنا: الجلسة حيّة فلا يُمحى شيء.
   *  Rejecting a token we no longer store means a successful renewal beat us to it: the session is alive, so nothing is wiped. */
  private endIfRejectionIsOurs(presentedToken: string): boolean {
    if (read(REFRESH_TOKEN_KEY) !== presentedToken) return true;
    endPortalSession();
    return false;
  }

  /**
   * تجديد صامت مجدوَل من زمن الخادم: تُنادى دوريًا حتى مع خمول العميل فلا تنتهي جلسته ولا يشعر بانقطاع.
   * Scheduled silent renewal driven by the server clock: called periodically even while the customer is idle,
   * so their session never lapses and they feel no interruption.
   */
  async renewSession(): Promise<boolean> {
    if (!read(REFRESH_TOKEN_KEY)) return false;
    return this.refresh();
  }

  /** يعيد موعد التجديد الصامت التالي: أقرب نهاية بين رمز الوصول والجلسة، أو null حين لا موعد.
   *  Returns the next silent-renewal deadline — the earlier of the access-token and session deadlines — or null. */
  getNextRenewalAt(): number | null {
    const deadlines = [ACCESS_TOKEN_EXPIRES_KEY, SESSION_EXPIRES_KEY]
      .map(key => {
        const raw = read(key);
        if (!raw) return null;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
      })
      .filter((value): value is number => value !== null);
    return deadlines.length ? Math.min(...deadlines) : null;
  }

  private async getProfileWithRefresh(): Promise<PortalAuthProfileDto | null> {
    let data: unknown | null;
    try {
      data = await this.authenticatedRequest("/api/v1/portal/auth/me");
    } catch (error) {
      if (error instanceof Error && error.message === "PORTAL_AUTH_REQUIRED")
        return null;
      throw error;
    }
    if (data === null) {
      endPortalSession();
      return null;
    }
    if (!isProfile(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  private async authenticatedRequest(
    path: string,
    init: RequestInit = {}
  ): Promise<unknown> {
    // لا رمز إطلاقًا: نرفض محليًا بلا شبكة، حتى لا تُغمر الصفحة بطلبات غير موثّقة ترد 401 كما حدث بعد المحو.
    // No token at all: reject locally without the network, so the page cannot flood unauthenticated 401s as it did after the wipe.
    if (!read(ACCESS_TOKEN_KEY) && !read(REFRESH_TOKEN_KEY))
      throw new Error("PORTAL_AUTH_REQUIRED");
    let data = await this.request(path, init, true);
    if (data === null && (await this.refresh()))
      data = await this.request(path, init, true);
    if (data === null) {
      if (read(ACCESS_TOKEN_KEY) || read(REFRESH_TOKEN_KEY)) {
        // عارضٌ لا يُمحو جلسة: الرموز باقية، يفشل هذا الطلب وحده وتُعاوده الصفحة أو المؤقّت بصمت.
        // A transient fault never wipes a session: the tokens stay, only this request fails, and the page or timer retries it quietly.
        throw new Error("PORTAL_AUTH_TEMPORARY_FAILURE");
      }
      // الرمز مُحيت سابقًا بإعلانها للجلسة: نرفض هذا الطلب فقط بلا محو وإعلان مزدوجين.
      // The tokens were already cleared, with their broadcast: this request just fails, with no double wipe or announcement.
      throw new Error("PORTAL_AUTH_REQUIRED");
    }
    return data;
  }

  async login(
    identifier: string,
    password: string
  ): Promise<PortalAuthProfileDto> {
    const data = await this.request("/api/v1/portal/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    if (!isTokenPair(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    writeTokens(data);
    const profile = await this.getProfileWithRefresh();
    if (!profile) throw new Error("PORTAL_AUTH_INVALID_TOKEN");
    return profile;
  }

  async register(
    input: PortalRegistrationInput
  ): Promise<PortalRegistrationResult> {
    const data = await this.request("/api/v1/portal/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (
      !isRecord(data) ||
      !isProfile(data.profile) ||
      typeof data.pendingApproval !== "boolean" ||
      (data.tokens !== null && !isTokenPair(data.tokens))
    )
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    if (data.tokens) writeTokens(data.tokens);
    return {
      profile: data.profile,
      pendingApproval: data.pendingApproval,
      tokens: data.tokens,
    };
  }

  async getProfile(): Promise<PortalAuthProfileDto | null> {
    return this.getProfileWithRefresh();
  }

  async updateProfile(
    input: Partial<Pick<PortalAuthProfileDto, "fullName" | "phone" | "address">>
  ): Promise<PortalAuthProfileDto> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/auth/profile",
      {
        method: "PATCH",
        body: JSON.stringify(input),
      }
    );
    if (!isProfile(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async getCustomerDetails(): Promise<PortalCustomerDetailsDto | null> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/customer-details"
    );
    if (data === null) return null;
    if (!isPortalCustomerDetails(data))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async saveCustomerDetails(
    input: PortalCustomerDetailsUpdateInput
  ): Promise<PortalCustomerDetailsDto> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/customer-details",
      {
        method: "PUT",
        body: JSON.stringify(input),
      }
    );
    if (!isPortalCustomerDetails(data))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listTickets(): Promise<PortalTicketDto[]> {
    const data = await this.authenticatedRequest("/api/v1/portal/tickets");
    if (!Array.isArray(data) || !data.every(isPortalTicket))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async createTicket(input: {
    type: PortalTicketType;
    subject: string;
    message: string;
  }): Promise<PortalTicketDto> {
    const data = await this.authenticatedRequest("/api/v1/portal/tickets", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!isPortalTicket(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listJobRequests(): Promise<PortalJobRequestDto[]> {
    const data = await this.authenticatedRequest("/api/v1/portal/job-requests");
    if (!Array.isArray(data) || !data.every(isPortalJobRequest))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async createJobRequest(
    input: PortalJobRequestInput
  ): Promise<PortalJobRequestDto> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/job-requests",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
    if (!isPortalJobRequest(data))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listCustomerOrders(search?: string): Promise<PortalOrderDto[]> {
    const normalizedSearch = search?.trim();
    const query = normalizedSearch
      ? `?search=${encodeURIComponent(normalizedSearch)}&limit=100`
      : "";
    const data = await this.authenticatedRequest(
      `/api/v1/portal/orders${query}`
    );
    if (!Array.isArray(data) || !data.every(isPortalOrder))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async createCustomerOrder(
    input: PortalOrderCreateInput,
    idempotencyKey: string
  ): Promise<PortalOrderDto> {
    const data = await this.authenticatedRequest("/api/v1/portal/orders", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(input),
    });
    if (!isPortalOrder(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listOrderSources(): Promise<PortalOrderSourceDto[]> {
    const data = await this.authenticatedRequest("/api/v1/portal/sources");
    if (!Array.isArray(data) || !data.every(isPortalOrderSource))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listCustomerOrderItems(
    search?: string
  ): Promise<PortalCustomerOrderItemDto[]> {
    const normalizedSearch = search?.trim();
    const query = normalizedSearch
      ? `?search=${encodeURIComponent(normalizedSearch)}&limit=100`
      : "?limit=100";
    const data = await this.authenticatedRequest(
      `/api/v1/portal/orders/items${query}`
    );
    if (!Array.isArray(data) || !data.every(isPortalCustomerOrderItem))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listCustomerPreviousProducts(
    search?: string
  ): Promise<PortalPreviousProductDto[]> {
    const normalizedSearch = search?.trim();
    const query = normalizedSearch
      ? `?search=${encodeURIComponent(normalizedSearch)}&limit=100`
      : "?limit=100";
    const data = await this.authenticatedRequest(
      `/api/v1/portal/orders/previous-products${query}`
    );
    if (!Array.isArray(data) || !data.every(isPortalPreviousProduct))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listCustomerCart(): Promise<PortalCartItemDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/cart?limit=100"
    );
    if (!Array.isArray(data) || !data.every(isPortalCartItem))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listCustomerShipments(search?: string): Promise<PortalShipmentDto[]> {
    const normalizedSearch = search?.trim();
    const query = normalizedSearch
      ? `?search=${encodeURIComponent(normalizedSearch)}&limit=100`
      : "?limit=100";
    const data = await this.authenticatedRequest(
      `/api/v1/portal/shipments${query}`
    );
    if (!Array.isArray(data) || !data.every(isPortalShipment))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  // إنشاء الشحنة الحقيقية: الخادم يبني طلب حاوية + صف shipments بمدة/وصول من الإعدادات.
  // Real shipment creation: the server builds a container order + shipments row with settings-driven duration/arrival.
  async createCustomerShipment(
    input: PortalShipmentCreateInput,
    idempotencyKey: string
  ): Promise<PortalShipmentDto> {
    const data = await this.authenticatedRequest("/api/v1/portal/shipments", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(input),
    });
    if (!isPortalShipment(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  // رقم لا يملكه العميل يرجع 404/PORTAL_TRACKING_NOT_FOUND من الخادم → null محليًا دون كشف وجود الشحنة لدى غيره.
  // A number outside the customer's ownership returns 404 server-side and maps to null here, never leaking existence.
  async getTrackingByNumber(
    trackingNumber: string
  ): Promise<PortalShipmentDto | null> {
    const normalized = trackingNumber.trim();
    if (!normalized) return null;
    try {
      const data = await this.authenticatedRequest(
        `/api/v1/portal/tracking/${encodeURIComponent(normalized)}`
      );
      if (data === null || data === undefined) return null;
      if (!isPortalShipment(data))
        throw new Error("PORTAL_API_INVALID_RESPONSE");
      return data;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "PORTAL_TRACKING_NOT_FOUND"
      )
        return null;
      throw error;
    }
  }

  async listBanks(): Promise<PortalBankDto[]> {
    const data = await this.authenticatedRequest("/api/v1/portal/banks");
    if (!Array.isArray(data) || !data.every(isPortalBank))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listCurrencies(): Promise<PortalCurrencyRefDto[]> {
    const data = await this.authenticatedRequest("/api/v1/portal/currencies");
    if (!Array.isArray(data) || !data.every(isPortalCurrencyRef))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listShippingCategories(): Promise<PortalReferenceOptionDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/reference/shipping-categories"
    );
    if (!Array.isArray(data) || !data.every(isPortalReferenceOption))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listPackagingOptions(): Promise<PortalReferenceOptionDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/reference/packaging-options"
    );
    if (!Array.isArray(data) || !data.every(isPortalReferenceOption))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listItemCategories(): Promise<PortalItemCategoryDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/reference/item-categories"
    );
    if (!Array.isArray(data) || !data.every(isPortalItemCategory))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listOrderStatuses(): Promise<PortalOrderStatusDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/reference/order-statuses"
    );
    if (!Array.isArray(data) || !data.every(isPortalOrderStatus))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  // إعدادات النموذج (تأمين افتراضي + عملة افتراضية) من الخادم؛ تُغذّي حقل التأمين وعرض العملة بلا قيم ثابتة.
  // Form settings (default insurance + default currency) from the server; feed the insurance field and currency display with no literals.
  async getFormSettings(): Promise<PortalFormSettingsDto> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/reference/form-settings"
    );
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      typeof (data as PortalFormSettingsDto).defaultProductInsuranceFee !==
        "number" ||
      typeof (data as PortalFormSettingsDto).defaultCurrencyCode !== "string" ||
      typeof (data as PortalFormSettingsDto).defaultShippingDurationDays !==
        "number"
    ) {
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    }
    return data as PortalFormSettingsDto;
  }

  // معاينة رقم الطلب/الشحنة (عرض فقط) — الخادم يحسبه من طلبات هذا العميل نفسه.
  // Order/shipment code preview (display only) — computed server-side from this customer's own orders.
  async previewOrderCode(): Promise<PortalOrderCodePreviewDto> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/orders/preview-code"
    );
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      typeof (data as PortalOrderCodePreviewDto).previewCode !== "string"
    ) {
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    }
    return data as PortalOrderCodePreviewDto;
  }

  // عرض السعر: POST على /orders/quote بنفس جسم الطلب؛ يُتحقّق من شكل DTO الآمن فقط.
  // Quote: POST /orders/quote with the same order body; the safe DTO shape is validated.
  async quoteCustomerOrder(
    input: PortalOrderCreateInput
  ): Promise<PortalOrderQuoteDto> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/orders/quote",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
    if (!isPortalOrderQuote(data))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  // ── P11: بيانات الميزات للبوابة — الخادم يقرر الخصم/الأهلية/الفوز؛ الواجهة تعرض فقط. ──
  // P11 feature data for the portal: the server decides discount/eligibility/winners; the UI only displays.
  async listFeatureContests(): Promise<PortalFeatureContestDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/features/contests?limit=100"
    );
    if (!Array.isArray(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data.map(mapFeatureContest);
  }

  async getFeatureContest(
    contestId: string
  ): Promise<PortalFeatureContestDetailDto> {
    const data = await this.authenticatedRequest(
      `/api/v1/portal/features/contests/${encodeURIComponent(contestId)}`
    );
    return mapFeatureContestDetail(data);
  }

  // المشاركة تتطلب قبول الشروط؛ المفتاح المتكرّر يمنع ازدواج الدخول من نفس العميل.
  // Joining requires accepting terms; the idempotency key prevents duplicate entries from the same customer.
  async joinFeatureContest(
    contestId: string,
    idempotencyKey: string
  ): Promise<void> {
    await this.authenticatedRequest(
      `/api/v1/portal/features/contests/${encodeURIComponent(contestId)}/entries`,
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ termsAccepted: true }),
      }
    );
  }

  async listMyFeatureAwards(): Promise<PortalFeatureAwardDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/features/me/awards"
    );
    if (!Array.isArray(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data.map(mapFeatureAward);
  }

  async listMyFeatureEntries(): Promise<PortalFeatureEntryDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/features/me/entries"
    );
    if (!Array.isArray(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data.map(mapFeatureEntry);
  }

  async claimFeatureAward(
    awardId: string,
    input: { claimAddress?: string; claimPhone?: string }
  ): Promise<PortalFeatureAwardDto> {
    const data = await this.authenticatedRequest(
      `/api/v1/portal/features/me/awards/${encodeURIComponent(awardId)}/claim`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
    return mapFeatureAward(data);
  }

  async listMyFeatureCoupons(): Promise<PortalFeatureCouponDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/features/me/coupons"
    );
    if (!Array.isArray(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data.map(mapFeatureCoupon);
  }

  // معاينة الكوبون خادميًا فقط: لا تحجز ولا تستهلك؛ تُعاد الحساب عند إنشاء الطلب (P9).
  // Server-side coupon preview: it neither reserves nor consumes; the math is re-applied at order create (P9).
  async validateCoupon(input: {
    code: string;
    productsSubtotal: number;
    currencyCode: string;
  }): Promise<PortalCouponValidationDto> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/coupons/validate",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
    return mapCouponValidation(data);
  }

  async getCustomerBalance(): Promise<PortalCustomerBalanceDto> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/finance/balance"
    );
    if (!isPortalCustomerBalance(data))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async getCustomerFinanceStats(): Promise<PortalCustomerFinanceStatsDto> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/finance/stats"
    );
    if (!isPortalCustomerFinanceStats(data))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  // حذف الطلب: نجاح 200 يُعيد {deleted:true}؛ 404/409 ترمي كود الخطأ من الخادم ليُعرض في الواجهة.
  // Delete: 200 yields {deleted:true}; 404/409 throw the server's stable code for the UI to surface.
  async deleteCustomerOrder(orderId: string): Promise<void> {
    const normalized = orderId.trim();
    if (!normalized) throw new Error("INVALID_PORTAL_ORDER_ID");
    await this.authenticatedRequest(
      `/api/v1/portal/orders/${encodeURIComponent(normalized)}`,
      { method: "DELETE" }
    );
  }

  // تعديل التواصل على طلب معلّق مملوك (D7)؛ الخادم يتحقّق من الملكية والحالة ويعيد الطلب المحدث.
  async updateCustomerOrder(
    orderId: string,
    fields: PortalCustomerOrderUpdateFields
  ): Promise<PortalOrderDto> {
    const normalized = orderId.trim();
    if (!normalized) throw new Error("INVALID_PORTAL_ORDER_ID");
    const data = await this.authenticatedRequest(
      `/api/v1/portal/orders/${encodeURIComponent(normalized)}`,
      {
        method: "PATCH",
        body: JSON.stringify(fields),
      }
    );
    if (!isPortalOrder(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listPaymentRequests(): Promise<PortalPaymentRequestDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/payment-requests"
    );
    if (!Array.isArray(data) || !data.every(isPortalPaymentRequest))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listCustomerLedger(): Promise<PortalLedgerEntryDto[]> {
    const data = await this.authenticatedRequest("/api/v1/portal/ledger");
    if (!Array.isArray(data) || !data.every(isPortalLedgerEntry))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async listAnnouncements(): Promise<PortalAnnouncementDto[]> {
    const data = await this.request("/api/v1/portal/announcements");
    if (!Array.isArray(data) || !data.every(isPortalAnnouncement)) return [];
    return data;
  }

  async getCustomerStatement(
    query: PortalStatementQuery
  ): Promise<PortalCustomerStatementDto> {
    const params = new URLSearchParams();
    if (typeof query.from === "number") params.set("from", String(query.from));
    if (typeof query.to === "number") params.set("to", String(query.to));
    if (query.type) params.set("type", query.type);
    if (typeof query.limit === "number")
      params.set("limit", String(query.limit));
    if (typeof query.offset === "number")
      params.set("offset", String(query.offset));
    const qs = params.toString();
    const data = await this.authenticatedRequest(
      `/api/v1/portal/finance/statement${qs ? `?${qs}` : ""}`
    );
    if (!isPortalStatement(data))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async createPaymentRequest(
    input: PortalPaymentRequestInput,
    idempotencyKey: string
  ): Promise<PortalPaymentRequestDto> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/payment-requests",
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(input),
      }
    );
    if (!isPortalPaymentRequest(data))
      throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data;
  }

  async logout(): Promise<void> {
    const refreshToken = read(REFRESH_TOKEN_KEY);
    try {
      if (refreshToken) {
        await this.request(
          "/api/v1/portal/auth/logout",
          {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          },
          true
        );
      }
    } finally {
      clearTokens();
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    let data = await this.request(
      "/api/v1/portal/auth/password",
      {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      true
    );
    if (data === null && (await this.refresh())) {
      data = await this.request("/api/v1/portal/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    }
    if (data === null) throw new Error("PORTAL_AUTH_REQUIRED");
  }

  /** === Courier Portal Implementation === */

  async listCourierTasks(): Promise<PortalCourierTaskDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/courier/tasks?limit=100"
    );
    if (!Array.isArray(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data as PortalCourierTaskDto[];
  }

  async getCourierStats(): Promise<PortalCourierStatsDto> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/courier/stats"
    );
    if (!isRecord(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data as unknown as PortalCourierStatsDto;
  }

  async listCourierLedger(): Promise<PortalCourierLedgerEntryDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/courier/ledger?limit=100"
    );
    if (!Array.isArray(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data as PortalCourierLedgerEntryDto[];
  }

  /** === Supplier Portal Implementation === */

  async listSupplierOrders(): Promise<PortalSupplierOrderDto[]> {
    const data = await this.authenticatedRequest(
      "/api/v1/portal/supplier/orders?limit=100"
    );
    if (!Array.isArray(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data as PortalSupplierOrderDto[];
  }

  async updateSupplierOrder(
    orderId: string,
    cbmVolume: number,
    weightKg: number
  ): Promise<PortalSupplierOrderDto> {
    const data = await this.authenticatedRequest(
      `/api/v1/portal/supplier/orders/${encodeURIComponent(orderId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ cbmVolume, weightKg }),
      }
    );
    if (!isRecord(data)) throw new Error("PORTAL_API_INVALID_RESPONSE");
    return data as unknown as PortalSupplierOrderDto;
  }
}

// ── P11: محوِّلات متسامحة لبيانات الميزات ──
// P11: lenient normalizers for feature data. الخادم يُرجع التواريخ نص ISO والأرقام numeric كنص،
// فتُطبَّع بأمان دون رفض شكلي صارم قد يُفشل ردًا صحيحًا لمجرد اختلاف التمثيل.
// The server returns dates as ISO strings and NUMERIC columns as strings; normalize safely without
// strict shape rejection that could fail a valid response merely for a different representation.
function toEpochMs(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toEpochMsOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const ms = toEpochMs(value);
  return ms === 0 ? null : ms;
}

function toNum(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toStr(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function mapFeatureContest(row: unknown): PortalFeatureContestDto {
  const r = isRecord(row) ? row : {};
  return {
    contestId: toStr(r.contestId),
    title: toStr(r.title),
    description: toStr(r.description),
    status: toStr(r.status),
    startsAt: toEpochMs(r.startsAt),
    endsAt: toEpochMs(r.endsAt),
    termsVersion: toStr(r.termsVersion),
  };
}

function mapFeatureContestDetail(data: unknown): PortalFeatureContestDetailDto {
  const r = isRecord(data) ? data : {};
  const prizes = Array.isArray(r.prizes)
    ? r.prizes.map(prize => {
        const p = isRecord(prize) ? prize : {};
        return { name: toStr(p.name), prizeType: toStr(p.prizeType) };
      })
    : [];
  return {
    contest: mapFeatureContest(r.contest),
    prizes,
    entryStatus:
      r.entryStatus === null || r.entryStatus === undefined
        ? null
        : toStr(r.entryStatus),
    hasEntered: Boolean(r.hasEntered),
  };
}

function mapFeatureAward(row: unknown): PortalFeatureAwardDto {
  const r = isRecord(row) ? row : {};
  return {
    awardId: toStr(r.awardId),
    contestTitle: toStr(r.contestTitle),
    prizeName: toStr(r.prizeName),
    prizeType: toStr(r.prizeType),
    status: toStr(r.status),
    claimDeadline: toEpochMsOrNull(r.claimDeadline),
    claimedAt: toEpochMsOrNull(r.claimedAt),
    deliveredAt: toEpochMsOrNull(r.deliveredAt),
  };
}

function mapFeatureEntry(row: unknown): PortalFeatureEntryDto {
  const r = isRecord(row) ? row : {};
  return {
    entryId: toStr(r.entryId),
    contestId: toStr(r.contestId),
    contestTitle: toStr(r.contestTitle),
    status: toStr(r.status),
    termsVersion: toStr(r.termsVersion),
    termsAcceptedAt: toEpochMsOrNull(r.termsAcceptedAt),
    createdAt: toEpochMsOrNull(r.createdAt),
  };
}

function mapFeatureCoupon(row: unknown): PortalFeatureCouponDto {
  const r = isRecord(row) ? row : {};
  return {
    issuanceId: toStr(r.issuanceId),
    issuedCode: toStr(r.issuedCode),
    status: toStr(r.status),
    expiresAt: toEpochMsOrNull(r.expiresAt),
    code: toStr(r.code),
    discountType: toStr(r.discountType),
    amount: toNum(r.amount),
    percent: toNum(r.percent),
    currencyCode: toStr(r.currencyCode),
    minimumProductsSubtotal: toNum(r.minimumProductsSubtotal),
    maxDiscount: toNum(r.maxDiscount),
  };
}

function mapCouponValidation(data: unknown): PortalCouponValidationDto {
  const r = isRecord(data) ? data : {};
  return {
    eligible: Boolean(r.eligible),
    discount: toNum(r.discount),
    couponId:
      r.couponId === null || r.couponId === undefined
        ? null
        : toStr(r.couponId),
    ...(typeof r.reason === "string" ? { reason: r.reason } : {}),
  };
}

function isPortalTicket(value: unknown): value is PortalTicketDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.userUid === "string" &&
    typeof value.userName === "string" &&
    (value.userRole === "customer" ||
      value.userRole === "courier" ||
      value.userRole === "supplier") &&
    (value.type === "inquiry" ||
      value.type === "suggestion" ||
      value.type === "complaint") &&
    typeof value.subject === "string" &&
    typeof value.message === "string" &&
    (value.status === "open" ||
      value.status === "in_progress" ||
      value.status === "resolved" ||
      value.status === "closed") &&
    typeof value.createdAt === "number"
  );
}

function isPortalJobRequest(value: unknown): value is PortalJobRequestDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.status === "string" &&
    typeof value.createdAt === "number"
  );
}

function isPortalOrder(value: unknown): value is PortalOrderDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.orderNumber === "string" &&
    typeof value.trackingNumber === "string" &&
    typeof value.status === "string" &&
    typeof value.orderStatus === "string" &&
    typeof value.createdAt === "number"
  );
}

function isPortalOrderSource(value: unknown): value is PortalOrderSourceDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.type === "string"
  );
}

function isPortalCustomerOrderItem(
  value: unknown
): value is PortalCustomerOrderItemDto {
  return (
    isRecord(value) &&
    typeof value.orderItemId === "string" &&
    typeof value.orderId === "string" &&
    typeof value.orderNumber === "string" &&
    typeof value.productName === "string" &&
    typeof value.quantity === "number" &&
    typeof value.productPrice === "number" &&
    typeof value.unitWeight === "number" &&
    typeof value.unitCbm === "number" &&
    typeof value.createdAt === "number" &&
    ["productUrl", "trackingNumber", "itemsStatus"].every(
      key => value[key] === undefined || typeof value[key] === "string"
    )
  );
}

function isPortalPreviousProduct(
  value: unknown
): value is PortalPreviousProductDto {
  return (
    isRecord(value) &&
    typeof value.productName === "string" &&
    typeof value.quantity === "number" &&
    typeof value.productPrice === "number" &&
    typeof value.unitWeight === "number" &&
    typeof value.unitCbm === "number" &&
    typeof value.timesOrdered === "number" &&
    typeof value.lastOrderedAt === "number" &&
    (value.productUrl === undefined || typeof value.productUrl === "string")
  );
}

function isPortalCartItem(value: unknown): value is PortalCartItemDto {
  return (
    isRecord(value) &&
    typeof value.returnId === "string" &&
    typeof value.productName === "string" &&
    typeof value.quantity === "number" &&
    typeof value.returnedAt === "number" &&
    ["orderId", "orderNumber", "productUrl", "returnStatus"].every(
      key => value[key] === undefined || typeof value[key] === "string"
    )
  );
}

function isPortalShipment(value: unknown): value is PortalShipmentDto {
  return (
    isRecord(value) &&
    typeof value.shipmentId === "string" &&
    typeof value.orderId === "string" &&
    typeof value.orderNumber === "string" &&
    typeof value.trackingNumber === "string" &&
    typeof value.status === "string" &&
    typeof value.createdAt === "number" &&
    [
      "orderStatus",
      "shippingType",
      "source",
      "destination",
      "contentCategoryName",
    ].every(
      key => value[key] === undefined || typeof value[key] === "string"
    ) &&
    [
      "cartonCount",
      "weight",
      "shippedAt",
      "expectedArrival",
      "deliveredAt",
    ].every(key => value[key] === undefined || typeof value[key] === "number")
  );
}

function isPortalBank(value: unknown): value is PortalBankDto {
  return (
    isRecord(value) &&
    typeof value.accountId === "string" &&
    typeof value.accountCode === "string" &&
    typeof value.name === "string"
  );
}

function isPortalReferenceOption(
  value: unknown
): value is PortalReferenceOptionDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.code === "string" &&
    typeof value.nameAr === "string" &&
    typeof value.nameEn === "string" &&
    typeof value.price === "number" &&
    typeof value.duration === "number"
  );
}

function isPortalItemCategory(value: unknown): value is PortalItemCategoryDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.code === "string" &&
    typeof value.nameAr === "string" &&
    typeof value.nameEn === "string" &&
    typeof value.feeCurrency === "string" &&
    typeof value.customsPerCarton === "number" &&
    typeof value.taxPerCarton === "number" &&
    typeof value.otherFeesPerCarton === "number" &&
    typeof value.requiresReview === "boolean"
  );
}

function isPortalOrderStatus(value: unknown): value is PortalOrderStatusDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.nameAr === "string" &&
    typeof value.nameEn === "string" &&
    typeof value.color === "string" &&
    typeof value.sortOrder === "number"
  );
}

function isPortalCurrencyRef(value: unknown): value is PortalCurrencyRefDto {
  return (
    isRecord(value) &&
    typeof value.currencyId === "string" &&
    typeof value.code === "string" &&
    typeof value.nameAr === "string" &&
    typeof value.nameEn === "string" &&
    typeof value.symbol === "string" &&
    typeof value.flag === "string" &&
    typeof value.isDefault === "boolean" &&
    typeof value.rate === "number"
  );
}

function isPortalCurrency(value: unknown): value is PortalCurrencyDto {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.symbol === "string"
  );
}

function isPortalOrderQuote(value: unknown): value is PortalOrderQuoteDto {
  if (
    !isRecord(value) ||
    typeof value.payableAmount !== "number" ||
    typeof value.totalWeight !== "number" ||
    typeof value.totalCBM !== "number" ||
    !isPortalCurrency(value.currency)
  ) {
    return false;
  }
  // الحقول الاختيارية تُتحقق فقط عند وجودها لتجنّب رفض عرض سعر سليم.
  // Optional fields validate only when present, so a lean quote still passes.
  for (const key of [
    "packagingOptionsFee",
    "productInsuranceFee",
    "couponDeduction",
  ] as const) {
    if (value[key] !== undefined && typeof value[key] !== "number")
      return false;
  }
  if (value.paymentPayable !== undefined) {
    const payable = value.paymentPayable;
    if (
      !isRecord(payable) ||
      typeof payable.amount !== "number" ||
      typeof payable.rate !== "number" ||
      !isPortalCurrency(payable.currency)
    ) {
      return false;
    }
  }
  return true;
}

function isPortalCustomerBalance(
  value: unknown
): value is PortalCustomerBalanceDto {
  return (
    isRecord(value) &&
    typeof value.balance === "number" &&
    isPortalCurrency(value.currency)
  );
}

function isPortalCustomerFinanceStats(
  value: unknown
): value is PortalCustomerFinanceStatsDto {
  return (
    isRecord(value) &&
    typeof value.totalOrders === "number" &&
    typeof value.totalPaid === "number" &&
    typeof value.totalOutstanding === "number" &&
    isPortalCurrency(value.currency) &&
    isRecord(value.statusCounts) &&
    Object.values(value.statusCounts).every(count => typeof count === "number")
  );
}

function isPortalPaymentRequest(
  value: unknown
): value is PortalPaymentRequestDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.amount === "number" &&
    typeof value.currency === "string" &&
    /^[A-Z]{3}$/.test(value.currency) &&
    (value.paymentMethod === "cash" ||
      value.paymentMethod === "transfer" ||
      value.paymentMethod === "wallet" ||
      value.paymentMethod === "check") &&
    (value.status === "pending_verification" ||
      value.status === "settled" ||
      value.status === "rejected") &&
    typeof value.createdAt === "number" &&
    ["reference", "notes", "financeEntryId", "reviewNote", "reviewedAt"].every(
      key =>
        value[key] === undefined ||
        (key === "reviewedAt"
          ? typeof value[key] === "number"
          : typeof value[key] === "string")
    )
  );
}

function isPortalLedgerEntry(value: unknown): value is PortalLedgerEntryDto {
  return (
    isRecord(value) &&
    typeof value.transactionId === "string" &&
    typeof value.entryId === "string" &&
    typeof value.entryNumber === "string" &&
    typeof value.transType === "string" &&
    typeof value.accountId === "string" &&
    typeof value.amount === "number" &&
    typeof value.amountOriginal === "number" &&
    typeof value.currencyOriginalNo === "number" &&
    typeof value.createdAt === "number" &&
    ["paymentMethod", "description", "note"].every(
      key => value[key] === undefined || typeof value[key] === "string"
    )
  );
}

function isPortalAnnouncement(value: unknown): value is PortalAnnouncementDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.content === "string" &&
    (value.priority === "normal" ||
      value.priority === "high" ||
      value.priority === "urgent") &&
    typeof value.createdAt === "number"
  );
}

function isPortalStatementEntry(
  value: unknown
): value is PortalStatementEntryDto {
  return (
    isRecord(value) &&
    typeof value.entryNumber === "string" &&
    typeof value.transType === "string" &&
    typeof value.amount === "number" &&
    typeof value.createdAt === "number" &&
    ["paymentMethod", "description", "note"].every(
      key => value[key] === undefined || typeof value[key] === "string"
    )
  );
}

function isPortalStatement(
  value: unknown
): value is PortalCustomerStatementDto {
  if (!isRecord(value)) return false;
  const currency = value.currency;
  if (
    !isRecord(currency) ||
    typeof currency.code !== "string" ||
    typeof currency.symbol !== "string"
  )
    return false;
  if (
    !Array.isArray(value.entries) ||
    !value.entries.every(isPortalStatementEntry)
  )
    return false;
  return (
    ["from", "to"].every(
      key => value[key] === undefined || typeof value[key] === "number"
    ) &&
    (value.type === undefined || typeof value.type === "string")
  );
}

function isPortalCustomerDetails(
  value: unknown
): value is PortalCustomerDetailsDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.userUid === "string" &&
    typeof value.customerId === "string" &&
    typeof value.privacyPolicyAgreed === "boolean" &&
    Array.isArray(value.preferredCategories) &&
    value.preferredCategories.every(category => typeof category === "string") &&
    typeof value.joinBy === "string" &&
    typeof value.referrerId === "string" &&
    typeof value.onboardingCompleted === "boolean" &&
    typeof value.createdAt === "number" &&
    typeof value.updatedAt === "number"
  );
}

export function createPortalAuthGateway(
  config: PortalAuthGatewayConfig = portalAuthGatewayConfig()
): PortalAuthGateway | null {
  return config.enabled ? new HttpPortalAuthGateway(config.apiBaseUrl) : null;
}

export const portalAuthGateway = createPortalAuthGateway();
