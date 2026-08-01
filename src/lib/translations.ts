// ─── Portal Translations ───────────────────────────────────────────────────────
// Bilingual AR / EN for all portal UI text

export const t: Record<string, { ar: string; en: string }> = {
  // ── Company ──
  companyName: { ar: 'ALX للتوصيل', en: 'ALX Delivery' },
  companyTagline: { ar: 'شريكك الموثوق في الشحن والتوصيل', en: 'Your Trusted Shipping & Delivery Partner' },
  
  // ── Nav ──
  home: { ar: 'الرئيسية', en: 'Home' },
  services: { ar: 'خدماتنا', en: 'Services' },
  features: { ar: 'المميزات', en: 'Features' },
  globalReach: { ar: 'تواجدنا العالمي', en: 'Global Reach' },
  contactUs: { ar: 'اتصل بنا', en: 'Contact Us' },
  login: { ar: 'تسجيل الدخول', en: 'Sign In' },
  register: { ar: 'إنشاء حساب', en: 'Create Account' },
  logout: { ar: 'تسجيل الخروج', en: 'Sign Out' },
  
  // ── Hero ──
  heroTitle: { ar: 'شحنتك بأمان إلى كل مكان', en: 'Your Shipment, Safe Everywhere' },
  heroSubtitle: { ar: 'نوصل بضاعتك بسرعة ودقة من أي مكان إلى كل مكان في العالم', en: 'We deliver your goods quickly and accurately anywhere in the world' },
  trackShipment: { ar: 'تتبع شحنتك', en: 'Track Shipment' },
  trackingPlaceholder: { ar: 'أدخل رقم التتبع...', en: 'Enter tracking number...' },
  trackNow: { ar: 'تتبع الآن', en: 'Track Now' },
  startNow: { ar: 'ابدأ الآن', en: 'Get Started' },
  
  // ── Auth ──
  emailOrPhone: { ar: 'البريد الإلكتروني أو رقم الهاتف', en: 'Email or Phone Number' },
  email: { ar: 'البريد الإلكتروني', en: 'Email Address' },
  phone: { ar: 'رقم الهاتف', en: 'Phone Number' },
  password: { ar: 'كلمة المرور', en: 'Password' },
  confirmPassword: { ar: 'تأكيد كلمة المرور', en: 'Confirm Password' },
  fullName: { ar: 'الاسم الكامل', en: 'Full Name' },
  address: { ar: 'العنوان', en: 'Address' },
  city: { ar: 'المدينة', en: 'City' },
  forgotPassword: { ar: 'نسيت كلمة المرور؟', en: 'Forgot Password?' },
  rememberMe: { ar: 'تذكرني', en: 'Remember me' },
  noAccount: { ar: 'ليس لديك حساب؟', en: "Don't have an account?" },
  haveAccount: { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?' },
  
  // ── Role ──
  iAm: { ar: 'أنا...', en: 'I am a...' },
  customer: { ar: 'عميل', en: 'Customer' },
  customerDesc: { ar: 'أرغب في إرسال أو استلام شحنات', en: 'I want to send or receive shipments' },
  courier: { ar: 'مندوب توصيل', en: 'Delivery Courier' },
  courierDesc: { ar: 'أعمل في توصيل الشحنات للعملاء', en: 'I deliver shipments to customers' },
  supplier: { ar: 'مورد / مصنع', en: 'Supplier / Factory' },
  supplierDesc: { ar: 'أورد بضائع وشحنات للشركة', en: 'I supply goods and shipments to the company' },
  
  // ── Pending ──
  pendingTitle: { ar: 'طلبك قيد المراجعة', en: 'Your Request is Under Review' },
  pendingMsg: { ar: 'تم تلقي طلب تسجيلك بنجاح. سيتم مراجعة بياناتك ومستنداتك من قبل فريق الإدارة وتفعيل حسابك في أقرب وقت.', en: 'Your registration request has been received. Our team will review your documents and activate your account as soon as possible.' },
  checkStatus: { ar: 'إعادة فحص حالة الحساب', en: 'Refresh Account Status' },
  
  // ── Dashboard ──
  dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
  welcome: { ar: 'مرحباً بك،', en: 'Welcome back,' },
  totalOrders: { ar: 'إجمالي الطلبات', en: 'Total Orders' },
  activeOrders: { ar: 'طلبات نشطة', en: 'Active Orders' },
  delivered: { ar: 'مسلّمة', en: 'Delivered' },
  balance: { ar: 'الرصيد الحالي', en: 'Current Balance' },
  quickActions: { ar: 'إجراءات سريعة', en: 'Quick Actions' },
  newOrder: { ar: 'طلب جديد', en: 'New Order' },
  myOrders: { ar: 'طلباتي', en: 'My Orders' },
  myLedger: { ar: 'كشف حسابي', en: 'My Statement' },
  
  // ── Orders ──
  trackingNumber: { ar: 'رقم التتبع', en: 'Tracking #' },
  orderDate: { ar: 'تاريخ الطلب', en: 'Order Date' },
  recipient: { ar: 'المستلم', en: 'Recipient' },
  status: { ar: 'الحالة', en: 'Status' },
  cost: { ar: 'التكلفة', en: 'Cost' },
  actions: { ar: 'الإجراءات', en: 'Actions' },
  viewDetails: { ar: 'عرض التفاصيل', en: 'View Details' },
  downloadInvoice: { ar: 'تحميل الفاتورة', en: 'Download Invoice' },
  trackOrder: { ar: 'تتبع الطلب', en: 'Track Order' },
  noOrders: { ar: 'لا توجد طلبات بعد', en: 'No orders yet' },
  
  // ── Order Status Labels ──
  status_pending_review: { ar: 'قيد المراجعة', en: 'Pending Review' },
  status_accepted: { ar: 'تم القبول', en: 'Accepted' },
  status_in_progress: { ar: 'جاري التجهيز', en: 'In Progress' },
  status_out_for_delivery: { ar: 'خرج للتوصيل', en: 'Out for Delivery' },
  status_delivered: { ar: 'تم التسليم', en: 'Delivered' },
  status_cancelled: { ar: 'ملغي', en: 'Cancelled' },
  status_returned: { ar: 'مُعاد', en: 'Returned' },
  
  // ── New Order Form ──
  newOrderTitle: { ar: 'تقديم طلب شحن جديد', en: 'Submit New Shipping Order' },
  recipientName: { ar: 'اسم المستلم', en: "Recipient's Name" },
  recipientPhone: { ar: 'هاتف المستلم', en: "Recipient's Phone" },
  recipientAddress: { ar: 'عنوان التسليم', en: 'Delivery Address' },
  deliveryCity: { ar: 'مدينة التسليم', en: 'Delivery City' },
  packageType: { ar: 'نوع الشحنة', en: 'Package Type' },
  standard: { ar: 'شحن عادي', en: 'Standard Shipping' },
  express: { ar: 'شحن سريع', en: 'Express Shipping' },
  factory_cbm: { ar: 'توريد مصنع (CBM)', en: 'Factory Supply (CBM)' },
  heavy: { ar: 'شحن ثقيل (بالكيلو)', en: 'Heavy Cargo (by KG)' },
  weightKg: { ar: 'الوزن (كجم)', en: 'Weight (KG)' },
  cbmVolume: { ar: 'الحجم (CBM)', en: 'Volume (CBM)' },
  goodsDescription: { ar: 'وصف البضاعة', en: 'Goods Description' },
  estimatedCost: { ar: 'التكلفة التقديرية', en: 'Estimated Cost' },
  attachFiles: { ar: 'إرفاق صور/فواتير', en: 'Attach Images/Invoices' },
  submitOrder: { ar: 'إرسال الطلب للمراجعة', en: 'Submit for Review' },
  orderSuccess: { ar: 'تم تقديم طلبك بنجاح! سيتصل بك فريقنا قريباً.', en: 'Order submitted! Our team will contact you shortly.' },
  
  // ── Ledger ──
  ledgerTitle: { ar: 'كشف الحساب المالي', en: 'Financial Statement' },
  totalDebit: { ar: 'إجمالي المديونية', en: 'Total Debit' },
  totalCredit: { ar: 'إجمالي الائتمان', en: 'Total Credit' },
  netBalance: { ar: 'صافي الرصيد', en: 'Net Balance' },
  date: { ar: 'التاريخ', en: 'Date' },
  description: { ar: 'الوصف', en: 'Description' },
  refNumber: { ar: 'رقم المرجع', en: 'Reference #' },
  amount: { ar: 'المبلغ', en: 'Amount' },
  runningBalance: { ar: 'الرصيد المتراكم', en: 'Running Balance' },
  exportPDF: { ar: 'تصدير PDF', en: 'Export PDF' },
  exportExcel: { ar: 'تصدير Excel', en: 'Export Excel' },
  noTransactions: { ar: 'لا توجد حركات مالية', en: 'No financial transactions' },
  
  // ── Courier ──
  myTasks: { ar: 'مهامي', en: 'My Tasks' },
  available: { ar: 'متاح للتوصيل', en: 'Available for Delivery' },
  unavailable: { ar: 'غير متاح', en: 'Unavailable' },
  todayDeliveries: { ar: 'توصيلات اليوم', en: "Today's Deliveries" },
  pendingEarnings: { ar: 'عمولات مستحقة', en: 'Pending Earnings' },
  navigateToAddress: { ar: 'التوجيه للعنوان', en: 'Navigate to Address' },
  updateDeliveryStatus: { ar: 'تحديث حالة التوصيل', en: 'Update Delivery Status' },
  deliveredSuccessfully: { ar: 'تم التسليم بنجاح ✓', en: 'Delivered Successfully ✓' },
  failedDelivery: { ar: 'تعذر التسليم', en: 'Failed Delivery' },
  failureReason: { ar: 'سبب التعذر', en: 'Reason for Failure' },
  callCustomer: { ar: 'الاتصال بالعميل', en: 'Call Customer' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
  myEarnings: { ar: 'عمولاتي وأرباحي', en: 'My Earnings' },
  
  // ── Supplier ──
  mySupplyOrders: { ar: 'طلباتي من المصنع', en: 'My Factory Orders' },
  totalCBM: { ar: 'إجمالي الـ CBM', en: 'Total CBM' },
  totalWeight: { ar: 'إجمالي الوزن', en: 'Total Weight' },
  stage_manufacturing: { ar: 'قيد التصنيع ⚙️', en: 'Manufacturing ⚙️' },
  stage_packaging: { ar: 'جاري التغليف 📦', en: 'Packaging 📦' },
  stage_ready_to_ship: { ar: 'جاهز للتحميل 🚢', en: 'Ready to Ship 🚢' },
  stage_shipped_to_port: { ar: 'تم التسليم للميناء ⚓', en: 'Shipped to Port ⚓' },
  stage_delivered: { ar: 'تم التسليم ✅', en: 'Delivered ✅' },
  updateCBM: { ar: 'تحديث الأوزان والـ CBM', en: 'Update Weight & CBM' },
  mySupplierLedger: { ar: 'كشف حسابي كمورد', en: 'My Supplier Statement' },
  
  // ── Profile & Settings ──
  profile: { ar: 'الملف الشخصي', en: 'Profile' },
  personalInfo: { ar: 'المعلومات الشخصية', en: 'Personal Information' },
  securitySettings: { ar: 'إعدادات الأمان', en: 'Security Settings' },
  uiSettings: { ar: 'إعدادات المظهر', en: 'Display Settings' },
  changePassword: { ar: 'تغيير كلمة المرور', en: 'Change Password' },
  currentPassword: { ar: 'كلمة المرور الحالية', en: 'Current Password' },
  newPassword: { ar: 'كلمة المرور الجديدة', en: 'New Password' },
  darkMode: { ar: 'الوضع الداكن', en: 'Dark Mode' },
  lightMode: { ar: 'الوضع الفاتح', en: 'Light Mode' },
  language: { ar: 'اللغة', en: 'Language' },
  arabic: { ar: 'العربية', en: 'Arabic' },
  english: { ar: 'الإنجليزية', en: 'English' },
  saveChanges: { ar: 'حفظ التغييرات', en: 'Save Changes' },
  savedSuccessfully: { ar: 'تم الحفظ بنجاح', en: 'Saved successfully' },
  
  // ── Support Tickets ──
  supportTickets: { ar: 'الدعم والاقتراحات', en: 'Support & Feedback' },
  newTicket: { ar: 'تذكرة جديدة', en: 'New Ticket' },
  ticketType: { ar: 'نوع التذكرة', en: 'Ticket Type' },
  suggestion: { ar: 'اقتراح', en: 'Suggestion' },
  complaint: { ar: 'شكوى', en: 'Complaint' },
  inquiry: { ar: 'استفسار', en: 'Inquiry' },
  subject: { ar: 'الموضوع', en: 'Subject' },
  message: { ar: 'الرسالة', en: 'Message' },
  sendTicket: { ar: 'إرسال التذكرة', en: 'Send Ticket' },
  ticketStatus_open: { ar: 'مفتوحة', en: 'Open' },
  ticketStatus_in_progress: { ar: 'قيد المعالجة', en: 'In Progress' },
  ticketStatus_resolved: { ar: 'تم الرد', en: 'Resolved' },
  ticketStatus_closed: { ar: 'مغلقة', en: 'Closed' },
  adminReply: { ar: 'رد الإدارة', en: 'Admin Reply' },
  noTickets: { ar: 'لا توجد تذاكر', en: 'No tickets yet' },
  
  // ── Announcements ──
  announcements: { ar: 'الإعلانات والعروض', en: 'Announcements & Offers' },
  noAnnouncements: { ar: 'لا توجد إعلانات حالياً', en: 'No announcements at this time' },
  
  // ── Common ──
  search: { ar: 'بحث...', en: 'Search...' },
  filter: { ar: 'تصفية', en: 'Filter' },
  all: { ar: 'الكل', en: 'All' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...' },
  error: { ar: 'حدث خطأ', en: 'An error occurred' },
  retry: { ar: 'إعادة المحاولة', en: 'Retry' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  confirm: { ar: 'تأكيد', en: 'Confirm' },
  yes: { ar: 'نعم', en: 'Yes' },
  no: { ar: 'لا', en: 'No' },
  close: { ar: 'إغلاق', en: 'Close' },
  back: { ar: 'رجوع', en: 'Back' },
  next: { ar: 'التالي', en: 'Next' },
  submit: { ar: 'إرسال', en: 'Submit' },
  required: { ar: 'هذا الحقل مطلوب', en: 'This field is required' },
  invalidEmail: { ar: 'البريد الإلكتروني غير صحيح', en: 'Invalid email address' },
  passwordsNotMatch: { ar: 'كلمتا المرور غير متطابقتين', en: 'Passwords do not match' },
  passwordTooShort: { ar: 'كلمة المرور قصيرة جداً (8 أحرف على الأقل)', en: 'Password too short (min 8 characters)' },
  
  // ── Global Search ──
  globalSearch: { ar: 'البحث العام', en: 'Global Search' },
  searchResults: { ar: 'نتائج البحث', en: 'Search Results' },
  noResults: { ar: 'لا توجد نتائج', en: 'No results found' },
  
  // ── Footer ──
  privacyPolicy: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
  termsOfService: { ar: 'الشروط والأحكام', en: 'Terms of Service' },
  allRightsReserved: { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
};

export type TKey = keyof typeof t;
