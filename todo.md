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

## [2026-10-02 00:56:00 +0300] — المرحلة 13 — AI Model: Manus
- [x] إنشاء `src/api` و`src/contracts`.
- [x] إضافة عقود Public Tracking وPortal Session بلا PII أو أسرار.
- [x] عزل Supabase legacy خلف `src/lib/legacy-supabase`.
- [x] إضافة PortalGateway وfeature flag HTTP مع إبقائه غير مفعل افتراضياً.
- [ ] نقل أول consumer read-only بعد اعتماد endpoint server contract.

## [2026-10-02 01:12:00 +0300] — المرحلة 13 — AI Model: Manus
- [x] إضافة `PortalAnnouncementDto` و`getAnnouncements()`.
- [x] نقل `AnnouncementsPage` إلى PortalGateway و`runQuery`.
- [x] إضافة عقد AsyncState محلي للموقع.
- [ ] نقل بقية صفحات portal وإزالة imports المباشرة تدريجياً بعد اعتماد endpoints.

## [2026-10-02 01:23:00 +0300] — المرحلة 13 — AI Model: Manus
- [x] إزالة استدعاء Supabase المباشر غير المستخدم من `LandingPage`.
- [x] التحقق من البناء بعد التنظيف.
- [ ] متابعة نقل الصفحات التي تحتوي data access فعلي إلى PortalGateway بعد تثبيت DTOs الآمنة.

## [2026-10-03 03:44:30 +0300] — مراجعة المرحلة 13 بعد سحب آخر نسخة — AI Model: Manus
- [x] مراجعة كل imports واستعلامات Supabase المباشرة في الموقع.
- [x] نقل CustomerTrackModal إلى PortalGateway بدلاً من القراءة المباشرة من orders/portal_orders.
- [x] منع عرض الاسم والعنوان والهاتف والرصيد من PublicTracking UI.
- [x] إضافة fallback legacy محدود إلى PublicTrackingDto دون PII.
- [x] نجاح `npm run build` و`git diff --check`.
- [ ] نقل PortalAuthContext وبقية الصفحات إلى Gateway HTTP.


## [2026-10-04T02:00:08+03:00] — Portal HTTP Gateway وتهيئة API — AI Model: Manus
- [x] تحديث HTTP Gateway لقراءة envelopes وتحقق DTOs runtime للإعلانات والتتبع.
- [x] إضافة خمس اختبارات Gateway: envelopes، 404، ترميز token، رفض الاستجابة المشوهة، وfeature flag.
- [x] نجاح `npm run check` و`npm test` و`npm run audit:portal-boundary` و`npm run build`.
- [ ] بقية الـPortal Auth والعمليات/الصفحات ما تزال على Supabase/legacy؛ feature flag يبقى معطلاً حتى نشر backend-compatible routes واعتماد auth flow.
- التفاصيل في المستودع المرتبط `Aporaad/swiftship/docs/pre-api/repair-execution-and-api-scaffold-2026-10-04.md`.

## [2026-10-18T00:01:00+03:00] — إصلاح alx_web والاعتماد الكلي على alx_api (P0–P7) — AI Model: Qoder
- [x] P0 تثبيت خط الأساس (قراءة فقط، بلا تغييرات).
- [x] P1 حذف كود Supabase الميت بعد التحقق من بديل alx_api.
- [x] P2 فصل اقتران البناء والأسرار (package.json، vite.config.ts، .env، boundary script).
- [x] P3 توحيد feature flags نحو alx_api فقط (src/api/config.ts، env.d.ts، إصلاح MyOrdersPage).
- [x] P4 مطابقة العقود والأنواع (إصلاح Supplier stage + الترجمات + إزالة casts).
- [x] P5 ترتيب الهيكل (README بترميز UTF-8، أرشفة docs/archive، حذف المكرر، .gitignore).
- [x] P7 التحقق الآلي الشامل: tsc=0، audit نظيف، tests 17/17، build=0؛ وتطابق 20/20 مسار/أسلوب مع alx_api.
- [ ] اختبار الدخان الحي في المتصفح (يتطلب تشغيل قاعدة البيانات — من إدارة المالك) ثم الاعتماد النهائي.
- التفاصيل في `alx_web_api_migration_plan_ar.md` و`devloping_history.md`.

## [2026-10-18T00:29:04+03:00] — اختبار الدخان الحي في المتصفح (قاعدة البيانات أصبحت جاهزة) — AI Model: Qoder
- [x] `health/ready` → `database:true, auth:true`؛ و`portal/announcements` أرجعت بيانات حقيقية بغلاف `{success,data,requestId}`.
- [x] تشغيل `npm run dev` على :5174 وقيادة المتصفح (browser-use).
- [x] الصفحة الترحيبية `/`: عرض كامل لكل الأقسام + الحاسبة التفاعلية، بلا أي خطأ JS، والـ RTL سليم.
- [x] صفحة `/auth/login`: عرض كامل للحقول والأزرار والروابط، بلا أخطاء.
- [x] التكامل الحي مع alx_api مؤكد: التطبيق ينادي `:3001/api/v1/portal/auth/me` ويتعامل مع `401` (غير مسجّل) بأمان دون انهيار؛ لا أثر لـ Supabase في Runtime.
- [x] إيقاف خادم التطوير (PID 19024) بدقة؛ `alx_api` على :3001 بقي حياً (HTTP 200).
- [ ] التدفقات المحمية (orders/ledger/tickets/courier/supplier) تتطلب بيانات دخول — تحققت منها على مستوى العقود (20/20) وبناء كل صفحاتها؛ الاختبار الحي المسجَّل يحتاج بيانات اعتماد من المالك (لم أسجّل/أدخل بلا إذن لتفادي أي كتابة في القاعدة).

## [2026-10-18T02:06:57+03:00] — إعادة تدقيق نهائي شامل مقابل حالة alx_api الحالية — AI Model: Qoder
- [x] إعادة كل البوابات: tsc=0، vitest 17/17، audit=نظيف.
- [x] مسح Supabase عميق على كامل alx_web: صفر تبعيات/استيراد/متغيرات؛ السطران الوحيدان تعليقان توثيقيان "لا يوجد اعتماد على Supabase".
- [x] package.json + package-lock.json: 0 مرجع supabase؛ البناء لا يُنتج وحدة supabase.
- [x] رصد تغيّرات غير ملتزَمة في alx_api (مراحل qoder 2/3/4): `portal-owned` لم يُمسّ (متوافق 100%)؛ `portal-auth` تغيّر لكنه متوافق مع الإصدارات السابقة.
- [x] تحليل `portal-auth`: حقول جديدة `sessionExpiresAt` و`disabled` في الاستجابة — المُتحقق الهيكلي في الواجهة يتجاوز الحقول الإضافية بأمان (لا انكسار).
- [x] مطابقة `PortalAuthProfileDto` حقلًا بحقل مع دالة `identity()` الحالية في الخادم.
- [x] كود الخادم دفاعي (`portalSessionsCarryDevice`): يستعلم information_schema ويضمّن أعمدة الجهاز فقط إن وُجدت — تسجيل الدخول يعمل بغض النظر عن تطبيق الهجرة 0047.
- [x] تأكيد استقلال alx_web عن النظام الرئيسي: tsconfig الجذر يستثنيه، وصفر استيراد من `src/` الجذر.
- [ ] للمالك: تطبيق الهجرة 0047 لتفعيل مزايا حقائق الجهاز/تنظيف الجلسات (كودها دفاعي فلن ينكسر تسجيل الدخول قبلها)؛ تنظيف ملفات `tmp-*.ts` المؤقتة في alx_api (من جلسات qoder).
- ملاحظة: استعلام Supabase (قراءة) حُظر من مصنِّف الأذونات؛ اكتُفي بالفحوص الداخلية وقراءة كود alx_api.

## [2026-10-18 03:27 +03:00] — إعادة هيكلة بوابة العميل — AI Model: Qoder
- [x] حفظ خطة شاملة v2 في `alx_web/alx_web_customer_portal_restructure_plan_ar.md` (10 أقسام + معالج طلبات + أمن).
- [x] دمج ملاحظات المالك التسعة: إبقاء length/width/height، حذف ثوابت العملات، زر كشف حساب مخصص، الدفع بنك-فقط مع اختيار البنك، جدول `job_req`/`jobs_req`، إخراج مسارات المورد تمامًا، تعديل/حذف طلب «معلق» مملوك فقط، الكوبون كما النظام مؤقتًا، الدفع = «طلب سداد» مؤقتًا.
- [x] تحقّق المخطط (read-only): `products` تحتوي length/width/height (أمّا `order_items` فلا)؛ طلب التوظيف موجود كاملًا في alx_api ويكتب جدول `jobs_req`.
- [x] P0-أمن: إزالة تسريب ربح العميل-الدّاخلي `companyProfitSAR` (و`shippingCostSAR`) من إسقاط قراءات بوابة العميل؛ الخادم ما زال يحسبها ويخزّنها داخليًا. tsc نظيف + 9 suites / 37 tests خضراء.
- [ ] P1 (endpoints) وP2..P7 (الواجهات) قيد التنفيذ.

## [2026-10-18 04:16 +03:00] — قراءات P1 المقيّدة بالملكية — AI Model: Qoder
- [x] سلة العميل `GET /portal/cart` (من `returned_products` بـ `customer_id=$1`) + بوابة alx_web `listCustomerCart` + اختباره.
- [x] الشحنات `GET /portal/shipments` والتتبّع `GET /portal/tracking/:num` من `shipments JOIN orders` بنفس شرط الملكية؛ لا `shipping_cost` ولا `courier_id`/`shipping_company_id`. بوابة: `listCustomerShipments`/`getTrackingByNumber` (رقم خارج الملكية → 404 → null بلا تسريب وجود).
- [x] تحقّق: alx_api `jest portal` = 10 suites / 43 tests؛ `tsc` نظيف. alx_web `vitest src/api` = 14 tests؛ `tsc` نظيف.
- [ ] **عائق D4:** لا جدول بنوك في المخطط ولا في الـmigrations؛ `public.currency`/`cur_price` موجودان (جدول عملات معتمد) لكن `banks` غير موجود. «اختيار البنك من قائمة» (خطوة الدفع) يحتاج مصدر بيانات أو قرار مالك قبل P3/P5.

## [2026-10-18 04:41 +03:00] — إغلاق D4/D2 وقراءة البنوك — AI Model: Qoder
- [x] قرار المالك (D4): لا جدول `banks` مستقل — البنوك = صفوف `public.accounts` بـ `account_code LIKE '112%'` ومفعّلة. `GET /portal/banks` يعيد `accountId`+`accountCode`+`name` فقط (بلا `balance`/`entity_id`/`cur_no`). بوابة alx_web `listBanks` + `isPortalBank` + اختبار (بلا كشف رصيد).
- [x] قرار المالك (D2): نموذج العملة ديناميكي من `public.currency` (`code`/`symbol`/`isDefault`؛ مُخدَّم عبر `GET /api/v1/currencies`). كل مبالغ العميل: `amount` + `currencyCode` + `currencySymbol` (لا YER/SAR/USD ثابتة). هذا يُنفَّذ كقطعة واحدة مع `quote` + الماليات (P5) لأن محرّك التسعير الحالي YER-مبني ويحتاج حلّ عملة حساب العميل.
- [x] اكتملت قراءات P1 المقيّدة بالملكية/المرجعية: sources، items، previous-products، cart، shipments، tracking، banks. تحقّق: alx_api 7/7 tests + tsc نظيف؛ alx_web 14 tests + tsc نظيف.
- [ ] متبقّي P1: `POST /portal/orders/quote` (خادمي، عملة من public.currency) و`GET /portal/finance/{balance,stats,statement}` — مرتبطة بقطعة العملة. ثم P2 (الهيكل/التنقّل) غير محجوزة الآن.

## [2026-10-18 23:01 +03:00] — P1b ملكیة الكتابة: حذف/تعديل الطلب المعلّق (D7) — AI Model: Qoder
- [x] `DELETE /portal/orders/:id`: معاملة واحدة — قفل الصف (`FOR UPDATE`) + شرط ملكية الطلب + شرط كونه «طلب معلق» (name_ar أو order_status_id=1)، ثم استدعاء `delete_orders_with_dependents`. لا يملك/لا يوجد→404، يملك لكنه ليس معلّقًا→409، معلّق→حذف ذرّي للتوابع. بوابة alx_web `deleteCustomerOrder`.
- [x] `PATCH /portal/orders/:id`: نفس البوابة (ملكية+mعلّق)، تحديث بأعمدة بيضاء ثابتة فقط (`recipient_name/phone/address`, `delivery_city`, `goods_description`) + `updated_at`. **لا** يكتب حالة/تكلفة/ربح/عملة/أصناف. لا حقل قابل للتعديل→لا كتابة. بوابة `updateCustomerOrder` (يعيد DTO بعد التحديث).
- [x] اختبارات حارس: 3 (delete) + 4 (update) تشمل منع تسريب الأعمدة الداخلية في SET، ورفض حقن المعرّف، ومسار COMMIT/ROLLBACK.
- [x] تحقّق: alx_api `jest portal` = 12 suites / 51 tests + tsc نظيف. alx_web `vitest` = 17 + tsc نظيف.
- [ ] متبقّي P1b: `POST /portal/orders/quote` (خادمي، عملة محايدة من public.currency، بلا ربح/تكلفة) + `GET /portal/finance/{balance,stats,statement}` (D3) وإزالة ثوابت `YER/SAR/USD` من DTO الدفع (D2). لا DDL.

## [2026-10-18 20:41 +03:00] — P1b: عرض السعر + الماليات المملوكة + تحييد D2 — AI Model: Qoder
- [x] `POST /api/v1/portal/orders/quote`: يُحسب على الخادم بنفس محرّك `calculatePortalOrderPricing` المستخدم عند الإنشاء (quote==create). يعيد `PortalOrderQuoteDto { payableAmount=totalCostYER, currency{code,symbol}, totalWeight, totalCBM }` فقط. الأمان: لا `companyProfitSAR`/`shippingCostSAR`/`totalCostSAR`/`exchangeRateYER` ولا خلط SAR/YER. بلا idempotency ولا حالة.
- [x] عملة العرض تُحلّ من `public.currency` عبر `getPortalDisplayCurrency()` (is_default+is_active) — لا حرفية عملة في المنطق (D2). تحقّق حيّ: YER/'ر.ي'.
- [x] `GET /api/v1/portal/finance/balance` (D3): رصيد `accounts.balance` للحساب المرتبط `financialAccountId` فقط، بعملة الحساب نفسه (رمز من public.currency). null→409 إذا غاب الحساب.
- [x] `GET /api/v1/portal/finance/stats` (D3): عدّ الطلبات بالحالة + `totalPaid`/`totalOutstanding` (مجموع `amount_paid`/`amount_remaining`) مقيّدة بشرط ملكية العميل. لا أرباح/تكاليف داخلية. (statement = `/portal/ledger` الموجود.)
- [x] تحييد D2 في الدفع: `portalPaymentRequestCreateSchema.currency` صار رمز 3 أحرف يُتحقّى منه ضد `getSupportedCurrencyCodes()` (public.currency) بدل `z.enum(['YER','USD','SAR'])`؛ DTO وتمريرة المستودع صارا `string`؛ مُخرِج `toPaymentRequest` يمرّر الرمز المخزَّن دون استبدال حرفي؛ بوّابة alx_web تتحقّق بـ`/^[A-Z]{3}$/`.
- [x] `orderData.currency:'SAR'` مُبقًى عمدًا: يُغذّي عمود `order_currency_code` (أساس تسعير الخدمة كما النظام الرئيسي) — ليست حرفية عرض؛ مُوثّق بتعليق.
- [x] بوابة alx_web: أنواع `PortalCurrencyDto/PortalOrderQuoteDto/PortalCustomerBalanceDto/PortalCustomerFinanceStatsDto` + `quoteCustomerOrder/getCustomerBalance/getCustomerFinanceStats` + المحقّقات.
- [x] تحقّق: alx_api `jest` = 49 suites / 427 tests (منها ملفّان جديدان: quote 4 + finance 5) + tsc نظيف. alx_web tsc نظيف. لا DDL.
- [ ] متبقّي: P2 الهيكل/التنقّل، P3 واجهة الطلبات (ساحر يستخدم quote)، P4 تتبّع+سلة، P5 واجهة الماليات (تستهلك balance/stats/ledger)، P6 دعم+لوحة، P7 تحقّق شامل.

## [2026-10-18 20:51 +03:00] — P2: الهيكل والتنقّل (10 أقسام) — AI Model: Qoder
- [x] `CustomerLayout.tsx`: قائمة تنقّل من 10 أقسام مطابقة للخطة §3 (لوحة/الطلبات/التتبع/السلة/المالية/الهدايا/الاعلانات/الدعم/مكتبني/الملف) بأيقوناتها. حُذفت «طلب جديد» و«كشف حسابي» من الشريط (تنتقلان تحت الطلبات/المالية) مع إبقاء المسارات القديمة تعمل.
- [x] `App.tsx`: مسارات جديدة `tracking/cart/finance/gifts/office/support` + إعادة توجيه المسار القديم `tickets→support`. `orders`/`new-order` يبقيان على `MyOrdersPage` حتى P3.
- [x] `PortalPlaceholderPage.tsx`: صفحة هيكلية معاد استخدامها للتتبع/السلة/المالية (تُستبدل بصفحات حقيقية في P4/P5) وللهدايا/مكتبني (هيكل دائم حسب §4.6/§4.9).
- [x] `translations.ts`: مفاتيح تنقّل جديدة (orders/tracking/cart/finance/gifts/office/shipments/myProducts/placeholderComingSoon).
- [x] تحقّق: alx_web `tsc --noEmit` نظيف + `vitest` = 4 suites / 17 tests أخضر. لا تغيير API/DDL في هذا المقطع.
- [x] تقسيم `MyOrdersPage` إلى قائمة mirror (أعمدة + فلتر فترة + تعديل/حذف معلق D7) + تبويبات (الطلبات/الشحنات/منتجاتي) + معالج يستخدم `quote` الخادمي.

## [2026-10-19 00:13 +03:00] — P3: وحدة الطلبات (بوابة العميل) اكتملت — AI Model: Qoder
- [x] §2.2 أمني: إزالة محرّك التسعير من المتصفح في `MyOrdersPage` — استُبدل `calcs`/`dbSettings` بتقديري خادمي عبر `quoteCustomerOrder` (POST `/portal/orders/quote`) مع debounce 350ms؛ الواجهة تعرض فقط `payableAmount` + رمز العملة الخادمي، ولا تظهر أي من: ربح/تكلفة شحن/سعر صرف/رسوم منديب/تفصيل SAR.
- [x] حذف `payload` الميت و`genOrderNumber` وحالة `amountPaidYER`/الدفعة المقدمة من العميل (الدفع يمرّ عبر طلب دفع معتمد من الموظفين فقط).
- [x] إبطاء حروف SAR/YER/USD الثابتة في حقول الإدخال والشارة؛ عرض موحّد للأرقام في القائمة/التفاصيل بدون عملات ثابتة (D2).
- [x] D7: واجهة تعديل/حذف للطلبات المعلَّقة فقط (`isPending`) عبر `updateCustomerOrder`(PATCH)/`deleteCustomerOrder`(DELETE) — حقول تواصل فقط؛ الخادم يفرض الملكية والحالة.
- [x] تحقّق: alx_web `tsc --noEmit` نظيف، `vite build` ناجح، `vitest` = 4 suites/17 tests أخضر، وفحص أمني على `dist/assets/*.js` = صفر تسريب (companyProfitSAR/exchangeRate*/shippingCostSAR/totalCostSAR/YER/SAR/USD). لا DDL.
- [ ] P4 التالي: استبدال placeholder بصفحتي التتبع والسلة الحقيقيتين.

## [2026-10-19 00:17 +03:00] — P4: التتبع + السلة (بوابة العميل) اكتمل — AI Model: Qoder
- [x] `TrackingPage.tsx`: بحث برقم التتبع عبر `getTrackingByNumber` (الخادم يفرض الملكية) + خط زمني لوجستي (إنشاء/شحن/وصول متوقع/تسليم) بلا أي تكلفة داخلية أو معرّف ناقل.
- [x] `CartPage.tsx`: قائمة قراءة فقط عبر `listCustomerCart` (مرتجعات/سلة) — منتج/كمية/رقم طلب/حالة/تاريخ؛ لا أسعار أو تكاليف أو معرّفات داخلية.
- [x] `App.tsx`: استبدال placeholder بمساري `tracking` و`cart` بصفحتين حقيقيتين (lazy). `finance` يبقى placeholder حتى P5.
- [x] تحقّق: `tsc --noEmit` نظيف، `vite build` ناجح، فحص أمني على `dist/assets/*.js` = صفر تسريب. لا DDL.
- [ ] P5 التالي: واجهة المالية (رصيد/إحصاءات/دفتر/كشف/طلب دفع) — يتطلب إضافة `GET /portal/finance/account` و`/portal/finance/statement` في `alx_api`.

## [2026-10-19 00:20 +03:00] — P5: المالية (بوابة العميل) اكتملت — AI Model: Qoder
- [x] تبيّن أن كل نقاط API المالية موجودة في `alx_api`/gateway (balance/stats/ledger/banks/payment-requests GET+POST) — لا حاجة لنقاط `account/statement` جديدة.
- [x] `finance/useCustomerFinance.ts`: خطاف جلب بيانات (منطق معزول عن UI) عبر Promise.allSettled للمصادر الأربعة، مقيّد ملكياً في الخادم.
- [x] `finance/PaymentRequestForm.tsx`: إنشاء طلب دفع (D9) بمبلغ/طريقة/مرجع/ملاحظات + عملة من الرصيد الخادمي؛ يعرض بنوك التحويل (D4) كقراءة فقط عند اختيار التحويل؛ الطلب يُعتمد من الموظفين فقط.
- [x] `finance/FinancePage.tsx`: تبويبا نظرة مالية (رصيد/مدفوع/متبقٍّ/طلبات بعدّ حالة + سجل الطلبات) والدفتر الحسابي؛ لا حساب نقدي في المتصفح.
- [x] `App.tsx`: استبدال placeholder بمسار `finance`. `gifts/office` يبقيان placeholder دائم (§4.6/§4.9).
- [x] تحقّق: `tsc --noEmit` نظيف، `vite build` ناجح، `vitest` = 4/17، فحص أمني = صفر تسريب تسعير (المطابقة الوحيدة `accountId` هي حقل تحقق نوعي لدفتر العميل نفسه وغير معروض). لا DDL.
- [ ] P6 التالي: الدعم (job_req) + لوحة التحكم.

## [2026-10-19 00:48 +03:00] — P6: الدعم (job_req) + لوحة التحكم + سدّ فجوة كشف الحساب (D3) — AI Model: Qoder
- [x] دعم التوظيف (خلفية `alx_api`): إضافة `jobs_req` عبر `listJobRequests`/`createJobRequest` (عقود/سكيما/مستودع/خدمة/مسارات). المِلكية عبر `created_by = portalUserId`؛ الجدول الفعلي `public.jobs_req` بلا إنشاء (D5)، والتحقق من الأعمدة تم بقراءة فقط قبل الكتابة.
- [x] دعم التوظيف (واجهة `alx_web`): `customer/support/JobRequestSection.tsx` (قائمة + نموذج إنشاء مبنيّ على بيانات العميل) و`CustomerSupportPage.tsx` (تبويبا التذاكر/الوظائف)، وربط مسار `support`.
- [x] لوحة التحكم (§4.1) أُعيد بناؤها `CustomerDashboard.tsx`: بطاقات إجمالي/قيد المعالجة/مُسلَّمة + الرصيد (عملة محلولة من رصيد الحساب، بلا اسم عملة ثابت D2)، آخر 5 طلبات، آخر حركات (دفتر مقيّد ملكياً)، وإعلانات (`GET /api/v1/portal/announcements` عام بلا بيانات ملكية). ممنوع أي ربح/تكلفة/معدّل — مؤكَّد.
- [x] بوابة `portalAuthGateway.ts`: `listAnnouncements` + DTO `PortalAnnouncementDto` + حارس نوع؛ الأول `this.request` (عام) مع تدهور آمن لمصفوفة فارغة.
- [x] D3 كشف حساب مخصص (سُدّت الفجوة): خلفية `GET /api/v1/portal/finance/statement?from&to&type` (عقود/مستودع/خدمة/مسار/سكيما `statementQuerySchema`) — حركات `account_trans⋈main_entry` المُرحَّلة فقط، مقيّدة بالحساب المالي للعميل، وفترة/نوع مُعاملة كمعاملات مرقّمة. لا تسريب معرّف حساب داخلي أو رقم عملة.
- [x] أمامية D3: `portalAuthGateway.getCustomerStatement` + DTOات `PortalCustomerStatementDto`/`PortalStatementEntryDto`/`PortalStatementQuery` + حارس نوع؛ `finance/useCustomerStatement.ts` (منطق معزول)، `finance/StatementSection.tsx` (من/إلى/نوع Credit/Debit + طباعة)، وتبويب «كشف حساب» في `FinancePage`.
- [x] تحقّق: alx_web `tsc` نظيف، `vite build` ناجح، `vitest` = 4/17، فحص أمني على `dist/assets/*.js` = صفر تسريب. alx_api `tsc` نظيف، `jest` = 49 suites/427 tests أخضر. فحص SQL قراءة فقط أكّد تنفيذ استعلام الكشف وصحة `trans_type` (Credit/Debit). لا DDL.
- [ ] P7 التالي: التحقق الشامل والدخان الحي والتوثيق النهائي.

## [2026-10-19 00:58 +03:00] — P7: التحقق الشامل + تدقيق أمني وإصلاح تسريبات متبقية — AI Model: Qoder
- [x] تدقيق أمني شامل على حزمة `dist/assets/*.js` كشف تسريبين متبقيين داخل نطاق بوابة العميل: (1) **LandingPage**: مُقدِّر تكلفة بحساب في المتصفح يعرض أسعارًا داخلية ثابتة (18 SAR/كغ، 450 SAR/CBM، صرّاف 390/535) + نص YER/USD — انتهك §0 (معدّلات) وD2. أُزيلت بالكامل؛ استُبدلت بدعوة محايدة «السعر يُصدر من الخادم داخل البوابة». (2) **CustomerLedgerPage**: عملات ثابتة YER/USD/SAR + حساب مدين/دائن/رصيد جارٍ في المتصفح + نموذج دفع ذاتي — انتهك §0/§4.5 (لا ترحيل من البوابة). أُتقاعد المسار: `ledger` يوجّه الآن إلى `FinancePage` المطابقة، وأُزيل الاستيراد الكسول فاختفى الـchunk.
- [x] تحقّق سلبي: `deliveryCourierFee`/`exchangeRate`/`totalCostSAR`/`companyProfit` صفر في الحزمة. `YER` المتبقي في MyOrdersPage هو مفتاح خاصية بيانات (`totalCostYER`) للمستحق المملوك للعميل، ليس نص عملة معروضًا._residual في صفحات المندوب/المورد خارج النطاق المعلن (§ courier/supplier)._
- [x] دخان حي على `alx_api` (منفذ نظيف 3099): `GET /portal/announcements` = 200 عام بلا بيانات ملكية؛ `GET /portal/finance/statement` = 401 (المسار مُسجَّل والجلسة مفروضة)؛ `GET /portal/job-requests` = 401. أُوقف خادم الدخان بعد الاختبار دون المساس بخادم المطوّر القائم.
- [x] التحقّق النهائي: alx_api `tsc` نظيف + `jest` = 49/427 أخضر؛ alx_web `tsc` نظيف + `vite build` ناجح + `vitest` = 4/17 + فحص أمني = صفر تسريب عملة/تكلفة/ربح/معدّل في نطاق العميل. لا DDL.
- [x] النطاق: P0–P7 مكتملة وفق الخطة (لوحة/طلبات/تتبع/سلة/مالية+كشف/دعم+توظيف) مع مبدأ «يرى العميل ما يخصّه فقط».

## [2026-10-19 01:19 +03:00] — §5: بناء معالج إنشاء الطلب (CreateOrderWizard) واستبدال نموذج الصفحة الواحدة — AI Model: Qoder
- [x] فجوة مكتشفة عند إعادة تدقيق §5: كان الإنشاء نموذج صفحة واحدة مدمجًا داخل `MyOrdersPage` (تبويب create) بلا خطوات مرئية، وقائمة «مصدر الشراء» لا تُحمَّل فعليًا من الخادم، والدفع يعرض نقدي/تحويل/محفظة بدل «البنك فقط» — يخالف §5 و§6.
- [x] ملف جديد `pages/customer/orders/CreateOrderWizard.tsx`: معالج أربع خطوات مرئية (§5): ① المصدر (تحميل حيّ من `GET /portal/sources`) · ② المنتجات (L/W/H + CBM تلقائي + «اختيار منتج سابق» من `GET /portal/orders/previous-products` مقيّد بالملكية، والتغليف/الاستعجال/الملاحظات) · ③ الدفع **البنك فقط** (بنوك مرجعية من `GET /portal/banks` = اسم + رمز بلا أرصدة — D4، والمستحق من `POST /portal/orders/quote` بعملة محايدة — D2) · ④ المراجعة والإرسال. خطوة المناديب/الشحن **مخفية تمامًا**.
- [x] أمان (§0): لا حساب سعري في المتصفح؛ صفر ربح/تكلفة/معدّل/صناديق داخلية؛ `paymentMethod='Transfer'` (بنك) حصراً بلا نقدي/محفظة؛ الطلب «معلق» بلا ترحيل مالي (D9).
- [x] `MyOrdersPage.tsx`: استُبدلت كتلة النموذج المدمجة بـ`<CreateOrderWizard/>` وحُذف منطق الإنشاء الميت؛ بقيت القائمة/التفاصيل/تعديل D7/التتبع. `NewOrderPage` يمرّر `initialMode='create'`.
- [x] التحقق: alx_web `tsc --noEmit` نظيف + `vite build` ناجح؛ فحص سلبي على Wizard = صفر عملة ثابتة/تكلفة/ربح/معدّل. لا DDL ولا استدعاء Supabase.

## [2026-10-19 02:23 +03:00] — إعادة بناء قسم الطلبات بالكامل كنافذة منبثقة مطابقة للنظام (تراجُع عن المعالج-التبويبة) — AI Model: Qoder
- [x] قرار المالك: رفض معالج §5 كتبويبة؛ يجب أن يكون الإنشاء **نافذة منبثقة** تنسخ تصميم/خطوات نموذج النظام `src/components/orders/CreateOrderModal.tsx` مع إخفاء الحقول السرّة فقط.
- [x] `orders/CreateOrderModal.tsx` (جديد): نافذة منبثقة بخطوات النظام — ① العميل (مرتبط تلقائيًا، قراءة فقط) + المصدر (ظاهر ويُختار) · ② جدول المنتجات + «اختيار منتج سابق» من سجل هذا العميل فقط + كوبون الخصم ظاهر + عمولة البنك مخفية · خطوة المناديب/الشحن مخفية بالكامل · ③ الدفع مسموح داخل النموذج، إخفاء النقدي/متعدد/آجل وإظهار «عبر بنك» معتمد تلقائيًا (بنك + مبلغ مدفوع + مرجع تحويل) · ④ الخلاصة/الحفظ كما بالنظام. يُرسل عبر `createCustomerOrder` (paymentMethod='Transfer') + كوبون/بنك/مرجع داخل الملاحظات (لا DDL).
- [x] `MyOrdersPage.tsx`: حُذفت تبويبة «طلب جديد» تمامًا؛ زر يفتح `CreateOrderModal`. حُذف `CreateOrderWizard.tsx` و`NewOrderPage.tsx`.
- [x] `orders/CreateShipmentModal.tsx` (جديد): نسخ `ShipmentFormModal` مخصص للعميل بثلاث خطوات مع حذف (الطلب المرتبط/شركة الشحن/مندوب التوصيل/حالة الشحنة/تكلفة الشحن). ① تفاصيل العميل (تلقائي) + رقم الشحنة + رقم التتبع · ② نوع/فئة الشحن + فئة المحتوى + عدد الكراتين/الوزن + مصدر/وجهة + تاريخ/مدة/موعد وصول + ملاحظات · ③ الخلاصة + الكوبون + الدفع (بنك). يُحفظ عبر `createCustomerOrder` (بند واحد يحمل التتبع) بلا DDL.
- [x] `orders/ShipmentsListPage.tsx`: أُضيف زر «إنشاء شحنة» + **بحث/فلترة حسب الحالة/فرز الأعمدة** محليًا.
- [x] `finance/FinancePage.tsx`: دمج تبويبتَي «نظرة مالية» + «الدفتر المحاسبي» في تبويب واحد `summary` (+ كشف حساب). نموذج الدفع لم يعد مضمّنًا؛ يظهر فقط عبر زر «طلب دفع جديد».
- [x] `finance/CustomerPaymentModal.tsx` (جديد): مطابق لواجهة النظام «تحصيل دفعة مالية وسند قبض الطلب» مخصص للعميل — وسيلة دفع «عبر بنك» فقط (بلا نقدي/متعدد/آجل)، **بلا حقل PIN**، يُنشئ طلب دفع عبر `createPaymentRequest(paymentMethod='transfer')`. حُذف `PaymentRequestForm.tsx`.
- [x] هيكل أولي: `gifts/GiftsPage.tsx` (الهدايا/المسابقات) و`office/OfficePage.tsx` (الأمنيات السرية/العناصر المفضلة)؛ مسارَي `gifts`/`office` في `App.tsx` يشير إليهما؛ أُزيل مسار `new-order`.
- [x] التحقق: `tsc -b` نظيف + `vite build` ناجح + `vitest` 4/17 + `audit:portal-boundary` نظيف + فحص سلبي على الحزمة = صفر (ربح/تكلفة/معدّل/شحن داخلي). لا DDL ولا Supabase. لا commit.

## [2026-10-19 04:06 +03:00] — إكمال النسخ المطابقة لنماذج النظام: الشحنة + مالية الدفع + الأصدقاء + حاسبة مشتركة — AI Model: Qoder Agent

- [x] **أساس سابق (كان غير موثَّق):** نقاط مرجعية من DB في `alx_api` (currencies / shipping-categories من order_option / item_categories / packaging / order_statuses) وطرق عميلة مقابلة في `portalAuthGateway.ts` (`listCurrencies`/`listShippingCategories`/`listItemCategories`/`listPackagingOptions`/`listOrderStatuses`). إعادة بناء `orders/CreateOrderModal.tsx` نسخةً طبق الأصل من نموذج النظام: شريط علوي (رقم الطلب/التاريخ/العملة/العميل + زر «الحاسبة والمصارفة»)، رقمُ الطلب والتتبع تلقائيّان غير قابلين للتحرير، القوائم من DB حقيقية، وقسم دفع مُسعَّر خادميًّا (عملة + صرف + بنك + مدفوع + متبقٍّ)؛ فئة الصنف `itemCategoryId/Name` تُحفَظ داخل `order_data` JSON بلا DDL.
- [x] **مكوّن حاسبة/مصارفة مشترك (#27):** `pages/customer/shared/PortalCalculatorModal.tsx` (تبويبا حاسبة + تحويل عملات)؛ عملاته من `listCurrencies()` بنسبة صرف موحَّدة من الخادم؛ يُعاد استخدامه في الطلب/الشحنات/المالية. أُنشئت أدوات CSS مشاركة (`animate-spin`/`mono`/`finance-line`) في `styles/global.css`.
- [x] **مالية الدفع (#27):** `finance/CustomerPaymentModal.tsx` أضاف قائمة اختيار عملة حقيقية + زر «الحاسبة والمصارفة» يفتح `PortalCalculatorModal`؛ يرسل `createPaymentRequest` العملةَ المختارة.
- [x] **الشحنات (#26):** `orders/CreateShipmentModal.tsx` أُعيد بناؤه بأسلوب معالج الطلب نفسه: شريط علوي (رقم الشحنة + التتبع تلقائيّان للقراءة فقط + التاريخ + العملة + زر الحاسبة)، قوائم DB حقيقية (نوعُّ الشحن / فئةُ الشحن من order_option / فئةُ المحتوى من items_category / العملة / البنك)، وقسم دفع كامل مُسعَّر من الخادم (عملة + صرف + بنك + دفعة + متبقٍّ). صار الدفع والكوبون حقولًا حقيقية في الطلب بدل hack الملاحظات؛ بقيت تفاصيلُ الشحنة النصية في `notes` فقط (لا مسارَ كتابة شحنات ولا DDL).
- [x] **الأصدقاء (#28):** `pages/customer/friends/FriendsPage.tsx` هيكلةُ تبويبات (أصدقائي / برنامج الإحالة / الأرباح) بحالة فراغ مؤهولة؛ ربطُ المسار lazy `friends` في `App.tsx`، وعنصرُ تنقّل بأيقونة Users في `CustomerLayout.tsx`، ومفتاحُ `friends` في `translations.ts` (TKey مشتقٌّ تلقائيًّا).
- [x] التحقق: alx_api `tsc --noEmit` نظيف؛ alx_web `tsc -b` نظيف + `vite build` ناجح + `vitest` 4/17 + `audit:portal-boundary` نظيف. لا DDL ولا Supabase. لا commit (بانتظار طلب صريح).

## [2026-10-19 05:55 +03:00] — الجولة الأخيرة من مطابقة نماذج النظام: الحاسبة الموحّدة + إعادة بناء الطلب/الشحنة/الدفع — AI Model: Qoder Agent

- [x] **حاسبة/مصارفة موحّدة (#30):** استُبدل تصميم `PortalCalculatorModal.tsx` الحالي بأناقة نموذج النظام (`FinancialCalculatorModal.tsx`) — نفس اللوحة الداكنة/الأزرار الذهبية/المساوي/الحذف الوردي، مبنية بأنماط CSS-INLINE (لا Tailwind في البوابة). الحالة أُعيدت تسميتها إلى `currencyOptions`؛ يُستخدم نفس المكوّن في النماذج الثلاثة (الطلب/الشحنة/الدفع) بلا تكرار (DRY). العميل مسموح له بالمصارفة (تحويل من عملة لأخرى بأسعار الخادم).
- [x] **مكوّنات مشاركة:** `pages/customer/shared/PortalFormBits.tsx` يُصدِّر `sectionTitle/miniLabel/HeaderCell/FinanceLine/SummaryRow/StepBar`؛ و`PreviousProductPickerModal.tsx` (نافذة منبثقة بحث شبيهة بـ`ProductPickerModal` في النظام — لا إغلاق بالنقر خارجها، فقط X).
- [x] **نموذج الطلب (#31) — `orders/CreateOrderModal.tsx`:** أوسع (1180px)، حدود قوية (`--gold-border`)، شريط علوي + شريط خطوات + تذييل ثابتة وجسم متموّر؛ **بلا إغلاق خارجي**؛ رقم الطلب الحقيقي من نقطة `previewOrderCode`؛ عملة الطلب من `formSettings.defaultCurrencyCode`؛ فئة الصنف/التغليف/فئة الشحن حقيقيّة من DB؛ التأمين من الإعدادات (غير قابل للتحرير، يظهر كشارة)؛ «اختيار منتج سابق» صار نافذةً منبثقةً searchable؛ «شحن مستعجل» حُذف (`isUrgent:false`)؛ كوبون الخصم وفئة الشحن نُقلا من خطوة 2 إلى خطوة 3؛ خطوة 3 «المالية والدفع» أضافت مفتاح «الدفع لاحقًا» (يُخفي قسم الدفع ويُحفظ بحالة الطلب الأولى)، وكشفًا ماليًا كاملاً، وإجماليًا بعملة الطلب وعملة الدفع، وعملةَ دفع وسعرَ صرف حقيقيّين من API؛ شارة «عبر بنك (تحويل) — تلقائي» أُزيلت نهائيًا.
- [x] **نموذج الشحنة (#32) — `orders/CreateShipmentModal.tsx`:** نفس قالب الطلب (واسع/ثابت/بلا إغلاق خارجي)؛ رقم الشحنة والتتبع من `previewOrderCode` (الشحنة مشتقة من طلب)؛ عملة الشحنة من `formSettings`؛ فئة الشحن من `order_option` وفئة المحتوى من `items_category` والتغليف من `order_option`؛ حُذف مفتاح «شحن مستعجل»؛ كوبون الخصم نُقل إلى خطوة 3؛ خطوة 3 «الخلاصة والدفع» أضافت «الدفع لاحقًا» وكشفًا ماليًا كاملاً وإجماليًا بعملة الشحنة وعملة الدفع مع سعر الصرف الحقيقي؛ شارة «عبر بنك» أُزيلت.
- [x] **نموذج الدفع المالي (#33) — `finance/CustomerPaymentModal.tsx`:** أوسع (860px)، حدود قوية وفواصل بارزة، ترويسة وتذييل ثابتان وجسم متموّر، **بلا إغلاق بالنقر خارج النافذة** (X فقط)؛ قائمة عملة حقيقية + `PortalCalculatorModal` موحّد؛ أزرار بنك محسّنة بظل ذهبي عند التفعيل؛ ملخّص المبلغ في التذييل.
- [x] **جسر بوابة API (#24):** أُضيفت إلى `PortalAuthGateway` interface: `getFormSettings()` و`previewOrderCode()`؛ وطبّقتا في `portalAuthGateway.ts` مع محقّقات DTO (ترمي `PORTAL_API_INVALID_RESPONSE` عند الشكل الخاطئ). حقل `shippingCategoryId` أُضيف في `PortalOrderCreateInput`.
- [x] التحقق: `tsc -b` نظيف + `vite build` ناجح (chunks: PortalCalculatorModal/CreateShipmentModal/CreateOrderModal) + `vitest` 4/17 + `audit:portal-boundary` نظيف؛ alx_api `tsc --noEmit` نظيف و`jest` 49/49 و427/427. لا DDL ولا Supabase. لا commit (بانتظار طلب صريح).
- [x] **ملاحظة المالك — الكوبون كـ«كود» غير ممكن حاليًا:** قاعدة البيانات لا تحتوي جدول `coupons`، ونموذج النظام نفسه يستخدم حقلَ **مبلغ** (`couponRate: number`) لا كود نصّي. نظرًا لمنْع DDL الصارم، بقي حقل الخصم رقميًا مع تسمية «كوبون الخصم» كما طلب المالك؛ الترقية إلى كوبون نصّي تتطلب جدولًا وممرر تحقّق — مؤجَّل حتى يُصرَّح بـ DDL.

## [2026-10-19 09:20 +03:00] — إصلاحات الموجة الرابعة (نموذجا الطلب/الشحنة + العملات) — AI Model: Qoder Agent
- [x] **نموذج الطلب (#43):** زر المرحلة الأخيرة صار «حفظ الطلب» والحفظ من النقر عليه فقط (إزالة `onSubmit` الضمني — Enter لا يحفظ ولا يُحفظ شيء عند الانتقال للمرحلة 4)؛ كشف مالي تفصيلي في «المالية والدفع» (قيمة المنتجات، تغليف مخصص، تأمين، خصم كوبون، إجمالي بعملة الطلب وعملة الدفع مع سعر الصرف، مدفوع/متبقٍّ)؛ عملة الطلب/الدفع من `formSettings` (default_order_currency)؛ معاينة الرقم ALX-YYMM-nnnn من الخادم.
- [x] **نموذج الشحنة (#44):** إعادة بناء كاملة — الإنشاء عبر `createCustomerShipment` (POST /portal/shipments: صف shipments حقيقي لا طلب)؛ «المدة (أيام)» للقراءة فقط من الإعدادات و«الوصول المتوقع» يُحسب تلقائيًا (غير قابل للتعديل)؛ كشف مالي تفصيلي (كراتين/وزن/رسوم جمركية وضريبة وأخرى لكل كرتون من فئة المحتوى + تغليف + مدفوع/متبقٍّ تقديري)؛ زر «حفظ الشحنة» فقط يحفظ؛ حذف الكوبون وحقول التاريخ/التسعير غير المدعومة في مخطط الشحنة.
- [x] **شريط الخطوات:** إعادة تصميم `StepBar` في `PortalFormBits` وتوسيطه (`justifyContent:center`) مع كبسولة إبراز للمرحلة الحالية وموصلات أطول.
- [x] **قوائم العملات (#45):** تصغير نص قوائم اختيار العملة إلى `0.72rem` في كل واجهات البوابة: نموذج الدفع المالي، نموذج الطلب، نموذج الشحنة، الحاسبة/المصارفة (خانتا من/إلى).
- [x] **جسر API:** `PortalShipmentCreateInput` + `createCustomerShipment(input, idempotencyKey)`؛ `PortalFormSettingsDto.defaultShippingDurationDays` (مُتحقَّق منه في `getFormSettings`)؛ `PortalPaymentRequestInput.bankAccountId`.
- [x] **التحقق:** `tsc -b` نظيف + `vite build` ناجح + `vitest` 17/17 + `audit:portal-boundary` نظيف. لا DDL ولا Supabase. لا commit.
