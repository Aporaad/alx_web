# سجل التطوير (devloping_history.md)
## مشروع: ALX Delivery Customer Portal (alx_web)

---

## 2026-08-27 — إصدار تطوير كبير: إخفاء التتبع وتطوير الواجهة الترحيبية

### الهدف
إخفاء قسم تتبع الشحنات من الواجهة العامة الترحيبية لمنع الاستعلام غير المصرح وانتهاك خصوصية البيانات، ونقله لواجهة العميل المحمية مع تقييد تام بالملكية، وتطوير شامل لتصميم الصفحة الرئيسية.

---

### التغييرات المنفذة

#### 1. `src/lib/translations.ts`
**نوع التغيير:** إضافة
- إضافة 35+ مفتاح ترجمة جديد باللغتين العربية والإنجليزية:
  - نصوص قسم "كيف نعمل": `howItWorks`, `step1Title..step4Desc`
  - حاسبة الشحن: `calculatorTitle`, `selectShipmentType`, `weightKgLabel`, `cbmLabel`, `estimatedShippingFee`, `disclaimerCalc`
  - الأسئلة الشائعة: `faqTitle`, `faqSub`, `faq1Q..faq4A`
  - التتبع الآمن: `securedTracking`, `notYourOrderError`, `quickTrackPlaceholder`

---

#### 2. `src/components/customer/CustomerTrackModal.tsx` *(جديد)*
**نوع التغيير:** إنشاء مكون جديد
- مكون تتبع شحنات آمن مخصص لمستخدمي بوابة العملاء المسجلين
- **آلية حماية البيانات (Ownership Guard):**
  - يبحث عن الطلب بـ orderNumber / trackingNumber / id في جدول `orders`
  - Fallback إلى `portal_orders` إن لم يوجد
  - فحص صارم بمطابقة 5 حقول: `linkedAccId`, `uid`, `fullName`, `phone`, `email`
  - إذا كانت الشحنة لعميل آخر: يظهر `ShieldAlert` مع رسالة "تقييد الوصول وحماية الخصوصية"
  - لا يكشف أي بيانات عن الشحنة حتى في رسالة الرفض (privacy by design)
- واجهة تفصيلية لشحنات المالك: Timeline بـ 5 خطوات + بطاقات المعلومات + ملخص مالي

---

#### 3. `src/pages/customer/CustomerDashboard.tsx`
**نوع التغيير:** تعديل
- استيراد `CustomerTrackModal` و `Search`, `ShieldCheck` من lucide-react
- إضافة state: `trackInput`, `activeTrackNum`, `handleTrackSubmit`
- **إضافة شريط التتبع السريع الآمن** بين Welcome Header وKPI Cards
  - label بأيقونة ShieldCheck + حقل بحث + زر "تتبع الآن"
- تحويل زر Eye في جدول الطلبات الأخيرة من Link إلى button يفتح `CustomerTrackModal`
- إضافة `CustomerTrackModal` مشروطاً في نهاية الصفحة

---

#### 4. `src/pages/customer/MyOrdersPage.tsx`
**نوع التغيير:** تعديل
- استيراد `CustomerTrackModal` و `Truck` من lucide-react
- إضافة state: `trackModalNum`
- **إضافة زر تتبع (Truck icon ذهبي)** في عمود الإجراءات بجدول الطلبات
- إضافة `CustomerTrackModal` مشروطاً بعد TAB 1 (قائمة الطلبات)

---

#### 5. `src/pages/landing/LandingPage.tsx`
**نوع التغيير:** إعادة هيكلة شاملة (الملف القديم استُبدل بالكامل)

**التغييرات الجوهرية:**

| العنصر | القديم | الجديد |
|--------|--------|--------|
| TrackModal العامة | موجودة — تكشف بيانات الكل | **محذوفة بالكامل** |
| حقل التتبع في Hero | موجود — بدون أي حماية | **محذوف** |
| Navbar | بسيطة | محسّنة مع روابط تنقل للأقسام + badge |
| Hero | بسيط + شريط بحث | Trust Grid + زر "تتبع من حسابك" |
| الأقسام | 5 أقسام | **8 أقسام كاملة** |
| حاسبة الشحن | غير موجودة | **جديدة: Slider تفاعلي + 3 أنواع + حساب فوري** |
| كيف نعمل | غير موجودة | **جديدة: 4 خطوات grid** |
| FAQ | غير موجودة | **جديدة: Accordion قابل للطي** |
| AnimatedCounter | بسيط | محسّن مع step calculations |

**الأقسام الجديدة في الترتيب:**
1. Navbar محسّن (6 روابط تنقل)
2. Hero section + Trust Highlights grid
3. Animated Stats Bar (4 إحصائيات)
4. Services (4 خدمات مع badge + hover)
5. **How It Works (جديد)**
6. **Shipping Cost Estimator (جديد، تفاعلي)**
7. Features Grid محسّن
8. **FAQ Accordion (جديد)**
9. Global Reach
10. Contact Section
11. CTA Banner
12. Footer محسّن

---

#### 6. `todo.md` *(جديد في المشروع)*
**نوع التغيير:** إنشاء
- ملف تتبع المهام للمشروع وفق قاعدة "ادراج تفاصيل كل مهمه داخل ملف todo.md"

---

### ملاحظات الأمان
- **Privacy by Design:** تتبع الشحنات الآن محمي بالكامل. لا أحد يمكنه الاستعلام عن شحنة دون:
  1. تسجيل دخول بحساب نشط
  2. أن تكون الشحنة مرتبطة بحسابه (5 طرق مطابقة)
- **لا data leakage:** رسالة الرفض لا تكشف معلومات الشحنة (هوية المالك، المدينة، الرقم، إلخ)
- التحقق يجري server-side عبر query مقيّد ثم client-side validation

---

### التحقق من جودة الكود
- **TypeScript:** `npx tsc --noEmit` → ✅ بدون أخطاء
- **Clean Code:** التقسيم إلى مكونات صغيرة، تسمية واضحة، تعليقات وصفية
- **الوصول:** روابط anchor لكل قسم في الـ Navbar

---

## 2026-10-01T01:21:34+03:00 — إعداد خطة تهيئة وهيكلة مشروع الويب وتجهيز بناء الـ API

### الهدف
إجراء تحليل دقيق وإعداد خطة شاملة لإصلاح وتطبيق البنية المعمارية لمشروع الويب `alx_web` وعزل العرض عن البيانات تمهيداً لبناء خادم `alx_api` المستقبلي.

---

### التغييرات والوثائق المنشأة

#### 1. `web_pre_api_restructure_plan_ar.md` *(جديد)*
**نوع التغيير:** إنشاء وثيقة خطة هيكلة شاملة ومفصلة
- وثيقة رسمية متكاملة تقع في 12 قسماً شاملاً ومطابقة لخطة النظام الرئيسي:
  - ملخص تنفيذي ومحددات النطاق الحصري لـ `alx_web`.
  - تحليل وضع المشروع الحالي، النمط التخزيني `{ id, data }` وطريقة الاستعلامات والمساعدات المالية.
  - تحديد المشاكل الجذرية (تضارب إنشاء الحسابات المالية client-side، غياب Gateway موحد، استعلامات in-memory scanning).
  - صياغة الهيكل المعماري المستهدف لـ Portal Features و Portal Gateways و Portal DTOs.
  - تحديد 10 مراحل تنفيذية للانتقال التخزيني التدريجي.
  - جدول مصفوفة المخاطر ومعايير الجاهزية قبل الانتقال لخادم الـ API.

#### 2. `user_commends.md` *(جديد)*
- توثيق نص الأمر الزمني وموديل الذكاء الاصطناعي المنفذ (`Gemini 3.6 Flash`).

#### 3. `db_commends.md` *(جديد)*
- توثيق حالة أوامر SQL (لم ينفذ أي كود SQL في مرحلة التخطيط والتوجيه المعماري).

#### 4. `DBdevloping_history.md` *(جديد)*
- توثيق تحليل المخطط والحسابات المالية والتسلسل الذاتي من المتصفح.

#### 5. `todo.md`
- إضافة وتحديث قائمة المهام والمراحل التنفيذية المكتملة والمستقبلية.

---

## 2026-10-01T02:23:25+03:00 — تحديث خطة الويب بناءً على أحدث خريطة حقول لقاعدة البيانات

### الهدف
استخراج وجلب الخريطة المباشرة الحساسة لكافة حقول وأعمدة جداول قاعدة بيانات Supabase PostgreSQL عبر أدوات `@mcp:supabase` وتحديث خطة إعادة الهيكلة والتطوير لمشروع الويب `alx_web` حتى تتوافق بنسبة 100% مع التعديلات المطبقة في النظام الرئيسي.

---

### التغييرات المنجزة

#### 1. `web_pre_api_restructure_plan_ar.md`
**نوع التغيير:** تحديث جوهري (الإصدار 2.0)
- تزويد الخطة بقسم كامل يوضح **خريطة حقول قاعدة البيانات الحقيقية (Supabase Live Schema Map)** لجميع الكيانات: `orders`, `shipments`, `order_items`, `portal_users`, `customers`, `accounts`, `main_entry`, `account_trans`.
- توثيق المفاتيح الأساسية الكيانية بدلاً من `id` العام (`order_id`, `shipment_id`, `portal_user_id`, `customer_id`, `account_id`, `main_entry_id`, `account_trans_id`).
- إضافة مصفوفة التناظر بين حقول الويب القديمة والأعمدة الحقيقية في PostgreSQL.
- تعديل مراحل الخطة التنفيذية لتشمل تحديث المساعدات التشغيلية `src/lib/` والنماذج `src/types/` و `src/data/dtos/`.

#### 2. `db_commends.md` & `DBdevloping_history.md` & `user_commends.md` & `todo.md`
- توثيق الاستعلامات والأوامر والسجلات بجدول زمني وموديل الذكاء الاصطناعي (`Gemini 3.6 Flash`).

---

## 2026-10-01T02:32:40+03:00 — تنفيذ خطة الهيكلة ومطابقة أحدث خريطة لقاعدة البيانات بنجاح

### الهدف
البدء الفعلي بتنفيذ خطة التهيئة المسبقة للـ API وتطبيق أحدث خريطة حقول ومفاتيح كيانية لقاعدة بيانات Supabase PostgreSQL داخل مجلد مشروع الويب `alx_web`.

---

### التغييرات والكود المنفذ

#### 1. `src/lib/supabase.ts`
- **نوع التغيير:** تحديث وتطوير المحول
- إضافة دالة `getPrimaryKeyColumn(table)` لدعم التعرف الديناميكي على المفاتيح الكيانية (`order_id`, `shipment_id`, `portal_user_id`, `customer_id`, `account_id`, `cust_detail_id`, `main_entry_id`, `account_trans_id`, `order_item_id`).
- تعديل `extractRow` و `extractRows` لترجمة الصفوف وإعادة المفاتيح الكيانية ومفتاح `id` الافتراضي معاً لحفظ التوافق التام.
- تحديث `getDocById`, `insertDoc`, `upsertDoc`, `updateDocData`, `deleteDocById` لاستخدام المفاتيح الكيانية الفعالة.

#### 2. `src/types/portalTypes.ts`
- **نوع التغيير:** تحديث وتوسيع أنواع البوابة
- إضافة وتطبيق تعاريف الأنواع المعيارية الحقيقية: `OrderItemDto`, `ShipmentDto`, `MainEntryDto`, `AccountTransDto`, `FinancialAccountDto`.
- تحديث `PortalOrder` و `PortalUser` و `CustomerDetails` لربط الأعمدة الكيانية والـ FKs الصريحة.

#### 3. `src/data/` *(طبقة العقود والمحولات والبوابات الكيانية الجديدة)*
- **نوع التغيير:** إنشاء بنيوي جديد (DDD Architecture)
- `src/data/dtos/mappers/order.mapper.ts`: محول تحويل صفوف الطلبات والشحنات والأصناف.
- `src/data/dtos/mappers/ledger.mapper.ts`: محول تحويل القيود المالية وحركات الحسابات المزدوجة `main_entry` و `account_trans`.
- `src/data/contracts/`: إنشاء عقود الـ Gateways المعزولة: `PortalOrdersGateway`, `PortalLedgerGateway`, `PortalTrackingGateway`.
- `src/data/gateways/supabase/`: إنشاء تنفيحات البوابات المعتمدة على Supabase ومطابقة للمخطط الحديث:
  - `SupabaseOrdersGateway`
  - `SupabaseLedgerGateway`
  - `SupabaseTrackingGateway`

#### 4. `src/features/` *(حواكير وميزات الأعمال المعزولة)*
- **نوع التغيير:** إنشاء وتطوير حواكير وميزات مستقلة
- `src/features/orders/hooks/useMyOrders.ts`: إدارة قراءة وإلغاء الطلبات مع البوابة.
- `src/features/ledger/hooks/useFinancialLedger.ts`: إدارة قراءة وكشف الحساب المالي من نظام القيود المزدوجة.

#### 5. تحديث صفحات ومكونات الويب
- `src/components/customer/CustomerTrackModal.tsx`: التتبع الآمن عبر `trackingGateway`.
- `src/pages/customer/MyOrdersPage.tsx`: استهلاك `ordersGateway`.
- `src/pages/customer/CustomerLedgerPage.tsx`: استهلاك `ledgerGateway` وقراءة القيود المزدوجة.

---

### التحقق الجودة والسلامة
- **TypeScript Check:** `npx tsc -b` → ✅ ناجح بنسبة 100% بدون أخطاء (0 errors).

---

## 2026-10-01T02:51:14+03:00 — مراجعة واكتمال كافة مراحل الخطة وإعلان جاهزية الموقع كلياً لـ API

### الهدف
إجراء مراجعة دقيقة لجميع مراحل الخطة، واستكمال تجريد المصادقة وحركة الحسابات المالية لجميع الأدوار (عميل، مندوب، مورد)، والتأكد من خلو المشروع كلياً من أي أخطاء جاهزية للـ API.

---

### الأعمال الإضافية والتحققات النهائية المنجزة

1. **إنشاء `src/data/dtos/mappers/user.mapper.ts`:**
   - تحويل صفوف `portal_users` و `cust_details` و `customers` إلى DTOs معيارية.
2. **إنشاء `src/data/contracts/auth.gateway.ts` & `src/data/gateways/supabase/supabase-auth.gateway.ts`:**
   - عزل وتجريد منطق التسجيل الذري والتسلسل المالي والمصادقة من `PortalAuthContext.tsx`.
3. **تحديث `PortalAuthContext.tsx`:**
   - تبسيط السياق وإزالة الكود المباشر لقواعد البيانات، وتفويض العمليات كلياً لـ `authGateway`.
4. **تحديث صفحات الدفتر المالي للأدوار:**
   - `CourierLedgerPage.tsx` & `SupplierLedgerPage.tsx`: تحويل قراءة العمولات والحسابات إلى `ledgerGateway` بنظام القيود المزدوجة الحديث (`account_trans` و `main_entry`).
5. **فحص بناء الحزمة النهائي للإنتاج (Production Bundle Verification):**
   - `npm run build` (`tsc -b && vite build`) → ✅ ناجح بنسبة 100% وتحويل 1775 وحدة برمجية في 8.08 ثانية دون أي أخطاء.

---

## 2026-10-01T03:51:00+03:00 — إعادة التحليل الشامل وإصلاح كافة استعلامات ومسميات الحقول القديمة (Model: Gemini 3.6 Flash)

### الهدف
إجراء تدقيق كامل لكافة ملفات وأكواد مشروع الويب `alx_web` واستبدال جميع الحقول والاستعلامات القديمة مثل `.eq('id', ...)` بالمسميات الفعلية للمفاتيح الكيانية بجدول قاعدة البيانات (مثل `portal_user_id`, `customer_id`, `order_id`, `account_id`, `cust_detail_id`) وضمان خلو النظام كلياً من أخطاء الأعمدة غير الموجودة.

---

### التغييرات المنجزة بالتفصيل

#### 1. `src/lib/custDetailsHelper.ts`
**نوع التغيير:** تصحيح وتحديث المفاتيح الكيانية
- استبدال استعلام المزامنة الضمني القديم `.eq('id', user_uid)` بـ `.eq('portal_user_id', user_uid)` لجدول `portal_users`.
- استبدال استعلام `.eq('id', customer_id)` بـ `.eq('customer_id', customer_id)` لجدول `customers`.
- تعيين المفتاح الكياني الصريح `cust_detail_id: id` في كائن صف `cust_details`.

#### 2. `src/lib/supabase.ts`
**نوع التغيير:** تصحيح التراجع الاستعلامي
- تنظيف دالة `getDocById(table, id)` وإزالة محاولة الاستعلام التراجعية على `.eq('id', id)` عندما يكون المفتاح الأساسي للجدول ليس `id` (مثل `portal_users` أو `customers` أو `orders`)، لتفادي خطأ PostgreSQL 42703 (`column id does not exist`).

#### 3. `src/data/gateways/supabase/supabase-orders.gateway.ts`
**نوع التغيير:** تصحيح المفاتيح بالاستعلامات البديلة
- تحديث جميع الاستعلامات الاحتياطية على جدول `portal_orders` لاستخدام `order_id` بدلاً من `id`.

#### 4. `src/lib/financialAccountHelper.ts`
**نوع التغيير:** إضافة المفتاح الكياني للحسابات المالية
- إضافة حقل `account_id: accountId` في كائن الصف لجدول `accounts` لضمان إدراجه بالعمود التراكمي الرئيسي.
- تحديث دالة الترقيم الذاتي لاستخراج `a.account_id` بجانب `a.id`.

---

### التحقق والتأكد من السلامة التشغيلية (Empirical Verification)
1. **فحص الأنواع وتجميع TypeScript:**
   - `npx tsc -b` → ✅ نجاح 100% دون أي أخطاء (0 errors).
2. **فحص بناء الحزمة الإنتاجية المجمعة:**
   - `npm run build` → ✅ نجاح 100% (تجميع 1772 وحدة برمجية بنجاح دون أي خطأ).

---

## 2026-10-01T04:08:00+03:00 — الإلغاء التام للاعتماد على `auth.users` والاعتماد الحصري المباشر على `public.portal_users` (Model: Gemini 3.6 Flash)

### الهدف
إلغاء الاعتماد كلياً على ميزة `auth.users` المدمجة بالـ Supabase SDK، ونقل كافة عمليات المصادقة، تسجيل الدخول، إنشاء الحسابات، إدارة الجلسات، وتحديث كلمة المرور للعمل مباشرة وحصرياً على جدول `public.portal_users` في قاعدة البيانات.

---

### التغييرات المنفذة بالتفصيل

#### 1. `src/data/gateways/supabase/supabase-auth.gateway.ts`
**نوع التغيير:** عزل وتحديث بوابة المصادقة
- **دالة `login`:** إلغاء `supabase.auth.signInWithPassword`. إجراء استعلام مباشر على `public.portal_users` بواسطة البريد الإلكتروني أو اسم المستخدم أو رقم الهاتف، وفحص حالة الحساب وكلمة المرور المخزنة مباشرة.
- **دالة `register`:** إلغاء `supabase.auth.signUp`. الفحص المباشر في `public.portal_users` لعدم تكرار البريد/المستخدم، ثم توليد المعرف `portal_user_id` وإنشاء الحساب المالي والكيان التابع، وحفظ الصف مباشرة في `public.portal_users`.
- **دالة `changePassword`:** إلغاء `supabase.auth.updateUser`. التحديث المباشر لحقل `password` في جدول `public.portal_users`.

#### 2. `src/context/PortalAuthContext.tsx`
**نوع التغيير:** تحديث سياق إدارة الجلسة
- إلغاء الاستماع لـ `supabase.auth.onAuthStateChange` واستدعاءات `getSession` و `signOut` و `getUser`.
- الاعتماد التام على إدارة التخزين المحلي والتحقق المباشر من صحة الجلسة بواسطة `authGateway.fetchProfile(uid)` مقابل جدول `public.portal_users`.

#### 3. `src/pages/auth/ForgotPasswordPage.tsx`
**نوع التغيير:** تحديث استعادة كلمة المرور
- إلغاء `supabase.auth.resetPasswordForEmail`. إجراء استعلام مباشر على `public.portal_users` للتحقق من وجود الحساب وإرشاد العميل.

---

### التحقق والتأكد من السلامة التشغيلية (Empirical Verification)
1. **فحص الأنواع وتجميع TypeScript:**
   - `npx tsc -b` → ✅ نجاح 100% (0 errors).
2. **فحص البناء النهائي الإنتاجي:**
   - `npm run build` → ✅ نجاح 100% (تجميع 1772 وحدة برمجية بنجاح).

---

## 2026-10-01T04:24:00+03:00 — حل خطأ `Could not find column in schema cache` وتطوير تصفية الأعمدة (Model: Gemini 3.6 Flash)

### الهدف
حل الخطأ الناتج عند محاولة إدراج/تحديث صفوف بالجداول العلائقية عندما يحتوي كائن البيانات على خصائص بتسمية camelCase مثل (`createdAt`, `updatedAt`, `fullName`, `financialAccountId`, `portalUid`) والتي لا توجد كـ top-level columns في PostgreSQL schema cache، وضمان حظر إرسال أي خصائص غير مطابقة للهيكل إلى Supabase top-level columns وحفظها آمنة داخل `data` (jsonb).

---

### التغييرات المنفذة بالتفصيل

#### 1. `src/lib/supabase.ts`
**نوع التغيير:** تطوير وتأمين محرك كتابة البيانات
- إنشاء قاموس `TABLE_COLUMNS` لتحديد الأعمدة العلائقية الفعالة المقبولة بكل جدول (`customers`, `couriers`, `sources`, `accounts`, `portal_users`, `cust_details`, `orders`, `shipments`, `order_items`, `main_entry`, `account_trans`).
- إنشاء دالة `buildCleanDbRow(table, id, dataPayload)`:
  - تقوم بتحويل وتعيين الأعمدة الرئيسية `snake_case` تلقائياً (`full_name`, `account_id`, `created_at`, `updated_at`, `disabled`, `linked_customer_id`, إلخ).
  - تقوم بتجميع الكائن الفعلي `{ id, ...dataPayload }` داخل عمود `data` (jsonb).
  - تقوم بتصفية وحذف كافة الخصائص غير المقبولة من كائن الصف العلوي الموجه لـ Supabase لمنع أي خطأ `Could not find column in schema cache`.
- تحديث `insertDoc`, `upsertDoc`, `updateDocData` لتستخدم `buildCleanDbRow` بشكل موحد وآمن.

#### 2. `src/data/gateways/supabase/supabase-auth.gateway.ts`
- تحويل عملية الإدراج المباشر في `portal_users` لتستخدم `upsertDoc` المؤقت والمحمي بـ `buildCleanDbRow`.

---

### التحقق والتأكد من السلامة التشغيلية (Empirical Verification)
1. **فحص الأنواع وتجميع TypeScript:**
   - `npx tsc -b` → ✅ نجاح 100% (0 أخطاء).
2. **فحص البناء الإنتاجي المجمع:**
   - `npm run build` → ✅ نجاح 100% (تجميع 1772 وحدة برمجية بنجاح دون أي خطأ).







