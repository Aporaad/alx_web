# سجل تطوير وتغييرات قاعدة البيانات - مشروع الويب (DBdevloping_history.md)

---

## [2026-10-01T01:21:34+03:00] - مرحلة تحليل وتجهيز خطة تهيئة الـ API لمشروع الويب

### النطاق:
مشروع الويب `alx_web`.

### التغييرات المنفذة:
- **تحليل المخطط:** تم إجراء تحليل شامل لاستخدامات الجداول العلائقية والنمطية (`portal_users`, `customers`, `couriers`, `sources`, `accounts`, `orders`, `cust_details`).
- **تحديد المخاطر:** توثيق مخاطر توليد الحسابات المالية والقراءات المفتوحة في المتصفح.
- **التشغيل والـ Migrations:** لم يتم إجراء أي تغيير في جداول أو RLS أو Migrations لقواعد البيانات في هذه المرحلة، حيث تقتصر المهمة على التحليل والتخطيط المعماري.

---

## [2026-10-01T02:23:25+03:00] - جلب وتعيين الخريطة الفعلية لقاعدة البيانات الحالية لمطابقة كود الموقع

### النطاق:
مشروع الويب `alx_web`.

### التغييرات والتعيينات المنجزة:
- **جلب المخطط الفعلي عبر `@mcp:supabase`:** تم جلب كافة أسماء وأنواع أعمدة الجداول الرسمية:
  - `orders`: المفتاح `order_id`, والأعمدة `order_number`, `tracking_number`, `customer_id`, `order_status_id`, `order_source_id`, `delivery_courier_id`, `shipping_courier_id`, `order_party_id`, `employee_id`.
  - `shipments`: المفتاح `shipment_id`, والأعمدة `order_id`, `tracking_number`, `shipping_company_id`, `courier_id`, `shipment_status`, `shipping_cost`, `weight`, `carton_count`, `customs_fee`, `tax_fee`.
  - `order_items`: المفتاح `order_item_id`, والأعمدة `order_id`, `product_id`, `product_price`, `quantity`, `total_price`, `total_weight`, `total_cbm`.
  - `portal_users`: المفتاح `portal_user_id`, والأعمدة `username`, `email`, `full_name`, `name_ar`, `name_en`, `portal_role`, `approval_status`, `disabled`, `account_id`, `linked_customer_id`.
  - `customers`: المفتاح `customer_id`, والأعمدة `account_id`, `full_name`, `name_ar`, `name_en`, `customer_level`.
  - `accounts`: المفتاح `account_id`, والأعمدة `account_code`, `account_number`, `account_prefix`, `parent_code`, `type`, `balance`, `debit_total`, `credit_total`.
  - `main_entry` & `account_trans`: المفاتيح `main_entry_id` و `account_trans_id` ونظام القيود المالية المزدوجة الحديث (`posting_status`, `trans_type`, `amount`, `conversion_rate`).
- **تحديث الخطة البنيوية:** تضمين خريطة التناظر بين حقول الويب القديمة والمخطط العلائقي الحقيقي في `alx_web/web_pre_api_restructure_plan_ar.md`.

---

## [2026-10-01T02:32:40+03:00] - تطبيق حقول ومفاتيح قاعدة البيانات الكيانية ومحولات القيود المالية في أكواد الويب

### النطاق:
مشروع الويب `alx_web`.

### التطبيقات والتأثيرات على مستوى قاعدة البيانات:
- **تحديث `src/lib/supabase.ts`:** إضافة دالة `getPrimaryKeyColumn` لدعم المفاتيح الكيانية (`order_id`, `shipment_id`, `portal_user_id`, `customer_id`, `account_id`, `cust_detail_id`, `main_entry_id`, `account_trans_id`, `order_item_id`) مع توفير fallback متوافق.
- **إنشاء محولات DTO Mappers:**
  - `src/data/dtos/mappers/order.mapper.ts`: تحويل صفوف `orders`, `order_items`, `shipments` إلى DTOs معيارية.
  - `src/data/dtos/mappers/ledger.mapper.ts`: تحويل صفوف `main_entry`, `account_trans`, `accounts` إلى DTOs معيارية بنظام القيود المزدوجة الحديث.
- **تطوير البوابات الكيانية (`Gateways`):**
  - `supabase-orders.gateway.ts`
  - `supabase-ledger.gateway.ts`
  - `supabase-tracking.gateway.ts`

---

## [2026-10-01T02:51:14+03:00] - مراجعة وتأكيد اكتمال التوافق الكلي لأكواد الويب مع مخطط قاعدة البيانات الحقيقية

### النطاق:
مشروع الويب `alx_web`.

### التطبيقات المنفذة:
- **تطبيق `user.mapper.ts` & `supabase-auth.gateway.ts`:**
  - سحب منطق توليد الحسابات المالية وإنشاء الكيانات المباشر من React Context وتغليفه في `authGateway`.
  - ربط جداول الكيانات بـ `portal_user_id`, `customer_id`, `account_id`, `cust_detail_id`.
- **ربط دفاتر الحسابات لجميع الأدوار (`CustomerLedgerPage`, `CourierLedgerPage`, `SupplierLedgerPage`):**
  - استعلام الحركة الدفترية المزدوجة المعالجة من `account_trans` و `main_entry` باستخدام `ledgerGateway`.

---

## [2026-10-01T03:51:00+03:00] - المعالجة التدقيقية الشاملة وتحديث الاستعلامات وحقول المفاتيح الكيانية بجميع الملفات (Model: Gemini 3.6 Flash)

### النطاق:
مشروع الويب `alx_web`.

### التطبيقات المنفذة على مستوى جداول واستعلامات قاعدة البيانات:
- **جدول `portal_users`:** استبدال `.eq('id', user_uid)` بـ `.eq('portal_user_id', user_uid)` في `custDetailsHelper.ts`.
- **جدول `customers`:** استبدال `.eq('id', customer_id)` بـ `.eq('customer_id', customer_id)` في `custDetailsHelper.ts`.
- **جدول `cust_details`:** إضافة `cust_detail_id` صراحة في الصف المكتوب لقاعدة البيانات.
- **جدول `accounts`:** إضافة `account_id` في كائن صف الحساب المالي في `financialAccountHelper.ts`.
- **دالة `getDocById`:** إلغاء محاولة التراجع على `id` عند الاستعلام عن الجداول الكيانية ذات المفاتيح المخصصة لتفادي أخطاء PostgreSQL `column id does not exist`.
- **جدول `portal_orders`:** تصحيح الاستعلامات البديلة بالمحولات والـ Gateways لتعمل بمفتاح `order_id`.

---

## [2026-10-01T04:08:00+03:00] - نقل المصادقة والدخول كلياً لجدول `public.portal_users` وإلغاء `auth.users` (Model: Gemini 3.6 Flash)

### النطاق:
مشروع الويب `alx_web`.

### التطبيقات المنفذة على مستوى الجداول والاستعلامات:
- **المصادقة والتسجيل:** إلغاء الاعتماد على schema `auth` لـ Supabase بالكامل.
- **جدول `public.portal_users`:** أصبح المصدر الوحيد والمعتمد رسمياً لإدارة المستخدمين وتسجيل الدخول وتخزين بيانات الاعتماد (`email`, `username`, `phone`, `password`, `portal_role`, `approval_status`, `disabled`, `data`).
- **المعرف الكياني للمستخدم:** إنشاء ومعالجة `portal_user_id` مستقلاً ومباشراً داخل `public.portal_users`.

---

## [2026-10-01T04:24:00+03:00] - تصفية وحجب الخصائص الجانبية كلياً ومنع خطأ schema cache (Model: Gemini 3.6 Flash)

### النطاق:
مشروع الويب `alx_web`.

### التطبيقات المنفذة على مستوى الجداول والاستعلامات:
- **تأمين كافة جداول قواعد البيانات:** (`customers`, `couriers`, `sources`, `accounts`, `portal_users`, `cust_details`, `orders`, `shipments`, `order_items`, `main_entry`, `account_trans`).
- **حظر الأعمدة العلوية غير المعرفة في PostgreSQL:** منع إرسال خصائص مثل `createdAt`, `updatedAt`, `fullName`, `financialAccountId` كـ top-level columns واستبدالها بالأعمدة العلائقية الصريحة `created_at`, `updated_at`, `full_name`, `account_id` وحفظ باقي الخصائص داخل `data` (jsonb).
- **النتيجة:** القضاء التام على أخطاء Supabase Schema Cache `Could not find the column of table in the schema cache` في جميع أنحاء النظام.






