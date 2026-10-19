
## [2026-10-03 03:44:30 +0300] — AI Model: Manus
- لم يتم تنفيذ SQL أو DDL أو DML في مستودع الموقع.

## [2026-10-18 03:27 +0300] — بوابة العميل: لا DDL — AI Model: Qoder
- **لم يُنفَّذ أي SQL مقابل القاعدة** (لا DDL/DML). عمود `profit_company_sar` يبقى في `public.orders` كما هو.
- تغيّر فقط **استعلام قراءة بوابة العميل** في `alx_api/.../portal-owned.repository.ts`: أُزيل `profit_company_sar` (مفتاح `companyProfitSAR`) و`shipping_cost_sar` (`shippingCostSAR`) من إسقاط `customerOrderFieldColumns`. أي لا يُعاد هذان العمودان لأي ردّ عميل.
- تحقّق read-only من المخطط عبر `src/shared/contracts/database-schema-map.contract.ts`: `products` فيها `length/width/height/cbm/weight`؛ `order_items` بلا أبعاد؛ لا جدول `coupons`؛ جدول التوظيف `jobs_req`.
- DDL بيد المالك فقط؛ أي حاجة لجدول عملات/بنوك تُحدَّد لاحقًا بفحص قراءة.

## [2026-10-18 04:16 +03:00] — قراءات بوابة العميل الجديدة (بلا DDL) — AI Model: Qoder
- **لم يُنفَّذ أي SQL مقابل القاعدة** (لا DDL/DML). فقط استعلامات قراءة `SELECT` أُضيفت في `alx_api/.../portal-owned.repository.ts`: `listCustomerCart` من `public.returned_products` (بشرط `rp.customer_id=$1`)، و`listCustomerShipments`/`getCustomerShipmentByTracking` من `public.shipments JOIN public.orders` (بشرط ملكية الطلب)، مع `LEFT JOIN public.orders` في السلة لجلب رقم الطلب عند وجوده.
- **read-only schema probe (migrations):** `0021_public_tracking.sql` يُنشئ `public_tracking`/`public_tracking_product`/`public_tracking_event`؛ `0018_settings_and_currency_api.sql` يُشغّل RLS على `public.currency` و`public.cur_price` الموجودَين أصلًا (من النظام الرئيسي). **لا يوجد `CREATE TABLE` لأي جدول بنوك** في كل الـmigrations ولا في `database-schema-map.contract.ts`. لذلك خطوة الدفع «اختيار البنك» (D4) مؤجّلة لقرار المالك؛ لا جدول أُنشئ.

## [2026-10-18 04:41 +03:00] — قرارا D4/D2 + استعلام البنوك (بلا DDL) — AI Model: Qoder
- **لم يُنفَّذ أي SQL مقابل القاعدة** (لا DDL/DML).
- قرار المالك (D4): لا جدول `banks`؛ البنوك = `public.accounts` بـ `account_code LIKE '112%'`. أُضيف استعلام قراءة `SELECT account_id, account_code, COALESCE(acc_name_ar/acc_name_en) FROM public.accounts WHERE is_active=true AND account_code LIKE '112%'` في `portal-owned.repository.ts` — لا يُرجع `balance`/`debit_total`/`credit_total`/`entity_id`/`cur_no`.
- قرار المالك (D2): حلّ العملة من `public.currency` (`code`/`symbol`)؛ يُطبَّق فعليًا في قطعتي `quote`/الماليات التاليتين (لم تُنفَّذ بعد).

## [2026-10-18 23:01 +03:00] — كتابة مملوكة على الطلبات (بلا DDL) — AI Model: Qoder
- **لم يُنفَّذ أي DDL/DML يدوي مقابل القاعدة.** التغيير فقط في كود `alx_api` الذي يستدعي القاعدة وقت التشغيل باسم العميل المصادَق عليه:
  - `DELETE /portal/orders/:id` يستدعي الـRPC الموجود `public.delete_orders_with_dependents(text[])` (مُعرَّف من 0036، `SECURITY DEFINER`) بعد قفل الصف والتحقّق من الملكية والحالة «طلب معلق» داخل نفس المعاملة.
  - `PATCH /portal/orders/:id` ينفّذ `UPDATE public.orders SET <أعمدة بيضاء> , updated_at=now()` — لا يمسّ `order_status*`/`total_cost*`/`profit_company_sar`/`shipping_cost_sar`/`order_currency_code`/`exchange_rate_yer`/`order_items`.
- الحارس موثّق باختبارات وحدات (mock pool) — لم تُشغَّل استعلامات فعلية على قاعدة البيانات أثناء التطوير.

## [2026-10-18 20:41 +03:00] — P1b: استعلامات قراءة العملة/المالية (SELECT-only، لا DDL) — AI Model: Qoder
- **فحص مخطط للقراءة فقط** عبر `node --env-file=.env` + pg (SELECT لا غير): `public.accounts` يحتوي `balance`,`currency`,`debit_total`,`credit_total`؛ `public.currency` أعمدتها `cur_id,code,main_name_ar,symbol,is_default,is_active`. الصف الافتراضي: code=YER, symbol=ر.ي (is_default=true)؛ SAR/USD/EGP/EUR غير افتراضية. `public.orders` أعمدة المبالغ: `amount_paid,amount_remaining,total_cost_sar,total_cost_yer,delivery_courier_fee,order_currency_code`.
- **استعلامات جديدة داخل المستودع (قراءة فقط، معامَلة):**
  - `getPortalDisplayCurrency`: `SELECT code, symbol FROM public.currency WHERE is_default=true AND is_active=true LIMIT 1` — مصدر عملة العرض بدل حرفية (D2).
  - `getSupportedCurrencyCodes`: `SELECT code FROM public.currency WHERE is_active=true` — تُتحقّى منها طلبات السداد.
  - `getCustomerBalance`: `... FROM public.accounts a WHERE a.account_id=$1` مع COALESCE لعملة الحساب ورمزها من public.currency — لا حسابات أخرى.
  - `getCustomerFinanceStats`: `SELECT ... FROM public.orders o WHERE o.customer_id=$1 OR (o.order_party_type='customer' AND o.order_party_id=$1) GROUP BY status` يجمّع `amount_paid`/`amount_remaining` — بلا `profit_company_sar`/`shipping_cost_sar`/`total_cost_sar`/`exchange_rate_yer`.
- **لم يُجرَ أي DDL أو INSERT/UPDATE/DELETE على القاعدة**: التحيّن فقط في كود التطبيق/SQL القراءة. الكتابة الوحيدة في المسار تبقى `createCustomerOrder`/`updateCustomerOrder`/`deleteCustomerOrder` القائمة سابقًا (order_currency_code='SAR' كأساس تسعير).
