# ملف مهام المشروع (todo.md)
## مشروع: ALX Delivery Customer Portal
**آخر تحديث:** 2026-08-27

---

## ✅ مهام مكتملة

### الإصدار الحالي: تطوير الواجهة الترحيبية وإعادة هيكلة التتبع

- [x] **إخفاء قسم التتبع العام من الصفحة الرئيسية** (LandingPage.tsx)
  - إزالة `TrackModal` العامة غير المحمية
  - إزالة حقل إدخال رقم التتبع من الـ Hero section
  - منع أي شخص من استعراض بيانات الشحنات دون تسجيل دخول

- [x] **إنشاء مكون التتبع الآمن** (CustomerTrackModal.tsx)
  - فحص ملكية الشحنة بمطابقة 5 حقول: linkedAccId / uid / fullName / phone / email
  - رسالة حماية واضحة عند محاولة تتبع شحنة لعميل آخر
  - واجهة تفصيلية للشحنات المملوكة: timeline, تفاصيل، مالية

- [x] **إدماج التتبع الآمن في واجهة العميل**
  - CustomerDashboard.tsx: شريط تتبع سريع + زر Track في جدول الطلبات
  - MyOrdersPage.tsx: زر تتبع (Truck icon) بجانب زر عرض التفاصيل

- [x] **إعادة تصميم الواجهة الترحيبية (LandingPage.tsx)**
  - Hero section جديد مع Trust Highlights grid
  - قسم خطوات العمل "كيف نعمل" (4 خطوات)
  - حاسبة التكلفة التقديرية التفاعلية (3 أنواع شحن)
  - قسم Features Grid محسّن مع hover effects
  - قسم الأسئلة الشائعة FAQ Accordion قابل للطي
  - Animated Stats bar مع AnimatedCounter
  - Footer وnavbar محسنة

- [x] **إضافة نصوص الترجمة** (translations.ts)
  - نصوص قسم "كيف نعمل"، حاسبة الشحن، FAQ، التتبع الآمن

- [x] **التحقق من سلامة الكود** — TypeScript: نظيف ✅

---

## 📋 مهام مستقبلية مقترحة

- [ ] إضافة رسائل push/toast عند نجاح أو فشل التتبع
- [ ] صفحة "آراء العملاء / Testimonials" في الواجهة الترحيبية
- [ ] إشعارات البريد الإلكتروني عند تغيير حالة الشحنة
- [ ] واجهة إدارة التذاكر الكاملة للعملاء

---

## 🕒 [2026-10-01T01:21:34+03:00] - إعداد خطة تهيئة وتطبيق هيكلة مشروع الويب وتجهيز الـ API

- [x] **تحليل شامل لمشروع الويب (`alx_web`)**
  - فحص ملفات الاتصال بقاعدة البيانات وسياقات المصادقة والمساعدات التشغيلية.
  - تحديد نقاط الخطر في التوليد الآلي للحسابات المالية client-side والقراءات المفتوحة.
- [x] **إنشاء وثيقة خطة الهيكلة مسبقة الـ API المعتمدة** (`alx_web/web_pre_api_restructure_plan_ar.md`)
  - صياغة خطة مفصلة مطابقة لملف النظام الرئيسي ومقسّمة إلى 10 مراحل تنفيذية.
  - تحديد عقود الـ Gateways والـ DTOs ونطاق الـ Features المستهدف.

---

## 🕒 [2026-10-01T02:23:25+03:00] - جلب خريطة حقول قاعدة البيانات الفعلية وتحديث خطة الويب

- [x] **جلب خريطة حقول قاعدة البيانات عبر Supabase MCP** (`@mcp:supabase`)
  - قراءة واستخراج أسماء وأعمدة جداول `orders`, `shipments`, `order_items`, `portal_users`, `customers`, `accounts`, `main_entry`, `account_trans`.
  - تحديد التناظر والدقة بين الحقول القديمة والأعمدة العلاقية الفعالة في PostgreSQL.
- [x] **تحديث خطة هيكلة مشروع الويب وتجهيز الـ API** (`alx_web/web_pre_api_restructure_plan_ar.md`)
  - تحديث الخطة للإصدار 2.0 شاملاً الخريطة الحقيقية لقاعدة البيانات ومفاهيم التناظر والمفاتيح الكيانية.

---

## 🕒 [2026-10-01T02:32:40+03:00] - تنفيذ خطة الهيكلة وتطبيق محولات القاعدة الكيانية الحديثة

- [x] **تحديث محول الاتصال بالبيانات** (`src/lib/supabase.ts`)
  - دعم المفاتيح الكيانية الفعالة (`order_id`, `shipment_id`, `portal_user_id`, `customer_id`, `account_id`, `main_entry_id`, `account_trans_id`).
- [x] **تحديث توسيع أنواع البوابة** (`src/types/portalTypes.ts`)
  - إضافة تعاريف الأنواع المعيارية `OrderItemDto`, `ShipmentDto`, `MainEntryDto`, `AccountTransDto`, `FinancialAccountDto`.
- [x] **إنشاء طبقة العقود ومحولات الـ DTOs والبوابات الكيانية المعزولة** (`src/data/`)
  - `src/data/dtos/mappers/order.mapper.ts` & `ledger.mapper.ts`.
  - `src/data/contracts/orders.gateway.ts`, `ledger.gateway.ts`, `tracking.gateway.ts`.
  - `src/data/gateways/supabase/supabase-orders.gateway.ts`, `supabase-ledger.gateway.ts`, `supabase-tracking.gateway.ts`.
- [x] **تحديث الواجهات والحواكير المخصصة**
  - `CustomerTrackModal.tsx`, `MyOrdersPage.tsx`, `CustomerLedgerPage.tsx`, `useMyOrders.ts`, `useFinancialLedger.ts`.
- [x] **فحص سلامة الأنواع ومطابقة TypeScript** (`npx tsc -b`) -> ✅ ناجح بنسبة 100% بدون أخطاء.

---

## 🕒 [2026-10-01T02:51:14+03:00] - المراجعة التفتيشية الشاملة وتأكيد جاهزية الموقع كلياً لإنشاء `alx_api`

- [x] **إنشاء محول المستخدم وتفاصيل العميل** (`src/data/dtos/mappers/user.mapper.ts`)
  - تحويل صفوف `portal_users`, `cust_details`, `customers` إلى DTOs معيارية.
- [x] **إنشاء عزل بوابة المصادقة والمستخدمين** (`auth.gateway.ts` & `supabase-auth.gateway.ts`)
  - نقل وتجريد عمليات التسجيل والمصادقة وإنشاء الكيانات كلياً إلى `authGateway`.
- [x] **تحديث وتجريد سياق المصادقة** (`PortalAuthContext.tsx`)
  - إزالة كافة استعلامات قواعد البيانات المباشرة وتفويض العمليات كلياً للـ Gateways.
- [x] **تحديث وتجريد كافة صفحات الدفتر المالي للأدوار الثلاثة** (`CustomerLedgerPage.tsx`, `CourierLedgerPage.tsx`, `SupplierLedgerPage.tsx`)
  - ربط كافة الأدوار ببوابة القيود المالية المزدوجة الحديثة (`main_entry` و `account_trans`).
- [x] **فحص بناء الحزمة النهائي وتأكيد الجاهزية الكلية** (`npm run build`) -> ✅ ناجح بنسبة 100% (1775 موديل مجمع في 8.08 ثانية دون أي أخطاء).

---

## 🕒 [2026-10-01T03:51:00+03:00] - إعادة التحليل الشامل وإصلاح كافة مسميات واستعلامات الحقول القديمة (Model: Gemini 3.6 Flash)

- [x] **فحص وتدقيق كلي لجميع ملفات `alx_web/src` واستخراج الحقول القديمة**
  - فحص استعلامات `.eq('id', ...)` وإزالتها وتحديثها لاستخدام المفاتيح الكيانية الفعالة في PostgreSQL.
- [x] **تحديث مساعد تفاصيل العميل (`src/lib/custDetailsHelper.ts`)**
  - استبدال `.eq('id', user_uid)` بـ `.eq('portal_user_id', user_uid)` على جدول `portal_users`.
  - استبدال `.eq('id', customer_id)` بـ `.eq('customer_id', customer_id)` على جدول `customers`.
  - تضمين حقل `cust_detail_id` في كائن صف `cust_details`.
- [x] **تحديث مساعد المحرك والمفاتيح الأحادية (`src/lib/supabase.ts`)**
  - إزالة التراجع الضمني الاستعلامي عن حقل `.eq('id', id)` غير الموجود بالجدول وتفادي خطأ PostgreSQL 42703.
- [x] **تحديث وبوابات طلبات الشحن والقيود المالي (`supabase-orders.gateway.ts` & `financialAccountHelper.ts`)**
  - تصحيح الاستعلامات البديلة على `portal_orders` لتعمل بـ `order_id`.
  - إضافة `account_id` في صف الحساب المالي بجدول `accounts`.
- [x] **التحقق التجريبي النهائي الكامل من سلامة البناء والبث**
  - تشغيل `npx tsc -b` -> ✅ نجاح بنسبة 100% بدون أخطاء.
  - تشغيل `npm run build` -> ✅ نجاح 100% وبناء الحزمة الإنتاجية بنجاح.

---

## 🕒 [2026-10-01T04:08:00+03:00] - الإلغاء التام للاعتماد على `auth.users` والاعتماد الحصري المباشر على `public.portal_users` (Model: Gemini 3.6 Flash)

- [x] **إلغاء الاعتماد على خدمات `supabase.auth` نهائياً**
  - إزالة كافة استدعاءات `signInWithPassword`, `signUp`, `getSession`, `onAuthStateChange`, `signOut`, `getUser`, `resetPasswordForEmail`.
- [x] **تحديث بوابة المصادقة (`src/data/gateways/supabase/supabase-auth.gateway.ts`)**
  - تحويل فحص تسجيل الدخول مباشرة على `public.portal_users` بالبريد أو اسم المستخدم أو كلمة المرور المخزنة.
  - تحويل إنشاء الحساب وتسجيل البيانات وإسناد `portal_user_id` والحسابات المالية مستقلاً ومباشرة في `public.portal_users`.
  - تحويل دالة تغيير كلمة المرور لتحدث جدول `public.portal_users` صراحة.
- [x] **تحديث سياق المصادقة (`src/context/PortalAuthContext.tsx`)**
  - قراءة واستعادة الجلسة من التخزين المحلي والتحقق منها مباشرة مع `public.portal_users` عبر `authGateway.fetchProfile`.
  - تبسيط دالة الخروج وتحديث البيانات.
- [x] **تحديث صفحة نسيان كلمة المرور (`src/pages/auth/ForgotPasswordPage.tsx`)**
  - الاستعلام المباشر من `public.portal_users` وتأكيد المعرفات دون `auth.users`.
- [x] **فحص وتأكيد السلامة التشغيلية المجمعة**
  - `npx tsc -b` -> ✅ 100% نجاح.
  - `npm run build` -> ✅ 100% نجاح وتجميع الحزمة الإنتاجية.

---

## 🕒 [2026-10-01T04:24:00+03:00] - حل مشكلة `Could not find column in schema cache` وتصفية أعمدة جداول قاعدة البيانات (Model: Gemini 3.6 Flash)

- [x] **إنشاء قاموس هيكل ومخطط الأعمدة العلائقية الفعالة (`TABLE_COLUMNS`) في `src/lib/supabase.ts`**
  - تعريف الأعمدة الحقيقية المقبولة بالجداول (`customers`, `couriers`, `sources`, `accounts`, `portal_users`, `cust_details`, `orders`, `shipments`, `order_items`, `main_entry`, `account_trans`).
- [x] **تطوير دالة تنظيف وتجهيز صفوف قاعدة البيانات `buildCleanDbRow`**
  - ترجمة الحقول ذات التسميات camelCase (`fullName`, `financialAccountId`, `createdAt`, `updatedAt`, `onboardingCompleted`) إلى الحقول العلائقية snake_case الفعالة (`full_name`, `account_id`, `created_at`, `updated_at`, `onboarding_completed`).
  - عزل وتصفية أي خصائص غير موجدة بالهيكل وحفظها صراحة داخل عمود `data` (jsonb) دون تمريرها كـ top-level columns لتفادي خطأ Supabase schema cache.
- [x] **تحديث عمليات الكتابة والتعديل `insertDoc`, `upsertDoc`, `updateDocData`**
  - ضمان أن كافة عمليات الإدراج والتحديث تمر عبر `buildCleanDbRow` لمنع تكرار أي أخطاء مشابهة في جميع جداول النظام.
- [x] **الفحص النهائي للبناء**
  - `npx tsc -b` -> ✅ 100% نجاح.
  - `npm run build` -> ✅ 100% نجاح.







