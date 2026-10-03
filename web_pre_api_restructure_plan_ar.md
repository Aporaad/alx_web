# تحليل مشروع الويب (`alx_web`) وخطة هيكلته وتحديثه وفق أحدث خريطة لقاعدة البيانات (`Supabase PostgreSQL`)

**الإصدار:** 2.0 — خطة محدثة ومطابقة لأحدث خريطة حقول وحقول قاعدة البيانات الفعلية
**تاريخ المراجعة:** 2026-10-01
**الحالة:** تم جلب المخطط الفعلي عبر `@mcp:supabase` وصياغة خطة التحديث والمطابقة الجوهرية
**النطاق:** مجلد مشروع الويب فقط (`f:\system\swiftship-tracker\swiftshift2\SWIFTSHIP_SYSTEM\alx_web`)
**القيود:** يمنع منعاً باتاً تعديل أو إنشاء أي ملف خارج نطاق مجلد `alx_web`. كافة ملفات التوثيق والتطوير والسجلات تحفظ داخل مجلد الويب حصراً.

---

## 1. الملخص التنفيذي والتحديث الجوهري

مشروع بوابة الويب (`alx_web`) هو تطبيق مستقل يعتمد على React 19 وVite وTypeScript، ويقدم خدمات إلكترونية مخصصة لثلاث فئات من مستخدمي النظام: **العملاء (Customers)**، **المندوبين (Couriers)**، و**الموردين (Suppliers)**، إلى جانب الواجهة الترحيبية العامة (Landing Page).

بناءً على التوجيه المعماري وفحص المخطط الحقيقي الحساس لقاعدة البيانات الحالية عبر أدوات Supabase MCP (`ejrojwbbflzchasvgexr` - PostgreSQL 17.6.1)، تبين أن **أكواد وملفات موقع الويب قديمة ولم يتم تحديثها للتوافق مع التعديلات الجوهرية التي أجريت في النظام الرئيسي على الطلبات، الشحنات، الحسابات، والقيود المالية**.

### أهم الفروقات المكتشفة بين كود الويب الحالي وقاعدة البيانات الحقيقية:

1. **اعتماد كود الويب القديم على مفتاح افتراضي `id`:**
   يستخدم `alx_web/src/lib/supabase.ts` دالة `extractRow` و `getDocById` بافتراض وجود عمود باسم `id` في كل الجدول. بينما في قاعدة البيانات الفعلية، تم توحيد المفاتيح الأساسية لتصبح كيانية صريحة:
   - جدول الطلبات: `orders.order_id`
   - جدول الشحنات: `shipments.shipment_id`
   - جدول مستخدمي البوابة: `portal_users.portal_user_id`
   - جدول العملاء: `customers.customer_id`
   - جدول الحسابات المالية: `accounts.account_id`
   - جدول التفاصيل: `cust_details.cust_detail_id`
   - جدول القيود العامة: `main_entry.main_entry_id`
   - جدول حركات القيود: `account_trans.account_trans_id`
   - جدول أصناف الطلبات: `order_items.order_item_id`
2. **تجاهل الجداول العلاقية المستحدثة للقيود والطلبات والشحنات:**
   كود الويب الحالي لا يتعامل مع جداول القيود المركبة (`main_entry` و `account_trans`) ولا الأصناف المنفصلة (`order_items`) أو الشحنات التفصيلية (`shipments`)، ويحاول قراءة كل شيء من حقل `data jsonb` قديم.
3. **عدم التوافق في أنواع التواريخ والحقول:**
   تستخدم قاعدة البيانات تواريخ من نوع `timestamp with time zone` ومبالغ دقيقة `numeric` وعلاقات صريحة مثل `order_status_id` و `order_source_id` و `shipping_company_id` و `posting_status` بينما يقرأ كود الويب هذه القيم كنصوص غير محددة أو أرقام Epoch عشوائية.

---

## 2. النطاق المحدد والقيود الصارمة

1. **الشمولية والتركيز:** يغطي التحليل والخطة كافة المكونات، الصفحات، النماذج، السياقات، والخدمات المساعدة داخل مجلد `f:\system\swiftship-tracker\swiftshift2\SWIFTSHIP_SYSTEM\alx_web`.
2. **عزل النطاق (Scope Isolation):** يمنع كتابة أي ملفات توثيق أو تطوير أو سجلات خارج مجلد `alx_web`.
3. **قواعد البيانات والسجلات التوثيقية:** يتم توثيق كافة التغييرات والمهام والأوامر في الملفات الخاصة بمشروع الويب حصراً:
   - `alx_web/todo.md`
   - `alx_web/devloping_history.md`
   - `alx_web/DBdevloping_history.md`
   - `alx_web/user_commends.md`
   - `alx_web/db_commends.md`
4. **عدم كسر السلوك القائم:** التغييرات الهيكلية والمطابقة يجب أن تحتفظ بالتوافق التام مع واجهات البوابة القائمة.

---

## 3. خريطة حقول قاعدة البيانات الحقيقية (`Supabase Live Schema Map`)

تم استخراج الخريطة الفعلية لأهم جداول النظام عبر استعلام `information_schema.columns` المباشر:

### 3.1 جدول الطلبات (`public.orders`)
- **المفتاح الرئيسي:** `order_id` (text)
- **الأعمدة العلاقية الفعالة:**
  - `order_number` (text) — رقم الطلب المنظم
  - `tracking_number` (text) — رقم التتبع
  - `customer_id` (text) — معرف العميل المرتبط
  - `order_status_id` (text) / `order_status1` (text) — حالة الطلب
  - `order_source_id` (text) / `order_source_type` (text) — مصدر الطلب
  - `delivery_courier_id` (text) / `shipping_courier_id` (text) — المندوبين
  - `order_party_id` (text) / `order_party_type` (text) / `order_party_account_id` (text) — أطراف الطلب
  - `employee_id` (text) / `is_staff_order` (boolean) — طلبات الموظفين
  - `created_at` (timestamptz) / `updated_at` (timestamptz) — التواريخ الرسمية
  - `data` (jsonb) — حقل التوافق للتفاصيل الإضافية

### 3.2 جدول الشحنات (`public.shipments`)
- **المفتاح الرئيسي:** `shipment_id` (text)
- **الأعمدة العلاقية الفعالة:**
  - `order_id` (text) — معرف الطلب المرتبط
  - `tracking_number` (text) — رقم التتبع
  - `shipping_company_id` (text) — شركة الشحن
  - `courier_id` (text) — المندوب
  - `shipment_status` (text) — حالة الشحنة
  - `shipping_cost` (numeric) / `weight` (numeric) — التكلفة والوزن
  - `shipping_category_id` (text) / `content_category_id` (text) / `content_category_name` (text) — تصنيفات المحتوى
  - `carton_count` (numeric) / `customs_fee` (numeric) / `tax_fee` (numeric) / `other_category_fee` (numeric) — الرسوم والكراتين
  - `category_fees_total` (numeric) / `category_fee_currency` (text) — إجمالي الرسوم والعملة
  - `created_at` (timestamptz) / `updated_at` (timestamptz)

### 3.3 جدول أصناف الطلبات (`public.order_items`)
- **المفتاح الرئيسي:** `order_item_id` (text)
- **الأعمدة العلاقية الفعالة:**
  - `order_id` (text) — الطلب المرتبط
  - `product_id` (text) / `product_price` (numeric) / `quantity` (numeric) — المنتج والكمية
  - `total_price` (numeric) / `total__weight` (numeric) / `total_cbm` (numeric) — الحسابات والإجماليات
  - `tracking_number` (text) / `produc_source_id` (text) / `produc_source_url` (text) — التتبع والمصدر
  - `packaging_option_id` (text) / `packaging_option_price` (numeric) — التغليف
  - `is_insured` (boolean) / `insurance_fee` (numeric) — التأمين
  - `items_status` (text) — حالة الصنف
  - `created_at` (timestamptz) / `updated_at` (timestamptz)

### 3.4 جدول مستخدمي البوابة (`public.portal_users`)
- **المفتاح الرئيسي:** `portal_user_id` (text)
- **الأعمدة العلاقية الفعالة:**
  - `username` (text) / `email` (text) / `full_name` (text) / `name_ar` (text) / `name_en` (text)
  - `portal_role` (text) — دور المستخدم (`customer`, `courier`, `supplier`)
  - `approval_status` (text) — حالة الموافقة (`approved`, `pending_approval`, `rejected`)
  - `disabled` (boolean) / `is_disabled` (boolean) — التجميد
  - `join_by` (text) / `referrer_id` (text) — طريقة الانضمام والمحيل
  - `account_id` (text) / `linked_customer_id` (text) — الربط المالي والكياني
  - `created_at` (timestamptz) / `updated_at` (timestamptz)
  - `data` (jsonb)

### 3.5 جدول العملاء (`public.customers`)
- **المفتاح الرئيسي:** `customer_id` (text)
- **الأعمدة العلاقية الفعالة:**
  - `account_id` (text) — الحساب المالي المرتبط
  - `is_active` (boolean) — حالة النشاط
  - `full_name` (text) / `name_ar` (text) / `name_en` (text) — الاسم
  - `customer_level` (text) — تصنيف العميل
  - `join_by` (text) / `referrer_id` (text)
  - `created_at` (timestamptz) / `updated_at` (timestamptz)

### 3.6 جدول الحسابات المالية (`public.accounts`)
- **المفتاح الرئيسي:** `account_id` (text)
- **الأعمدة العلاقية الفعالة:**
  - `account_code` (text) / `account_number` (text) / `account_prefix` (text) / `parent_code` (text) — الترميز المحاسبي
  - `entity_id` (text) / `entity_type` (text) / `entity_name` (text) — الكيان المرتبط
  - `type` (text) — نوع الحساب (`Asset` / `Liability`)
  - `currency` (text) — العملة
  - `balance` (numeric) / `debit_total` (numeric) / `credit_total` (numeric) / `limited_balance` (numeric) — الأرصدة الحقيقية
  - `is_active` (boolean)
  - `created_at` (timestamptz) / `updated_at` (timestamptz)

### 3.7 جداول القيود المالية المركبة (`public.main_entry` & `public.account_trans`)
- **جدول القيود الرئيسية (`main_entry`):**
  - المفتاح الرئيسي: `main_entry_id` (text)
  - `entry_number` (text) — رقم القيد
  - `module_id` (text) / `entry_type_id` (text) / `entry_category` (text)
  - `posting_status` (text) — حالة الترحيل (`draft`, `posted`, `voided`)
  - `order_id` (text) / `shipment_id` (text) / `custody_id` (text) — الارتباطات التشغيلية
  - `effective_at` (timestamptz) / `posted_at` (timestamptz) / `voided_at` (timestamptz)
- **جدول تفاصيل حركات الحسابات (`account_trans`):**
  - المفتاح الرئيسي: `account_trans_id` (text)
  - `main_entry_id` (text) — معرف القيد الرئيسي
  - `line_no` (integer) — رقم السطر
  - `trans_type` (text) — نوع الحركة (`debit` / `credit`)
  - `account_id` (text) — الحساب التأثري
  - `amount` (numeric) / `amount_original` (numeric) / `conversion_rate` (numeric) — المبالغ بسعر الصرف
  - `entity_type` (text) / `entity_id` (text) / `order_id` (text) / `shipment_id` (text)

---

## 4. خطة التحديث والتطوير لمطابقة كود الموقع مع القاعدة الحديثة

---

### المرحلة 0: تحديث المحولات الأساسية (`src/lib/supabase.ts`)

#### الأعمال التنفيذية
1. **تحديث دالة `extractRow` و `extractRows`:**
   تعديل الاستخراج ليتعرف على المفاتيح الأساسية الكيانية بدلاً من `id` العام:
   - البحث عن المفتاح المناسب حسب اسم الجدول: `order_id`, `shipment_id`, `portal_user_id`, `customer_id`, `account_id`, `cust_detail_id`, `main_entry_id`, `account_trans_id`.
   - توفير مفتاح افتراضي موحد `id` في الـ View Model لتجنب كسر واجهات React العلوية.
2. **إصلاح استعلامات `getDocById` و `deleteDocById`:**
   تعديل الاستعلام ليدعم البحث عبر العمود الكياني المناسب (مثل `.eq('order_id', id)` عند الاستعلام عن جدول `orders`).

---

### المرحلة 1: تحديث النماذج وتعاريف الأنواع (`src/types/portalTypes.ts`)

#### الأعمال التنفيذية
1. **تحديث نموذج `PortalUser`:**
   - إضافة المفتاح الرئيسي `portalUserId?: string`.
   - إضافة الأعمدة العلاقية الجديدة: `nameAr`, `nameEn`, `linkedCustomerId`, `isDisabled`.
2. **تحديث وتعريف نموذج `PortalOrder` و `OrderItem`:**
   - إنهاء الاعتماد على `data jsonb` فقط، وتعريف الأعمدة العلاقية الحقيقية: `orderId`, `orderNumber`, `trackingNumber`, `customerId`, `orderStatusId`, `orderStatus1`, `orderSourceId`, `deliveryCourierId`, `shippingCourierId`.
   - إضافة نموذج `OrderItemDto`: `orderItemId`, `productId`, `productPrice`, `quantity`, `totalPrice`, `totalWeight`, `totalCbm`, `packagingOptionPrice`, `isInsured`, `insuranceFee`.
3. **تحديث وتأكيد نموذج `ShipmentDto`:**
   - تعريف الأعمدة العلاقية: `shipmentId`, `orderId`, `trackingNumber`, `shippingCompanyId`, `courierId`, `shipmentStatus`, `shippingCost`, `weight`, `cartonCount`, `customsFee`, `taxFee`, `categoryFeesTotal`.
4. **تحديث وتعريف نموذج القيود المالية (`MainEntryDto` & `AccountTransDto`):**
   - إضافة تعاريف القيد الرئيسي وحركات الحسابات لتتيح للعميل والمندوب والمورد قراءة حركة الدفتر المالي الحقيقية القادمة من نظام القيود المزدوجة الحديث (`main_entry` و `account_trans`) بدلاً من قراءة رصيد عام غير مدقق.

---

### المرحلة 2: تحديث المحولات والمساعدات التشغيلية (`src/lib/`)

#### الأعمال التنفيذية
1. **تحديث `custDetailsHelper.ts`:**
   - ربط القراءة والتحديث بالمفتاح الحقيقي `cust_detail_id` و `user_uid`.
   - استخدام `customer_id` وتزامن الحقول العلاقية الصريحة `join_by`, `referrer_id`, `onboarding_completed`.
2. **تحديث `financialAccountHelper.ts`:**
   - ربط القراءة بجدول `accounts` الحقيقي باستخدام `account_id`, `account_code`, `account_number`, `parent_code`.
   - توفير محول مؤقت يضمن عدم تضارب رموز الحسابات المالية حتى يتم نقل العملية كلياً للخادم.

---

### المرحلة 3: بناء محولات عقود البيانات الكيانية (`src/data/dtos/mappers/`)

#### الأعمال التنفيذية
1. **إنشاء `order.mapper.ts`:**
   تحويل سجل PostgreSQL الخاص بـ `orders` و `order_items` و `shipments` إلى DTO معيارية بنمط `camelCase` يقرأ كل الأعمدة العلائقية المسجلة.
2. **إنشاء `ledger.mapper.ts`:**
   تحويل سجلات `main_entry` و `account_trans` إلى كشف حساب تفصيلي رصين يوضح الحركة الدائنة والمدينة ورقم القيد ونوع العملية.
3. **إنشاء `customer.mapper.ts` & `user.mapper.ts`:**
   تحويل سجلات `portal_users` و `customers` مع المحافظة على التوافق مع الأنظمة الخارجية.

---

### المرحلة 4: تفكيك وتحديث صفحات مشروع الويب (`src/pages/`)

#### الأعمال التنفيذية
1. **تحديث `MyOrdersPage.tsx`:**
   - تحديث استعلامات الطلبات لتستهدف `orders` و `order_items` و `shipments` باستخدام العلاقات الصريحة.
   - دعم عرض حالة الطلب الحقيقية القادمة من `order_status_id`.
2. **تحديث `CustomerLedgerPage.tsx` و `CourierLedgerPage.tsx` و `SupplierLedgerPage.tsx`:**
   - الاستعلام عن الدفتر المالي الحقيقي من جدول حركات القيود `account_trans` وجدول القيود `main_entry` المربوطة برقم حساب الكيان (`account_id`).
   - عرض رصيد الدفتر المحسوب بدقة دائن/مدين بدلاً من الأرقام التقديرية.
3. **تحديث `CustomerTrackModal.tsx` (التتبع الآمن):**
   - مطابقة رقم التتبع عبر `orders.tracking_number` أو `shipments.tracking_number`.
   - قراءة حالة الشحنة الرسمية من `shipments.shipment_status` وخطوات التتبع الزمني القادمة من `orders_history`.

---

### المرحلة 5: خطة الاختبار والتحقق التكاملي (Integration Verification)

1. **فحص TypeScript:**
   تشغيل `npx tsc -b` للتأكد من مطابقة جميع الأنواع والمساعدات لمخطط قاعدة البيانات الجديد.
2. **فحص بناء تطبيق الويب:**
   تشغيل `npm run build` لتأكيد نجاح التجميع.
3. **التوثيق الحصري وسجلات الأوامر:**
   حفظ كافة السجلات والتغييرات داخل ملفات `alx_web` الخاصة بالمشروع حصراً.

---

## 5. مصفوفة التحديث والتناظر بين حقول الويب وقاعدة البيانات الحقيقية

| مجال البيانات | حقل الويب القديم | عمود Supabase PostgreSQL الحقيقي | الجدول | النوع في PostgreSQL |
|---|---|---|---|---|
| معرف الطلب | `id` | `order_id` | `orders` | `text` |
| رقم الطلب | `orderNumber` | `order_number` | `orders` | `text` |
| رقم التتبع | `trackingNumber` | `tracking_number` | `orders` / `shipments` | `text` |
| حالة الطلب | `status` / `orderStatus` | `order_status_id` / `order_status1` | `orders` | `text` |
| معرف الشحنة | `id` | `shipment_id` | `shipments` | `text` |
| تكلفة الشحن | `shippingFee` | `shipping_cost` | `shipments` | `numeric` |
| وزن الشحنة | `weight` | `weight` | `shipments` | `numeric` |
| معرف صنف الطلب | `id` | `order_item_id` | `order_items` | `text` |
| الكمية | `quantity` | `quantity` | `order_items` | `numeric` |
| معرف مستخدم البوابة | `uid` / `id` | `portal_user_id` | `portal_users` | `text` |
| دور المستخدم | `portalRole` | `portal_role` | `portal_users` | `text` |
| معرف الحساب المالي | `id` / `accountId` | `account_id` | `accounts` | `text` |
| رمز الحساب المحاسبي | `accountCode` | `account_code` | `accounts` | `text` |
| الرصيد المالي | `balance` | `balance` | `accounts` | `numeric` |
| معرف القيد الرئيسي | غير موجود سابقاً | `main_entry_id` | `main_entry` | `text` |
| حالة ترحيل القيد | غير موجود سابقاً | `posting_status` | `main_entry` | `text` |
| معرف حركة الحساب | غير موجود سابقاً | `account_trans_id` | `account_trans` | `text` |
| نوع الحركة | غير موجود سابقاً | `trans_type` (`debit`/`credit`) | `account_trans` | `text` |

---

## 6. النتيجة والتوصيات

بهذه الخطة المحدثة والمطابقة لأحدث خريطة جُلبت المباشرة عبر Supabase MCP، نضمن أن عملية إعادة هيكلة وتحديث مشروع الويب `alx_web` لن تجرى على أسماء حقول قديمة أو ملغاة، بل ستقوم بتحديث كافة أنواع، ومحولات، واستعلامات الويب لتتكامل بنسبة 100% مع المخطط الحديث لنظام الطلبات، الشحنات، القيود الحسابية الحقيقية، والحسابات الكيانية.

---
**ملاحظة:** تم تحديث وحفظ هذه الخطة داخل مجلد مشروع الويب حصراً في المسار:
`f:\system\swiftship-tracker\swiftshift2\SWIFTSHIP_SYSTEM\alx_web\web_pre_api_restructure_plan_ar.md`
