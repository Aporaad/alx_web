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

## [2026-10-02 00:56:00 +0300] — بدء Portal Gateway للمرحلة 13 — AI Model: Manus
- أضيفت عقود `PublicTrackingDto` الخالية من PII و`PortalUserSessionDto` الخالية من الأسرار.
- أضيف `PortalGateway` وHTTP implementation خلف `VITE_PORTAL_API_ENABLED` و`VITE_PORTAL_API_BASE_URL`، مع fallback آمن غير مفعل افتراضياً.
- عُزلت implementation Supabase القديمة في `src/lib/legacy-supabase/supabase.ts` وأصبح `src/lib/supabase.ts` compatibility re-export مؤقتاً.
- التحقق: `npm run build` ناجح. لا SQL أو تغييرات قاعدة بيانات أو RLS.

## [2026-10-02 01:12:00 +0300] — Portal Gateway consumer — AI Model: Manus
- أضيف `PortalAnnouncementDto` و`getAnnouncements()` مع HTTP endpoint `/api/v1/portal/announcements`.
- نُقلت `AnnouncementsPage` من `getCollection` المباشر إلى `portalGateway` و`runQuery`.
- أضيف `src/contracts/ui.contracts.ts` لعقد AsyncState الخاص بالموقع.
- التحقق: `npm run build` ناجح، ولا توجد تغييرات SQL أو قاعدة بيانات.

## [2026-10-02 01:23:00 +0300] — تنظيف LandingPage ضمن المرحلة 13 — AI Model: Manus
- أزيل استدعاء `supabase.from('announcements')` غير المستخدم من `LandingPage`، مع حذف state وtype غير المستخدمين.
- لم يتغير سلوك العرض لأن البيانات لم تكن مستخدمة في JSX.
- التحقق: `npm run build` ناجح.

## [2026-10-03 03:44:30 +0300] — إصلاح بوابة التتبع العام — AI Model: Manus
- تم نقل `CustomerTrackModal` إلى `portalGateway.getPublicTracking` وإزالة Supabase المباشر من المكوّن.
- أصبح العرض يعتمد على `PublicTrackingDto` ويعرض الحالة والأحداث العامة فقط، دون PII أو رصيد أو عنوان.
- أضيف fallback legacy محدود يعيد حقول العقد العام فقط.
- تحقق البناء بنجاح بعد التغيير.


## [2026-10-04T02:00:08+03:00] — استكمال HTTP read gateway — AI Model: Manus
تم تعديل `src/api/portalGateway.ts` لاستهلاك success envelope والتحقق runtime من DTOs للإعلانات والتتبع، مع ترميز tracking token، واختبار gateway (`src/api/portalGateway.test.ts`). أضيفت إعدادات `.env.example` مع إبقاء `VITE_PORTAL_API_ENABLED=false` حتى نشر الـroutes؛ جرى إضافة `check` و`test` scripts واعتماد Vitest. تحقق TypeScript والاختبارات الخمسة وبوابة imports والبناء جميعها ناجحة. لا يزال `PortalAuthContext` وبقية CRUD/read routes غير منقولة؛ هذا تحسين انتقالي وليس اكتمال مرحلة Portal.

## [2026-10-18T00:01:00+03:00] — إصلاح شامل لـ alx_web: إزالة Supabase نهائياً والاعتماد الكلي على alx_api (P0–P7) — AI Model: Qoder

### الهدف
تنفيذ خطة `alx_web_api_migration_plan_ar.md`: التخلص النهائي من Supabase، إزالة الكود الميت، فصل اقتران البناء والأسرار، توحيد feature flags نحو alx_api فقط، مطابقة العقود والأنواع مع قاعدة البيانات المسطّحة وعقود alx_api، ثم ترتيب الهيكل والتحقق الشامل.

### التغييرات المنفذة

#### P1 — حذف كود Supabase الميت (بعد التحقق من وجود بديل في alx_api)
- حُذفت: `src/lib/supabase.ts`، `src/lib/legacy-supabase/supabase.ts` (+ المجلد الفارغ)، `src/api/legacy-portal.ts`، `src/lib/financialAccountHelper.ts`، `src/lib/custDetailsHelper.ts`، `src/api/portalAuthCompatibility.ts`، `src/api/portalAuthCompatibility.test.ts`.

#### P2 — فصل اقتران البناء والأسرار
- `package.json`: إزالة الاعتماد `@supabase/supabase-js`.
- `vite.config.ts`: إزالة `supabase` من `manualChunks`.
- `.env`: إزالة كل مفاتيح Supabase؛ الاقتصار على متغيرات alx_api.
- `scripts/check-portal-boundary.mjs`: إعادة كتابة ليشمل الفحص `src/` و`vite.config.ts` معاً + نمط منع أي import لـ supabase.

#### P3 — توحيد feature flags نحو alx_api فقط
- إنشاء `src/api/config.ts` (مصدر وحيد DRY: `portalApiConfig()`).
- `portalGateway.ts` و`portalAuthGateway.ts`: استخدام `portalApiConfig()` بدل دوال الإعداد القديمة.
- `src/env.d.ts`: الإعلان عن 6 متغيرات بيئة مستخدمة فعلياً.
- `.env.example`: تبسيط الأعلام مع تعليق إرشادي عربي.
- `MyOrdersPage.tsx`: إصلاح فرع "طلب جديد" المخفي — الظهور صار مرتبطاً بوجود `portalAuthGateway` فقط بدل علم دقيق غير معرّف.

#### P4 — مطابقة العقود والأنواع مع DB المسطّحة والـ API
- `src/types/portalTypes.ts`: إزالة أنواع ميتة (PortalOrder، PackageType، Announcement، AudienceTarget، PortalAuthState) وتنظيف تعليقات Supabase/JSONB.
- **إصلاح انحراف حقيقي (Supplier stage):** توحيد `SupplierOrderStage` على 3 قيم (`manufacturing` | `in_transit` | `delivered`) لتطابق `alx_api/src/modules/portal/portal-owned.repository.ts:939-943`، وجعل `weightKg`/`cbmVolume` مطلوبين، وإزالة `sourceId` الميت.
- `src/lib/translations.ts`: استبدال 5 مفاتيح stage بـ 3 مطابقة للـ API.
- إزالة casts غير الآمنة (`as SupplierOrder[]` / `as PortalTicket[]`) من `SupplierOrdersPage.tsx` و`SupplierDashboard.tsx` و`SupportTicketsPage.tsx` ليُفرِض المترجم المطابقة.

#### P5 — ترتيب الهيكل وتنظيف الملفات القديمة
- إعادة كتابة `README.md` بترميز UTF-8 صالح (كان تالف/مختلط الترميز) بمحتوى ثنائي اللغة يعكس واقع ما بعد الهجرة.
- أرشفة إلى `docs/archive/`: `implementation_plan.md`، `ui_and_entity_specifications.md`، `PORTAL_DB_SETUP.sql`، `CUST_DETAILS_DB_SETUP.sql`.
- حذف النسخة المكررة `implementation_plan copy.md` (مطابقة بايت-ببايت).
- `.gitignore`: إضافة `tsconfig.tsbuildinfo`.

### التحقق من التوافق مع alx_api
- **تطابق المسارات والأساليب:** كل نقاط اتصال الواجهة (20/20) تطابق مسارات alx_api وأساليبها HTTP تماماً (portal.routes / portal-auth.routes / portal-owned.routes / job-applications.routes) — بما فيها PATCH لـ profile/password/supplier-orders وPUT لـ customer-details.
- **تطابق العقود (DTOs):** تحققت في P4؛ لا انحراف بعد إصلاح Supplier stage.
- **الخادم الحي:** alx_api يعمل على المنفذ 3001 (`/api/v1/health/live` → success). `/api/v1/health/ready` انتهت مهلته → قاعدة البيانات غير متاحة حالياً؛ لذا اختبار الدخان الحي المعتمد على البيانات يتطلب بيئة المالك (قاعدة البيانات من إدارة المالك).
- **بوابات الفحص الآلي (خضراء):** `npm run check` (tsc)=0، `npm run audit:portal-boundary`=نظيف، `npm test`=17/17، `npm run build`=0 (1729 وحدة).

### ملاحظات النطاق
- لا تغييرات على قاعدة البيانات (لا DDL/DML)؛ لذا لم يُمَس `DBdevloping_history.md` ولا `db_commends.md`.
- `alx_web` مستقل ذاتياً: `tsconfig.json` الجذر يستثني `alx_web` و`alx_api` صراحةً (exclude)، ولا ربط كودي مع النظام الرئيسي → لا حاجة لتغييرات في `alx_system`.
- ثغرتا npm عاليتا الخطورة (nanoid، source-map-js) موجودتان مسبقاً في اعتماديات أدوات البناء وليستا مرتبطتين بـ Supabase؛ لم يُنفَّذ `npm audit fix` (خارج النطاق) — مُعلَمتان للمالك.
- `dist/` و`tsconfig.tsbuildinfo` متتبَّعان في git رغم `.gitignore` (حالة سابقة)؛ يوصى بـ `git rm -r --cached dist tsconfig.tsbuildinfo` بموافقة المالك.

## [2026-10-18T00:29:04+03:00] — اختبار الدخان الحي في المتصفح بعد جاهزية قاعدة البيانات — AI Model: Qoder

### السياق
أصبح `alx_api` جاهزاً بالكامل: `/api/v1/health/ready` → `{"status":"ready","checks":{"database":true,"auth":true}}`، و`/api/v1/portal/announcements` أرجع إعلانين حقيقيين بغلاف `{success,data,requestId}` (تأكيد حي إضافي لتطابق عقد `PortalAnnouncementDto`).

### ما تم اختباره (browser-use على `npm run dev` :5174)
- **الصفحة الترحيبية `/`:** عرض كامل — Navbar، Hero، إحصائيات، الخدمات (4)، كيف نعمل (4 خطوات)، حاسبة التكلفة التفاعلية (Slider → 5,000 YER / ~$9)، المميزات، FAQ Accordion، التغطية العالمية (12 دولة)، اتصل بنا، CTA، Footer، ومبدّلا السمة/اللغة. بلا أي خطأ JS.
- **صفحة `/auth/login`:** عرض كامل للحقول (بريد/هاتف + كلمة مرور، required) وزر إظهار كلمة المرور وروابط "نسيت كلمة المرور" و"إنشاء حساب" و"الرئيسية". بلا أخطاء.
- **التكامل الحي:** التطبيق ينادي `http://localhost:3001/api/v1/portal/auth/me` عند الإقلاع؛ الجواب `401` (لا جلسة) عُومل بأمان دون انهيار — وهو السلوك الصحيح. الـ console خالٍ من أي خطأ عدا الـ 401 المتوقع. لا أثر لـ Supabase في Runtime.

### ما لم يُختبر حياً (وبديل التحقق)
- التدفقات المحمية بـ `RequireAuth` (طلبات/كشف حساب/تذاكر/مندوب/مورد) تتطلب بيانات دخول. لم أنفّذ تسجيلاً/دخولاً لتفادي أي كتابة في القاعدة بلا إذن المالك. تحققت منها عوضاً عن ذلك على مستوى: (1) العقود 20/20 مسار+أسلوب+DTO، (2) نجاح بناء كل صفحاتها (chunks في `dist/assets`).

### التنظيف
- أُوقف خادم التطوير (PID 19024 + تابعه) بدقة عبر المنفذ 5174 فقط؛ `alx_api` على :3001 بقي حياً (HTTP 200).

## [2026-10-18T02:06:57+03:00] — إعادة تدقيق نهائي شامل مقابل حالة alx_api الحالية — AI Model: Qoder

### لماذا أُعيد التدقيق
بعد اكتمال P0–P7 ظهر أن `alx_api` تغيّر (تعديلات غير ملتزَمة بها من مراحل qoder 2/3/4 + هجرات 0044–0047 جديدة). أُعيد فحص التوافق كاملاً مقابل هذه الحالة.

### النتائج
- **بوابات alx_web:** tsc=0، vitest 17/17، `audit:portal-boundary` نظيف.
- **خلوّ تام من Supabase:** صفر تبعيات (package.json/lock)، صفر استيراد، صفر متغيرات بيئة، ولا وحدة supabase في بناء `dist`. السطران الوحيدان اللذان يذكران الكلمة هما تعليقان توثيقيان يؤكدان غياب الاعتماد.
- **portal-owned (طلبات/تذاكر/كشف/مندوب/مورد):** لم يُمسّ إطلاقاً → التوافق المؤكد سابقاً (20/20) ما زال صالحاً 100%.
- **portal-auth (تغيّر):** التغييرات كلها داخل الخادم — إضافة `sessionExpiresAt` و`disabled` في استجابة الرمز/الملف، واستخراج حقائق الجهاز عبر `describeRequest`، و`touchSession`/`pruneExpiredSessions`. مسارات/أساليب HTTP لم تتغير. المُتحقق الهيكلي في الواجهة (`isTokenPair`/`isProfile`) يفحص الحقول المتوقعة فقط ولا يرفض الحقول الإضافية → **لا انكسار توافق**. كما أن كود الخادم دفاعي: `portalSessionsCarryDevice()` يستعلم information_schema ويضمّن أعمدة الجهاز فقط إن وُجدت، فتسجيل الدخول يعمل حتى قبل تطبيق الهجرة 0047.
- **النظام الرئيسي:** `alx_web` مستقل — tsconfig الجذر يستثنيه و`src/` الجذر لا يستورد منه. ملفات supabase في `src/` الجذر تخص مبادرة إزالة منفصلة للنظام الرئيسي (خطة المالك، خارج نطاق مهمة الموقع).

### ملاحظات للمالك (ليست فجوات في الموقع)
- تطبيق الهجرة 0047 (`portal_session_device_facts_and_delete`) يفعّل مزايا حقائق الجهاز والحذف الفعلي للجلسات؛ الكود دفاعي فلن ينكسر تسجيل الدخول قبل تطبيقها.
- ملفات مؤقتة في جذر `alx_api` (`tmp-portal-session-check.ts`, `tmp-session-check.ts`, `tmp-entity-check.ts`, `tmp-order-check.ts`, `tmp-order-schema.ts`, `tmp-sweep-check.ts`) بقيت دون تنظيف — يُنصح بحذفها.
- استعلام Supabase (قراءة فقط) لمعرفة حالة الهجرات حُظر من مصنِّف الأذونات؛ اكتُفي بالفحوص الداخلية وقراءة كود `alx_api`.

### الاستعداد للتطوير
الموقع نظيف ومتوافق وجاهز للتطوير. فرصة تحسين اختيارية: تبنّي `sessionExpiresAt` في الواجهة لإدارة انتهاء الجلسة بالخمول (تجديد استباقي) — تحسين وليس فجوة.

## [2026-10-18 03:27 +03:00] — بوابة العميل: خطة v2 + أول إصلاح أمني — AI Model: Qoder
- أعدنا كتابة `MyOrdersPage` مبدئيًا؟ لا — هذه الجولة: تجميد الخطة v2 وتنفيذ أنظف إصلاح أمني معزول.
- **الإصلاح (alx_api):** في `src/modules/portal/portal-owned.repository.ts` أُزيل `companyProfitSAR` (عمود `profit_company_sar`) من `customerOrderFieldColumns` ومن `customerOrderNumericFields`، وأُزيل `shippingCostSAR` من الإسقاط. الدالة `toOrder()` (سطر 166) تبني كل استجابة عميل من هذا الإسقاط، فالقرار يُخفي ربح الشركة وتكلفة الشحن الداخلية عن القائمة وعن الاستجابة بعد الإنشاء معًا. المحرّك الخادمي `portal-order-pricing.ts` ما زال يحسبها ويزرعها في العمود داخليًا — بلا تغيير.
- **التحقق:** `tsc --noEmit` نظيف؛ `jest portal` = 9 suites / 37 tests خضراء.
- **المخطّط المؤكَّد:** `products` فيها `length/width/height/cbm/weight` (الكيان الرئيسي)، و`order_items` ليس فيها أبعاد (فقط `total__weight`/`total_cbm`)؛ لذا الأبعاد تبقى في نموذج المنتجات وتُشتق للسطر. طلب التوظيف مكتمل في الخلفية على جدول `public.jobs_req`.
- **المتبقّي (P1..P7):** نقل الحساب إلى endpoint `quote` آمن + إزالة ثوابت العملات + البنك-فقط مرتبطة بإعادة تصميم DTO/الواجهة (P1/P3) لأن فصلها الآن يكسر الصفحة الحالية.

## [2026-10-18 04:16 +03:00] — قراءات بوابة العميل: السلة والشحنات والتتبّع — AI Model: Qoder
- **alx_api:** أضيفت إلى `portal-owned.contracts.ts` أنواع `PortalCartItemDto`/`PortalShipmentDto` وطرق المستودع المناظِرة. في `portal-owned.repository.ts`: `listCustomerCart` (من `returned_products` بشرط `customer_id=$1`)، و`listCustomerShipments`+`getCustomerShipmentByTracking` (من `shipments s JOIN orders o` بنفس شرط ملكية الطلب `o.customer_id=$1 OR (o.order_party_type='customer' AND o.order_party_id=$1)`). أُضيف مُحوِّل مشترك `toShipment()` يحذف الفارغ (exactOptionalPropertyTypes) ولا يمسّ `shipping_cost`/`courier_id`/`shipping_company_id`. في `portal-owned.service.ts`: طريقة خاصة `customerScope()` موحَّدة + ثلاث خدمات. في `portal-owned.routes.ts`: `GET /portal/cart`، `GET /portal/shipments`، `GET /portal/tracking/:trackingNumber` (404 بـ `PORTAL_TRACKING_NOT_FOUND` عند عدم المطابقة — بلا تسريب لوجود شحنة لغير العميل).
- **alx_web:** في `portalAuthGateway.ts` أُضيفت الأنواع `PortalCartItemDto`/`PortalShipmentDto`، الواجهات `listCustomerCart`/`listCustomerShipments`/`getTrackingByNumber`، محقّقاتها عبر `authenticatedRequest`، والمدقّقات `isPortalCartItem`/`isPortalShipment`. `getTrackingByNumber` يلتهم `PORTAL_TRACKING_NOT_FOUND` ويُرجع `null`.
- **التحقق:** alx_api `jest portal` = 10 suites / 43 tests خضراء؛ `tsc --noEmit` نظيف. alx_web `vitest src/api` = 3 files / 14 tests خضراء؛ `tsc` نظيف.
- **عائق D4:** فحص read-only أكّد وجود `public.currency`/`cur_price` (العملات) لكن لا جدول `banks` في المخطط ولا الـmigrations. قرار مصدر «قائمة البنوك» في خطوة الدفع متروك للمالك.

## [2026-10-18 04:41 +03:00] — إغلاق قرارَي D4/D2 + قراءة البنوك — AI Model: Qoder
- **قرار المالك:** (D4) البنوك = `public.accounts` حيث `account_code LIKE '112%'` و`is_active=true`؛ لا جدول مستقل. (D2) العملات من `public.currency` (المخدَّم أصلًا `GET /api/v1/currencies`: `code`/`symbol`/`isDefault`/`isActive`) عبر عملة حساب العميل، لا أسماء ثابتة.
- **alx_api:** `PortalBankDto` + `listBanks()` في العقد/المستودع (استعلام `SELECT account_id, account_code, name FROM accounts WHERE is_active AND account_code LIKE '112%'` — بلا `balance`/`entity_id`/`cur_no`) /الخدمة/المسار `GET /api/v1/portal/banks`.
- **alx_web:** `PortalBankDto` + `listBanks()` + `isPortalBank` في `portalAuthGateway.ts`.
- **التحقق:** alx_api `jest portal-owned.products` = 7/7 + `tsc` نظيف؛ alx_web `vitest src/api` = 14 + `tsc` نظيف.
- **الخطوة التالية:** `quote` + الماليات كقطعة عملة-محايدة واحدة (تعتمد حلّ عملة الحساب من `public.currency`)؛ P2 (الهيكل) غير محجوز.

## [2026-10-18 23:01 +03:00] — P1b كتابة مملوكة: حذف/تعديل الطلب المعلّق (D7) — AI Model: Qoder
- **العقد:** `deleteCustomerOrder` يعيد `'deleted'|'not-found'|'not-editable'`؛ `updateCustomerOrder(fields)` يُرجع `PortalOrderDto` ويرمي سلاسل `PORTAL_ORDER_NOT_FOUND`/`PORTAL_ORDER_NOT_EDITABLE` يلتهمها الـservice إلى 404/409 (نمط `saveCustomerDetails`). `PortalCustomerOrderUpdateFields` = خمسة حقول تواصل اختيارية.
- **alx_api:** في `portal-owned.repository.ts` طريقتان داخل `withTransaction`: حارس `SELECT (... 'طلب معلق' OR order_status_id=1) FOR UPDATE OF o` بشرط ملكية الطلب، ثم DELETE عبر RPC `delete_orders_with_dependents($1::text[])` أو UPDATE بأعمدة مبيّنة ثابتة + `updated_at=now()` ثم قراءة العائد عبر `customerOrderSelect`+`loadOrderItems`+`toOrder`. ممرّح `orders/:orderId` DELETE (404/409/200) وPATCH (schema `portalOrderUpdateSchema` صارم، ≥1 حقل).
- **alx_web:** `deleteCustomerOrder`/`updateCustomerOrder` + نوع الحقول في `portalAuthGateway.ts`؛ الأكواد الثابتة تُرمى للمنتدأ لعرضها.
- **التحقق:** alx_api 12 suites / 51 tests + tsc نظيف؛ alx_web 17 tests + tsc نظيف. الاختبارات تؤكد: لا `order_status*|total_cost|profit_company|shipping_cost|order_currency_code|exchange_rate` في عبارة SET.

## [2026-10-18 20:41 +03:00] — P1b عرض السعر + الماليات المملوكة + تحييد D2 — AI Model: Qoder
- **alx_api/contracts:** أنواع `PortalCurrencyDto`، `PortalOrderQuoteDto` (payableAmount+currency+totalWeight+totalCBM)، `PortalCustomerBalanceDto`، `PortalCustomerFinanceStatsDto`. توسيع `PortalPaymentRequestDto.currency` و`createPaymentRequest.currency` إلى `string` (إزالة اتحاد الأحرف). واجهة المستودع: `getPortalDisplayCurrency/getSupportedCurrencyCodes/getCustomerBalance/getCustomerFinanceStats`.
- **alx_api/repository:** `getPortalDisplayCurrency` و`getSupportedCurrencyCodes` يقرآن من `public.currency` (is_default/is_active) بلا حرفية. `getCustomerBalance` يقرأ `accounts.balance`+عملة الحساب مع رمز محلّول من public.currency، مقيّد بـ`account_id=$1`، يعيد null عند الغياب. `getCustomerFinanceStats` يجمّع `orders` مقيّدة بشرط الملكية (`customer_id=$1 OR order_party_type='customer' AND order_party_id=$1`) بالحالة ومدفوع/متبقٍّ (أرقام عبر Number). `toPaymentRequest` يمرّر الرمز المخزَّن دون `==='USD'||'SAR'` حرفي.
- **alx_api/service:** `quoteCustomerOrder` (فحص دور عميل + مصدر فعّال + نفس `calculatePortalOrderPricing`، يُرجع المستحق `totalCostYER` فقط مع عملة من public.currency). `getCustomerBalance` (دور+رابط مالي، 409 عند غيابه). `getCustomerFinanceStats` (customerScope). `createPaymentRequest` يتحقّق من العملة ضد `getSupportedCurrencyCodes` وإلا 400 `UNSUPPORTED_CURRENCY`. تعليق توضيحي أن `orderData.currency:'SAR'`=أساس تسعير عمود وليس حرفية عرض.
- **alx_api/schemas:** `portalPaymentRequestCreateSchema.currency` من `z.enum(['YER','USD','SAR'])` إلى `z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/)` (التحقق الفعلي بالجدول في الخدمة).
- **alx_api/routes:** `POST /portal/orders/quote` (POST ثابت بلا idempotency) + `GET /portal/finance/balance` + `GET /portal/finance/stats` خلف `authenticate`.
- **alx_web:** `portalAuthGateway.ts`: الأنواع الجديدة + `quoteCustomerOrder/getCustomerBalance/getCustomerFinanceStats` ومحقّقات `isPortalCurrency/isPortalOrderQuote/isPortalCustomerBalance/isPortalCustomerFinanceStats`؛ `isPortalPaymentRequest` صار يقبل `/^[A-Z]{3}$/`. توسيع `PortalPaymentRequestDto.currency` إلى string.
- **الاختبارات:** `tests/portal-owned.quote.test.ts` (4) و`tests/portal-owned.finance.test.ts` (5) — assert: لا تسريب profit/shipping/totalCostSAR/exchangeRate في quote، payable==totalCostYER، تقيّد balance/stats بالمعرّف، رفض عملة غير مدعومة قبل الإنشاء.
- **التحقق:** alx_api `jest` كامل = 49 suites / 427 tests أخضر + tsc نظيف؛ alx_web tsc نظيف. لا DDL ولا SQL فعلي أثناء التطوير.

## [2026-10-18 20:51 +03:00] — P2 الهيكل والتنقّل (بوابة العميل) — AI Model: Qoder
- **CustomerLayout.tsx:** استبدال `navItems` من 7 إلى 10 أقسام وفق §3؛ الأيقونات من lucide (`Truck/ShoppingCart/Wallet/Gift/Briefcase`)؛ فصل «الطلبات» كقسم واحد (تبويباته في P3)، ونقل «الكشف» تحت «المالية» وإخفاء «طلب جديد» من الشريط (يبقى عبر زر داخل القائمة). المسارات القديمة `new-order/ledger` تبقى موصولة.
- **App.tsx:** استيراد كسول `PortalPlaceholderPage`؛ مسارات جديدة `tracking/cart/finance/gifts/office` (placeholder) و`support` (يعرض `SupportTicketsPage`)؛ `tickets` → `Navigate` إلى `support` للحفاظ على الروابط القديمة. `orders/new-order` يظلّان على `MyOrdersPage` حتى P3.
- **pages/customer/PortalPlaceholderPage.tsx:** مكوّن placeholder قابل لإعادة الاستخدام (`titleKey` + `hintKey` اختياري) — يخدم الأقسام الهيكلية (الهدايا/مكتبني دائم) والمؤقتة (تتبع/سلة/مالية قبل P4/P5). يفصل المنطق عن الواجهة ولا يستدعي أي API.
- **lib/translations.ts:** مفاتيح تنقّل عربية/إنجليزية جديدة (orders/tracking/cart/finance/gifts/office/shipments/myProducts/placeholderComingSoon) — `TKey = keyof typeof t` يغطّيها تلقائيًا.
- **التحقق:** alx_web `tsc --noEmit` نظيف؛ `vitest` = 4 suites / 17 tests أخضر. لا تغيير في `alx_api` ولا DDL.

## [2026-10-19 00:13 +03:00] — P3: وحدة الطلبات (بوابة العميل) — نقل التسعير إلى الخادم + D7 — AI Model: Qoder
- **MyOrdersPage.tsx (§2.2 أمني حرج):** أُزيل محرّك الحسابات من المتصفح بالكامل. حُذفت `calcs` useMemo و`dbSettings` (معدّلات ربح/صرف/شحن ثابتة) وحالة `amountPaidYER` و`genOrderNumber` وكائن `payload` الميت. الاستبدال: useEffect مؤجَّل (debounce 350ms) يستدعي `portalAuthGateway.quoteCustomerOrder(input)` ويعيد `quote` (DTO فيه فقط `payableAmount` + `currency.{code,symbol}` + وزن/حجم). لوحة المراجعة صارت تعرض الإجمالي التقديري للدفعة فقط مع ملاحظة أن التسعير صادر من الخادم وأن لا دفعة تُسجَّل هنا.
- **List/Details (D2):** أزيلت literals العملة الثابتة (SAR/YER) من الأعمدة والتفاصيل وعُرضت قيم يُرجعها الخادم بأرقام محايدة؛ حُذف حساب `quantity*price` من المتصفح؛ أُزيلت شارات التسعير الثابتة على أنواع التغليف (`+3/+15/+30 SAR`) وشارة `+25 SAR` للمستعجل.
- **D7 تعديل/حذف:** مُنح العميل تعديلًا/حذفًا لطلباته المعلَّقة فقط. دوال `isPending`/`openEdit`/`handleSaveEdit`/`handleDelete` + نافذة تعديل بالحقول التواصلية (`recipientName/recipientPhone/recipientAddress/deliveryCity`) عبر `updateCustomerOrder` (PATCH) و`deleteCustomerOrder` (DELETE). المنطق التجاري (الملكية + حالة `معلق` + رفض الحالة/المبالغ/الأصناف) مفروض في `alx_api` وليس بالواجهة.
- **Imports:** أُضيفت أنواع `PortalOrderQuoteDto`/`PortalOrderCreateInput`/`PortalCustomerOrderUpdateFields` وأيقونتا `Pencil`/`Save`؛ أُزيل `CreditCard` غير المستخدم.
- **التحقق:** `tsc --noEmit` نظيف، `vite build` ناجح، `vitest` = 4/17 أخضر، فحص أمني على `dist/assets/*.js` = صفر مطابقة لتسريبات التسعير. لا DDL ولا تغيير مخطط.

## [2026-10-19 00:17 +03:00] — P4: تتبع + سلة (بوابة العميل) — AI Model: Qoder
- **pages/customer/TrackingPage.tsx (جديد):** نموذج بحث برقم التتبع يستدعي `portalAuthGateway.getTrackingByNumber` (الحارس/الملكية في `alx_api`). يعرض بطاقة النتيجة (تتبع/طلب/نوع شحن/مصدر/وجهة/قطع/وزن) وخطاً زمنياً لوجستياً بسيطاً. DTO `PortalShipmentDto` لا يحمل تكلفة شحن داخلية ولا معرّف ناقل، فلا تسريب. حالات: فارغ/تحميل/لا نتيجة/خطأ.
- **pages/customer/CartPage.tsx (جديد):** قائمة قراءة فقط عبر `portalAuthGateway.listCustomerCart` لمرتجعات/سلة العميل. يعرض الاسم والكمية ورقم الطلب وحالة المرتجع والتاريخ فقط — لا أسعار ولا تكاليف ولا معرّفات داخلية. `PortalCartItemDto` مصمّم مسبقاً بلا مبلغ.
- **App.tsx:** استيراد كسول لـ `TrackingPage`/`CartPage` واستبدال مسارَي `tracking`/`cart` من placeholder إلى الصفحتين الحقيقيتين؛ `finance` يبقى placeholder لحين P5.
- **التحقق:** `tsc --noEmit` نظيف، `vite build` ناجح، `vitest` = 4/17 أخضر، فحص أمني على `dist/assets/*.js` = صفر مطابقة. إصلاح مسار استيراد نسبي (من `../../` بدل `../../../`) لملفات مستوى `pages/customer`. لا DDL.

## [2026-10-19 00:20 +03:00] — P5: المالية (بوابة العميل) — AI Model: Qoder
- **ملاحظة نطاق:** كل نقاط API المالية المطلوبة موجودة مسبقاً في `alx_api`/gateway (`/finance/balance`، `/finance/stats`، `/ledger`، `/banks`، `/payment-requests` GET+POST). لا حاجة لنقطتي `account/statement`؛ لم تُضف أي نقطة خلفية جديدة ولا DDL.
- **pages/customer/finance/useCustomerFinance.ts (جديد):** خطاف حالة يجلب الرصيد والإحصاءات وطلبات الدفع والدفتر عبر `Promise.allSettled` مع حارس `portalAuthGateway` null. يفصل منطق البيانات عن العرض (قاعدة المشروع). كل الأرقام خادمية مقيّدة بالملكية؛ المتصفح لا يحسب شيئاً.
- **pages/customer/finance/PaymentRequestForm.tsx (جديد):** نموذج طلب دفع (D9): مبلغ/طريقة (transfer/cash/wallet/check)/مرجع/ملاحظات، العملة الافتراضية من `balance.currency.code` الخادمي. عند اختيار التحويل يُحمَّل `listBanks` (D4: رمز+اسم فقط، لا رصيد/كيان) كمرجع قراءة فقط. `onSubmitted` يعيد التحميل؛ الاعتماد والتحصيل وظيفتا موظفين.
- **pages/customer/finance/FinancePage.tsx (جديد):** تبويبان — «نظرة مالية» (بطاقات رصيد/مدفوع/متبقٍّ/إجمالي الطلبات + سجل الطلبات بشارات حالة) و«الدفتر» (جدول قيود). لا يُعرض `accountId` ولا أي معرّف داخلي؛ يظهر فقط رقم القيد/النوع/البيان/المبلغ/التاريخ.
- **App.tsx:** استيراد كسول `FinancePage` واستبدال placeholder لمسار `finance`؛ `gifts/office` يبقيان placeholder دائم.
- **التحقق:** `tsc --noEmit` نظيف، `vite build` ناجح، `vitest` = 4/17 أخضر، فحص أمني = صفر تسريب تسعير (مطابقة `accountId` هي حقل تحقق نوعي لدفتر العميل نفسه وغير معروض). لا DDL.

## [2026-10-19 00:48 +03:00] — P6: الدعم (job_req) + لوحة التحكم + كشف حساب مخصص (D3) — AI Model: Qoder
- **دعم التوظيف — خلفية (`alx_api`):** أضيفت ميزات `jobs_req` كاملة (عقود `PortalJobRequestDto`/`CreatePortalJobRequestRecord`، سكيما `portalJobRequestCreateSchema`، مستودع `listJobRequests`/`createJobRequest` مع مُصيّر `toJobRequest`، خدمة بمعرّف `job_<uuid>` وزمن `now()`، ومسارات `GET/POST /api/v1/portal/job-requests`). المِلكية عبر `created_by = portalUserId`؛ لا قراءة لطلبات الآخرين. الجدول `public.jobs_req` موجود — لا إنشاء جدول ولا DDL (D5)؛ تحقق الأعمدة تم بقراءة فقط قبل الكتابة.
- **دعم التوظيف — أمامية (`alx_web`):** `customer/support/JobRequestSection.tsx` (قائمة + نموذج إنشاء مطبّعة ببيانات العميل من `usePortalAuth`) و`customer/support/CustomerSupportPage.tsx` (تبويبا التذاكر المت_shared والوظائف)؛ ربط مسار `support` بالصفحة.
- **لوحة التحكم (§4.1) — إعادة بناء كاملة `CustomerDashboard.tsx`:** استُبدل الاعتماد على `user.financialBalance` بحساب خادمي عبر `Promise.allSettled([listCustomerOrders, getCustomerBalance, listCustomerLedger, listAnnouncements])`. البطاقات: إجمالي/قيد المعالجة/مُسلَّمة + الرصيد بعملة محلولة من `balance.currency.symbol` (بلا «YER» ثابت D2). الجداول: آخر 5 طلبات (المستحق بالعملة المحلولة، بلا حرف نصي لعملة)، آخر الحركات (من الدفتر المقيّد ملكياً)، والإعلانات. لا يُعرض أي ربح/تكلفة/معدّل/حساب داخلي؛ أُزيلت حقول «المتبقي» القديمة بحرف YER وعُرضت «المستحق» فقط.
- **بوابة إعلانات (`portalAuthGateway.ts`):** `PortalAnnouncementDto` + `listAnnouncements()` عبر `this.request` العام ( endpoint `GET /api/v1/portal/announcements` بلا PII)، حارس `isPortalAnnouncement`، وتدهور آمن إلى `[]` عند فشل التحقق.
- **كشف حساب مخصص (D3) — خلفية:** نقطة `GET /api/v1/portal/finance/statement?from&to&type` (عقود `PortalStatementEntryDto`/`PortalCustomerStatementDto` + `statementQuerySchema` ممتد من `pageQuerySchema`، مستودع `getCustomerStatement` يستعلم `account_trans⋈main_entry` بـ `posting_status='posted'` و`account_id`=الحساب المالي للعميل فقط، مع شروط فترة/نوع كمعاملات مرقّمة عبر `to_timestamp($n/1000.0)`؛ خدمة `getCustomerStatement` تفرض دور العميل و`requireEntityLink(financialAccountId)`). لا يُسرَّب `accountId` ولا `currency_original_no`.
- **كشف حساب مخصص (D3) — أمامية:** `portalAuthGateway.getCustomerStatement(query)` (يبني querystring بأمان + حارس `isPortalStatement`)، `finance/useCustomerStatement.ts` (منطق جلب معزول عن UI)، `finance/StatementSection.tsx` (فلاتر من/إلى/نوع — قائمة Credit/Debit من قيم DB الفعلية — وزر طباعة `window.print`)، وتبويب ثالث «كشف حساب» في `FinancePage`.
- **التحقق:** alx_web `tsc --noEmit` نظيف، `vite build` ناجح، `vitest` = 4 suites/17 tests أخضر، فحص أمني على `dist/assets/*.js` = صفر مطابقة. alx_api `tsc --noEmit` نظيف، `jest` = 49 suites/427 tests أخضر. فحص قراءة-only للـ statement أكّد تنفيذ SQL وصحة `trans_type`. لا DDL.

## [2026-10-19 00:58 +03:00] — P7: التحقق الشامل + تدقيق أمني وإصلاح تسريبات متبقية — AI Model: Qoder
- **تدقيق أمني على الحزمة (`dist/assets/*.js`):** كشف مسحٌ شامل لتسميات التسعير تسريبين متبقيين داخل نطاق بوابة العميل:
  - **LandingPage (عام):** مُقدِّر شحن يحسب في المتصفح بأسعار داخلية ثابتة (base 4000، 1000/كغ، 18 SAR/كغ + 25، 450 SAR/CBM، صرف SAR 390، FX 535) ويعرض `YER`/`USD`. هذا يُسرّب نموذج تسعير الشركة (معدّلات — §0) وأسماء عملات (D2) لأي زائر يقرأ JS الملفوف. **الإصلاح:** حُذف الـ`useMemo` للحساب بالكامل وحُذفت بطاقة السعر الرقمية؛ استُبدلت برسالة محايدة «السعر الدقيق يُصدر من الخادم بعد الدخول وإنشاء الطلب». أُلغيت بذلك كل الأسعار/المعدّلات/العملات الثابتة من الحزمة العامة.
  - **CustomerLedgerPage (مسار `/portal/customer/ledger`):** عملات ثابتة YER/USD/SAR + حساب `debit/credit/runningBalance` في المتصفح + منتقي عملة ونموذج دفع ذاتي — انتهك §0 (حسابات/ترحيل بيد العميل) و§4.5 (❌ لا ترحيل من البوابة) وD2. **الإصلاح:** أُتقاعد المسار ليطابق البوابة الجديدة: `ledger` صار يوجّه إلى `FinancePage` (تبويبات النظرة/الدفتر/الكشف، كل الأرقام خادمية مقيّدة ملكياً)، وحُذف الاستيراد الكسول `CustomerLedgerPage` فلم يُبنَ الـchunk الخاص به (تأكّد: اختفى من `dist`). الملف أُبقي على القرص دون ربط (قابل للاسترجاع) بدل حذفه.
- **تحقّق سلبي (الحزمة بعد الإصلاح):** `deliveryCourierFee`/`exchangeRate`/`totalCostSAR`/`companyProfit` = صفر مطابقة. `YER` الوحيد المتبقي في `MyOrdersPage` هو جزء من اسم مفتاح خاصية البيانات (`totalCostYER`/`totalOrderYER`) للمستحق المملوك للعميل نفسه — ليس نص عملة معروضاً ولا سرّاً. الباقي من YER/SAR/USD محصور في صفحات المندوب/المورد وهي خارج نطاق إعادة هيكلة بوابة العميل (§ courier/supplier خارج النطاق).
- **دخان حي (`alx_api`):** شُغِّل خادم نظيف على منفذ 3099 (لتجنّب خادم مطوّر قائم على 3001). النتائج: `GET /api/v1/portal/announcements` = 200 (عام، بلا PII/ملكية)؛ `GET /api/v1/portal/finance/statement` = 401 `PORTAL_AUTH_REQUIRED` (المسار مُسجَّل والحماية مفروضة)؛ `GET /api/v1/portal/job-requests` = 401. أوقفنا خادم الدخان بعد الاختبار دون المساس بعملية المطوّر.
- **التحقق النهائي:** alx_api `tsc --noEmit` نظيف + `jest` = 49/427 أخضر؛ alx_web `tsc --noEmit` نظيف + `vite build` ناجح + `vitest` = 4/17 أخضر + فحص أمني على `dist/assets/*.js` = صفر تسريب عملة/تكلفة/ربح/معدّل داخل نطاق العميل. لا DDL ولا إنشاء جداول.
- **خلاصة النطاق:** P0→P7 مكتملة: لوحة تحكم مطابقة §4.1، وحدة طلبات بخدمة تسعير خادمي + D7، تتبع + سلة، مالية كاملة مع كشف مخصص D3 وطلب سداد D9، ودعم بتوظيف `job_req`. المبدأ الحاكم محقّق: «العميل يرى ما يخصّه فقط؛ لا أسرار ولا إجراءات سرية بيد العميل».

## [2026-10-19 01:19 +03:00] — §5: معالج إنشاء الطلب (CreateOrderWizard) — استبدال نموذج الصفحة الواحدة — AI Model: Qoder
- **سياق الفجوة:** عند إعادة تدقيق الخطة §5 تبيّن أن إنشاء الطلب لم يكن معالج خطوات، بل نموذج صفحة واحدة مدمج داخل `MyOrdersPage.tsx` (تبويب `create`). كذلك: قائمة «مصدر الشراء» كانت بحالة `sources=[]` لا تُحمَّل إطلاقًا من `GET /portal/sources` (قائمة ميتة)، وخطوة الدفع عرضت `Cash/Transfer/Wallet` بدل «البنك فقط» المطلوب في §5/D4، ولا زر «اختيار منتج سابق». كل هذا يخالف §5 (يُستبدل النموذج ذو الصفحة الواحدة بمعالج) و§6 (endpoints 1/9/10/11).
- **الحل أماميًا (ملف جديد):** `pages/customer/orders/CreateOrderWizard.tsx` — معالج بأربع خطوات مرئية مع شريط تقدّم (Stepper) وأزرار رجوع/التالي/إرسال وتحقق لكل خطوة:
  - **① المصدر:** بطاقة صاحب الطلب للقراءة فقط (لا اختيار عميل — مرتبط تلقائيًا) + تحميل حيّ للمصادر عبر `portalAuthGateway.listOrderSources()` (`GET /portal/sources`) + رقم الفاتورة/السلة/التتبع/كود السلة (اختياري).
  - **② المنتجات:** شبكة أصناف مع `length/width/height` وCBM محسوب محليًا للعرض فقط (D1) + زر «اختيار منتج سابق» يستدعي `listCustomerPreviousProducts()` (`GET /portal/orders/previous-products` — منتجات هذا العميل فقط) + التغليف/الاستعجال/الملاحظات.
  - **③ الدفع (البنك فقط — D4/D9):** قائمة بنوك مرجعية عبر `listBanks()` (`GET /portal/banks`) تعرض `اسم + رمز الحساب` فقط (بلا رصيد/كيان) + المستحق التقديري من `quoteCustomerOrder()` (`POST /portal/orders/quote`) بعملة محايدة تُقرأ من `quote.currency.symbol` (D2) + تنويه أن التسوية تتم عبر طلب سداد من الموظف. **حُذف** خيارا النقدي/المحفظة نهائيًا.
  - **④ المراجعة:** ملخص (مصدر، عدد أصناف، تغليف، أولوية، دفع بنكي، بنك، مستحق تقديري) ثم إرسال عبر `createCustomerOrder()` بـ `paymentMethod='Transfer'`؛ لا «اعتماد مباشر» ولا ترحيل مالي — الطلب يُنشأ «معلّقًا».
- **خطوة مخفية (§5):** لا خطوة للمناديب/الشحن إطلاقًا؛ لا معرّف ناقل ولا تكلفة شحن داخل الحزمة.
- **أمان (§0):** لا حساب تسعيري في المتصفح؛ صفر `profit/cost/rate/exchange/internal boxes`؛ العملة ديناميكية من الخادم. فحص سلبي على `CreateOrderWizard.tsx`: لا `YER/SAR/USD` ولا تكلفة/ربح/معدّل في الشيفرة.
- **تنظيف `MyOrdersPage.tsx`:** استُبدلت كتلة `activeTab==='create'` الكاملة بـ `<CreateOrderWizard onCreated={...}/>`، وحُذف منطق الإنشاء الميت (حالات items/sources/quote/paymentMethod/... و`handleItemChange/handleSelectSource/handleSubmit` وeffect التسعير و`customerStats`)؛ احتفظت الصفحة بالقائمة والتفاصيل وتعديل D7 والتتبع فقط. لا كود ميت متبقٍّ.
- **التحقق:** alx_web `tsc --noEmit` نظيف + `vite build` ناجح (الـchunk `MyOrdersPage` يبني مع المعالج). لم تُجرَ تجربة نقر متصفح تفاعلية (تتطلب جلسة عميل مُصادَقة)؛ صوابية العقود مؤكَّدة سلفًا على `alx_api` (sources/banks/previous-products/quote مسجَّلة ومحمية بالجلسة). لا DDL ولا استدعاء Supabase.

## [2026-10-19 02:23 +03:00] — إعادة هيكلة بوابة العميل: منافذ منبثقة تطابق نماذج النظام — AI Model: Qoder
- **الدافع (تراجع عن §5):** رفض المالك معالجَ الإنشاء كتبويبة وتصميمَ النموذج المُبسَّط؛ المطلوب واجهة منبثقة تنسخ تصميم/خطوات نموذج النظام مع إخفاء الحقول السرّية فقط، والسماح بالدفع داخل النموذج، وإضافة إنشاء شحنة + بحث/فلترة/فرز.
- **المرجع في النظام (مخطَّط مسبقًا):** `src/components/orders/CreateOrderModal.tsx` (5 خطوات: العميل/المصدر، السلة، الشحن/المناديب، المالية/الدفع، الخلاصة)، `src/components/shipments/ShipmentFormModal.tsx`، `src/components/orders/PaymentModal.tsx` («تحصيل دفعة مالية وسند قبض الطلب» — به حقل PIN وخيارات Cash/Bank/Mixed/Deferred). حُذفت السرّيات في نسخ العميل.
- **الطلب:** `orders/CreateOrderModal.tsx` — stepper على نمط النظام (دوائر مرقّمة + Previous/Next/Save) بلغة البوابة (glass-card/modal-box/form-*/btn-*). خطوة 1: بطاقة عميل مرتبطة تلقائيًا + اختيار مصدر حيّ. خطوة 2: جدول منتجات + منتَج سابق مقيّد بالملكية + كوبون ظاهر + عمولة بنك مخفية. خطوة الشحن/المناديب مخفية. خطوة الدفع: وسيلة واحدة «عبر بنك» معتمدة تلقائيًا + مبلغ/مرجع (الدفع مسموح). خطوة الخلاصة. الإرسال عبر `createCustomerOrder` بـ`paymentMethod='Transfer'`؛ كوبون/بنك/مرجع/تتبع داخل `notes` (لا عمود مستقل دون DDL).
- **الشحنات:** `orders/CreateShipmentModal.tsx` بثلاث خطوات؛ حُذفت (طلب مرتبط/شركة/مندوب/حالة/تكلفة). يُحفظ عبر `createCustomerOrder` (بند واحد بالتتبع، تفاصيل الشحنة في notes) بلا نقطة نهاية جديدة. `ShipmentsListPage` أضاف زر الإنشاء + بحث + فلترة حالة + فرز أعمدة محلي.
- **المالية:** `FinancePage` دمج overview+ledger في تبويب `summary`؛ نموذج الدفع صار منبثقًا فقط بزر «طلب دفع جديد». `finance/CustomerPaymentModal.tsx` يطابق سند القبض مع حذف PIN وحذف خيارات الوسيلة (بنك فقط) → `createPaymentRequest('transfer')`. حُذف `PaymentRequestForm`.
- **هيكل لاحق:** `gifts/GiftsPage`, `office/OfficePage` (تبويبات فارغة مؤهولة). `App.tsx`: حُذف `new-order`، وُجّه `gifts`/`office`. حُذفت الملفات المرفوضة (`CreateOrderWizard`, `NewOrderPage`, `PaymentRequestForm`).
- **التحقق:** `tsc -b` نظيف + `vite build` ناجح + `vitest 17/17` + `audit:portal-boundary` نظيف + فحص سلبي على `dist/assets/*.js` = صفر `companyProfit/totalCostSAR/deliveryCourierFee/exchangeRate/profitPerKg/cbmShippingRate/sheinRedPrice`. لا DDL. لم تُجرَ نقرة متصفح حيّة (تتطلب جلسة عميل مُصادَقة). لا commit.

## [2026-10-19 04:06 +03:00] — النسخ المطابقة لنماذج النظام: الشحنة والمالية والأصدقاء وحاسبة مشتركة — AI Model: Qoder Agent

**الدافع:** إتمام تعليمات المالك: «احذف نموذج إنشاء الطلب الحالي وأنشئ نسخةً من نموذج النظام بعملياته وتفاصيله مع تغييرات الخطوات المحدّدة»، وربطُ نموذجي الطلب والشحنة ببيانات DB حقيقية عبر API، وتطويرُ قسم الدفع، وإضافةُ حقلي العملة والحاسبة لنموذج الدفع المالي، وإنشاءُ قسم «الأصدقاء» بهيكل أولي.

**الحاسبة والمصارفة المشتركة (#27) — ملف جديد:** [alx_web/src/pages/customer/shared/PortalCalculatorModal.tsx](alx_web/src/pages/customer/shared/PortalCalculatorModal.tsx): نافذةُ تبويبين (حاسبة + تحويل عملات) على نمط البوابة (modal-backdrop/modal-box/section-card/form-*/btn-*). تُحمّل العملات من `portalAuthGateway.listCurrencies()` وتُنسّب نسبة الصرف (الأساس=1، والباقي آخر `cur_price`)؛ التحويل `amount × rateFrom ÷ rateTo` محسوبٌ من أسعار الخادم لا من معدلٍ ثابت. محرّك حاسبة بالأرقام/العمليات/لوحة المفاتيح. استُخدمت أيقونات lucide المستخدمة فقط (Calculator/ArrowRightLeft/X/Copy/Check/Loader2). أدوات CSS مشاركة أُضيفت لـ [alx_web/src/styles/global.css](alx_web/src/styles/global.css): `.animate-spin` و`.mono` و`.finance-line`.

**مالية الدفع (#27):** [alx_web/src/pages/customer/finance/CustomerPaymentModal.tsx](alx_web/src/pages/customer/finance/CustomerPaymentModal.tsx): أُضيفت حالةُ `currencies` + `selectedCurrency` (الافتراضي: العملة الأساسية ثم الأولى) و`calcOpen`؛ effectٌ يحمّل `listCurrencies()`؛ ترويسةٌ فيها زر «الحاسبة والمصارفة» يفتح `PortalCalculatorModal`؛ سطرُ المبلغ صار يتضمن قائمةَ عملة حقيقية؛ `createPaymentRequest` يُرسِل `currency: selectedCurrency`.

**نموذج الشحن (#26) — إعادة كتابة كاملة:** [alx_web/src/pages/customer/orders/CreateShipmentModal.tsx](alx_web/src/pages/customer/orders/CreateShipmentModal.tsx) حُوِّل من نموذجٍ بثلاث خطواتٍ بقوائم ثابتة وأرقامٍ قابلة للتحرير وhackِ ملاحظاتٍ يشمل كلَّ شيء، إلى نسخةٍ مطابقة لأسلوب معالج الطلب: شريطٌ علوي (HeaderCell) يعرض رقمَ الشحنة والتتبع تلقائيَّين للقراءة فقط («يُنشأ تلقائيًا عند الحفظ») + تاريخَ الشحنة + عملةَ الشحنة + اسمَ العميل + زرَّ الحاسبة. القوائم الآن من DB عبر API: فئاتُ الشحن من `listShippingCategories()` (order_option)، فئاتُ المحتوى من `listItemCategories()` (items_category)، العملاتُ من `listCurrencies()`، البنوكُ من `listBanks()`؛ يُعرض اسمُ فئة الشحن مع المدّة/السعر بالعملة الحالية دون معدلاتٍ داخلية. قسمُ الدفع خطوةٌ كاملة مُسعَّرة من الخادم عبر `quoteCustomerOrder` (عملة الدفع + سعر الصرف المطبَّق + اختيار البنك + رقم المرجع + الدفعة + المتبقّي)، مع كوبونٍ ظاهر. **الحفظ:** يُنشِئ بندًا واحدًا يحمل `itemCategoryId/Name` لفئة المحتوى عبر `createCustomerOrder` (المسارُ الوحيد المتاح للعميل دون DDL ودون نقطة نهاية شحنات جديدة)؛ الدفعُ والكوبون الآن حقولٌ حقيقية في الطلب (`paymentMethod='Transfer'`/`amountPaid`/`paymentCurrencyCode`/`bankAccountId`/`bankReference`/`couponEnabled`/`couponRate`) بدل دفنها في الملاحظات؛ بقيت التفاصيلُ النصية للشحنة (النوع/الفئة/المصدر/الوجهة/التواريخ) في `notes`. لا مُنتَج/ربح/تكلفةُ شحن داخلية/مندوب/ناقل ظاهرة.

**قسم الأصدقاء (#28):** ملفٌ جديد [alx_web/src/pages/customer/friends/FriendsPage.tsx](alx_web/src/pages/customer/friends/FriendsPage.tsx) بثلاثة تبويبات (أصدقائي/برنامج الإحالة/الأرباح) بحالةِ فراغٍ مؤهولةٍ بانتظار ربطٍ لاحق. الربطُ: lazy importٌ و`<Route path="friends">` في [alx_web/src/App.tsx](alx_web/src/App.tsx) على نمط `gifts`؛ عنصرُ تنقّل `{ to: '/portal/customer/friends', icon: <Users/>, labelKey: 'friends' }` في [alx_web/src/layouts/CustomerLayout.tsx](alx_web/src/layouts/CustomerLayout.tsx) مع استيراد أيقونة Users؛ ومفتاحُ `friends: { ar: 'الأصدقاء', en: 'Friends' }` في [alx_web/src/lib/translations.ts](alx_web/src/lib/translations.ts) (نوع TKey مشتقٌّ من `keyof typeof t` فلا يحتاج تعديلًا يدويًّا).

**التحقق:** alx_api `npx tsc --noEmit -p tsconfig.json` نظيف (الملفات الخادمية لفئة الصنف/Nقاط المرجعية سابقًا لم تتغيّر هذه الجولة) • alx_web `tsc -b` نظيف + `vite build` ناجح (chunks: `PortalCalculatorModal`/`CreateShipmentModal` ضمن OrdersPage) + `vitest` 4/17 + `audit:portal-boundary` نظيف. لا DDL (لم تُنفَّذ أيُّ استعلاماتٍ خادمية؛ التوثيقُ من الملفات والعقود) ولا Supabase. لا commit (بانتظار طلب صريح). لم تُجرَ نقرةُ متصفحٍ حيّة (تتطلب جلسةَ عميلٍ مُصادَقة).

## [2026-10-19 05:55 +03:00] — الجولة الحاسمة: توحيدُ الحاسبة، إعادةُ بناء الطلب/الشحنة/الدفع بنفس قالب النظام — AI Model: Qoder Agent

**الدافع (توجيه المالك):** «احذف تصميم الحاسبة الحالي وانسخ حاسبة/مصارفة النظام كما هي؛ اسمح للعميل بالمصارفة؛ وحّد المكوّن ليُستخدم في النماذج الثلاثة». + «وسّع النوافذ، ووضّح الحدود والفواصل، وثبّت الشريط العلوي وشريط الخطوات والتذييل مع جسمٍ متموّر، وامنع الإغلاق بالنقر خارج النافذة (X فقط)، وأظهر أرقام الطلب/الشحنة/التتبع الفعلية، وخذ عملة الطلب من الإعدادات الافتراضية، واجمع فئات الصنف/التغليف/المحتوى/الشحن من DB، واجعل رسوم التأمين من الإعدادات غير قابلة للتحرير، وسمِّ حقل الكوبون بـ«كوبون الخصم»، واستبدل «شحن مستعجل» بـ«فئة الشحن» من `ORDER_OPTION`، وانقل الكوبون وفئة الشحن إلى الخطوة 3، واجعل «منتج سابق» نافذةً منبثقةً بحثية، وأضِف مفتاح «الدفع لاحقًا» بحالة «الأولى» في النموذجين، واعرض الكشف المالي الكامل والإجمالي بعملة الطلب وعملة الدفع معًا، وأخفِ شارة «عبر بنك»».

**الحاسبة الموحّدة (#30):** [alx_web/src/pages/customer/shared/PortalCalculatorModal.tsx](alx_web/src/pages/customer/shared/PortalCalculatorModal.tsx) — استُبدلت `cellCls` التايلوينديّة الميتة بدالةِ `cellStyle(text, kind: KeyKind): React.CSSProperties` تُعيد إنتاجَ مظهر `src/components/finance/FinancialCalculatorModal.tsx` بأنماط CSS مضمّنة (لوحةُ الأرقام داكنة، الأزرارُ العملياتية بتدرّجٍ ذهبي مع تعبئةٍ ذهبية للعمليات النشطة، `=` ذهبي، `C` ورديٌّ خطر، الأدوات مُبهمة). الحالةُ أُعيدت تسميتها إلى `currencyOptions`. نفسُ المكوّن يُستورَد في `CreateOrderModal.tsx`/`CreateShipmentModal.tsx`/`CustomerPaymentModal.tsx` (DRY). العميلُ يستطيع المصارفةَ ضمن حدود أسعار الخادم.

**مكوّنات واجهة مشتركة:** ملفٌ جديد [alx_web/src/pages/customer/shared/PortalFormBits.tsx](alx_web/src/pages/customer/shared/PortalFormBits.tsx) يصدِّر `sectionTitle`/`miniLabel`/`HeaderCell`/`FinanceLine`/`SummaryRow`/`StepBar`؛ و[alx_web/src/pages/customer/shared/PreviousProductPickerModal.tsx](alx_web/src/pages/customer/shared/PreviousProductPickerModal.tsx) (منبثقة بحث على نمط `src/components/orders/ProductPickerModal.tsx`: `autoFocus`، `onSelect`، شبكة بطاقات بحدٍّ ذهبي عند التحويم؛ الخلفية بلا `onClick` — الإغلاق فقط عبر زر X).

**نموذج الطلب (#31) — إعادةُ كتابة كاملة:** [alx_web/src/pages/customer/orders/CreateOrderModal.tsx](alx_web/src/pages/customer/orders/CreateOrderModal.tsx) ~450 سطرًا: الهيكل صار قشرةً ثابتة — `<div className="modal-backdrop">` بلا `onClick` خارجي + `.modal-box` بـ`maxWidth:1180, maxHeight:'92vh', display:flex, flexDirection:'column', overflow:'hidden', border:'1px solid var(--gold-border)'` + ترويسةٌ بـ`flexShrink:0` + `<StepBar/>` بـ`flexShrink:0` + `<form>` بجسمٍ `flex:1, overflowY:'auto'` وتذييلٍ `flexShrink:0` مع حدٍّ علوي وخلفية `--bg-card`. خليةُ «رقم الطلب» تعرض `previewCode || '—'` من نقطة `previewOrderCode`؛ «عملة الطلب» من `formSettings.defaultCurrencyCode`. التأمينُ محسوبٌ من `formSettings.defaultProductInsuranceFee` ويُعرض كشارةٍ للقراءة فقط «رسوم التأمين (من الإعدادات): {value} {code}»؛ البندُ المرسل يحمل `insuranceFee: i.isInsured ? insuranceFeeValue : 0`. «اختيار منتج سابق» يستدعي `PreviousProductPickerModal`. الكوبونُ وفئةُ الشحن نقلا من خطوة 2 إلى خطوة 3 (شبكة `repeat(auto-fit,minmax(240px,1fr))`). مفتاحُ «شحن مستعجل» أُزيل — `isUrgent:false` ثابت. شارةُ «عبر بنك (تحويل) — تلقائي» الذهبية حُذفت نهائيًا. خطوةُ 3 تضيف مفتاحَ «الدفع لاحقًا» `<button onClick={()=>setPayLater(p=>!p)}>` بأيقونة Wallet؛ عند التفعيل يُخفى قسمُ الدفع ويُعرض «سيُحفظ الطلب دون دفعة وبحالة الطلب الأولى، وتتم المطالبة لاحقًا»؛ خلاف ذلك حقولُ عملة الدفع/سعر الصرف (`readOnly`، «1 {orderCcy} = {fx.rate}»)/البنك/المرجع/الدفعة/0-سداد الكل/المتبقي. كشفٌ مالي كامل يعرض الوزن/الحجم/التغليف/التأمين/الكوبون/الإجماليَ بعملة الطلب والإجماليَ بعملة الدفع (سطر أخير بلون ذهبي وخط كبير). التذييلُ ثابت (`flexShrink:0`, حد علوي, خلفية `--bg-card`) مع السابق/التالي/حفظ. خطوةُ 4 ملخّصٌ شرطِي: «لاحقًا (دون دفعة)» أو تفاصيل البنك، + الإجماليان بالعملتين + فئة الشحن + خصم الكوبون.

**نموذج الشحنة (#32) — إعادةُ بناء مماثلة:** [alx_web/src/pages/customer/orders/CreateShipmentModal.tsx](alx_web/src/pages/customer/orders/CreateShipmentModal.tsx) بنفس القشرة (1180px، بلا إغلاق خارجي، ترويسة/خطوات/تذييل ثابتة، جسمٌ متموّر)؛ رقمُ الشحنة والتتبع من `previewOrderCode` (الشحنة مشتقة من طلب في `createCustomerOrder`)؛ عملةُ الشحنة من `formSettings`؛ «فئة الشحن» من `order_option` (نوع=shipping_category)، «فئة المحتوى» من `items_category`، التغليفُ من `order_option` (نوع=packaging)؛ مفتاحُ «شحن مستعجل» حُذف تمامًا (`packageType:'standard'`)؛ الكوبونُ نُقل إلى خطوة 3؛ خطوة 3 «الخلاصة والدفع» أضافت «الدفع لاحقًا» وكشفًا ماليًا كاملًا وإجماليًا بعملة الشحنة وعملة الدفع مع سعر الصرف الحقيقي من `fx.rate`؛ حُذفت شارةُ «عبر بنك»؛ خلاصةٌ مصغّرة قبل الحفظ تعرض رقم الشحنة/العميل/المصدر/الوجهة/حالةَ الدفع/الإجماليَّين بالعملتين.

**نموذج الدفع المالي (#33):** [alx_web/src/pages/customer/finance/CustomerPaymentModal.tsx](alx_web/src/pages/customer/finance/CustomerPaymentModal.tsx) وسّعته إلى `maxWidth:860, maxHeight:'90vh'` بنفس قشرةِ النوافذ (ترويسةٌ + تذييلٌ ثابتان، جسمٌ `overflowY:'auto'`، بلا `onClick` على `.modal-backdrop` — الإغلاق فقط عبر X)، حدودٌ ذهبية `--gold-border` وظلٌّ `rgba(212,175,55,0.12)` على بطاقة المبلغ. قائمةُ عملة حقيقية (`form-select` بعرض 200) + زرُّ «الحاسبة والمصارفة» في الترويسة يفتح `PortalCalculatorModal`. أزرارُ اختيار البنك صارت `padding:0.75rem 0.85rem` و`border:1.5px` و`boxShadow` ذهبي عند التفعيل. تذييلٌ يعرض المبلغَ والعملةَ على اليسار وأزرار الإلغاء/الإرسال على اليمين. بطاقةُ السند/المرجع/الملاحظات كلٌّ في `section-card` بحدود واضحة.

**بوابة API (#24):** interface `PortalAuthGateway` أضاف `getFormSettings(): Promise<PortalFormSettingsDto>` و`previewOrderCode(): Promise<PortalOrderCodePreviewDto>` ([alx_web/src/api/portalAuthGateway.ts:502-506](alx_web/src/api/portalAuthGateway.ts)). التطبيقُ في نفس الملف (`async getFormSettings()` و`async previewOrderCode()` عند ~844 و~856) يتحقّق من شكل DTO ويرمي `PORTAL_API_INVALID_RESPONSE` عند الانحراف. `PortalOrderCreateInput` أضاف `shippingCategoryId?: string`.

**التحقق:** alx_web `tsc -b` نظيف + `vite build` ناجح (chunks نهائية للمكوّنات الثلاثة: `OrdersPage-*.js` 86.8kB) + `vitest` 4/17 + `audit:portal-boundary` نظيف؛ alx_api `tsc --noEmit` نظيف + `jest` 49/49 (427/427). اختبارا `portal-order-pricing`/`portal-owned.quote` أُحيِنا للسطور الجديدة (`packagingOptionsFeeSAR`, `productInsuranceFeeSAR`, `couponDeductionSAR`, keys `packagingOptionsFee`/`productInsuranceFee`/`couponDeduction` ضمن الـ DTO العام). لا DDL، لا Supabase، لا commit.

**قيود موثّقة للمالك:** «كوبون كـكود نصّي» غيرُ قابل للتطبيق دون DDL — قاعدةُ البيانات لا جدول `coupons` فيها ونموذجُ النظام نفسه يستخدم حقلَ مبلغ (`couponRate: number`). الاسمُ تغيّر إلى «كوبون الخصم» كما طُلب، وبقيَ الحقلُ رقميًا لأنه مطابقٌ لسلوك النظام. الترقيةُ إلى كوبون نصّي تحتاج جدولًا وممرَّ تحقّق — مؤجَّلةٌ حتى يُصرَّح بـ DDL.

## [2026-10-19 09:20 +03:00] — إصلاحات نموذجَي الطلب/الشحنة وتصغير قوائم العملات — AI Model: Qoder Agent
**CreateOrderModal:** أصبح الحفظ حصريًا بزر «حفظ الطلب» (`type="button"` + `onClick`) مع `onSubmit={e => e.preventDefault()}` على النموذج حتى لا يحفظ Enter أو أي انتقال مرحلة شيئًا — إصلاح الحفظ التلقائي عند الوصول للمرحلة الرابعة. كشف «المالية والدفع» صار تفصيليًا: قيمة المنتجات (كمية×سعر من مدخلات العميل نفسها)، رسوم التغليف المخصص والتأمين وخصم الكوبون من عرض السعر الخادمي، ملاحظة أن الإجمالي يشمل رسوم الشحن/التغليف الأساسي من إعدادات الشركة، ثم الإجمالي بعملة الطلب وعملة الدفع مع سعر الصرف الحقيقي، والمدفوع/المتبقي ببطاقة الدفع. عملة الطلب تتغذى من `formSettings.defaultCurrencyCode` التي يعيدها الخادم الآن من `default_order_currency`.

**CreateShipmentModal (إعادة بناء):** لم تعد تُحفَظ الشحنة طلبًا عبر `createCustomerOrder` — تنادى `createCustomerShipment` على `POST /portal/shipments` فينشئ الخادم صف `public.shipments` حقيقيًا مرتبطًا بطلب حاوية مملوك. «المدة (أيام)» حقل للقراءة فقط يتغذى من `formSettings.defaultShippingDurationDays`، و«الوصول المتوقع» يُحسب تلقائيًا (الآن + المدة) للقراءة فقط. الكشف المالي التفصيلي يعرض بطاقات رسوم الكراتين العامة من `items_category` (جمرك/ضريبة/أخرى × عدد الكراتين) + سعر التغليف من `order_option` + المدفوع المعلن والمتبقي التقديري، مع تنبيه أن التسعير النهائي من الموظفين. حُذف الكوبون وحقول التاريخ اليدوي غير المدعومة في مخطط الشحنة، وعملة الشحنة من `default_order_currency`. زر «حفظ الشحنة» هو وحده ما يحفظ.

**PortalFormBits/StepBar:** توسيط الشريط (`justifyContent:center`) وخلفية بطاقة، كبسولة إبراز للمرحلة الحالية بإطار ذهبي، موصلات أطول (44px) وانتقالات ناعمة — مستخدم في النموذجين معًا.

**قوائم العملات (0.72rem):** `CustomerPaymentModal`، `CreateOrderModal`، `CreateShipmentModal`، `PortalCalculatorModal` (خانتا من/إلى).

**الجسر:** أنواع `PortalShipmentCreateInput` و`defaultShippingDurationDays` و`bankAccountId` في `portalAuthGateway.ts` مع تحقق DTO.

**التحقق:** `npm run check` نظيف، `npm run build` ناجح، `vitest` 17/17، `audit:portal-boundary` نظيف. لا DDL ولا Supabase. لا commit.
