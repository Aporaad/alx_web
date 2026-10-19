# خطة إصلاح موقع alx_web ونقل اعتماده كلياً إلى alx_api والتخلص من Supabase نهائياً

- **التاريخ:** [2026-10-17 22:47 +03:00]
- **المنفّذ (AI Model):** Qoder
- **الحالة:** الخطة معتمدة القرارات، بانتظار الموافقة النهائية على بدء التنفيذ (لم يُعدَّل أي ملف بعد)
- **النطاق:** مجلد `alx_web` فقط — لا تغيير في قاعدة البيانات، ولا DDL، ولا أوامر git/submodules، ولا تعديل في `alx_api`.

---

## 1) الهدف

1. إصلاح موقع `alx_web` وترتيب هيكله وتحديث أكواده وملفاته.
2. مواءمة الموقع مع التحديثات الجديدة في قاعدة البيانات (التسطيح: لا `jsonb`/`data` بعد 0028/0034/0038) وفي الـ API.
3. نقل الاعتماد الكلي للموقع إلى `alx_api` عبر HTTP.
4. التخلص من Supabase نهائياً (الحزمة، الـ stubs، الأسرار، اقتران البناء، الوثائق القديمة).

---

## 2) التشخيص — الوضع الحالي (نتيجة فحص read-only)

- الموقع **منقول فعلياً بنسبة ~95%** إلى `alx_api`: لا يوجد أي `import` لـ `@supabase/supabase-js` ولا أي `createClient` في `src/` بالكامل.
- كل الصفحات تستهلك `portalAuthGateway` / `portalGateway` عبر HTTP.
- **كل endpoint تستدعيه الواجهة موجود ومنفَّذ في `alx_api`** (auth، orders، ledger، tickets، payment-requests، courier، supplier، tracking، announcements، job-applications).
- `npx tsc -b` نظيف (EXIT 0).
- ما تبقّى من Supabase هو **حطام ميت + اقتران بناء + أسرار + ملفات قديمة**، وليس منطقاً عاملاً.

### 2.1 بقايا Supabase في `src/` (كلها ميتة/no-op)

| الملف | الحالة |
|---|---|
| `src/lib/supabase.ts` | stub — دوال فارغة تُرجع `[]`/`null` (deprecated) |
| `src/lib/legacy-supabase/supabase.ts` | stub — دوال فارغة (deprecated) |
| `src/api/legacy-portal.ts` | يعيد تصدير الـ stub — **غير مستخدم** |
| `src/lib/financialAccountHelper.ts` | يستورد no-op stubs — **غير مستخدم** |
| `src/lib/custDetailsHelper.ts` | stub — **غير مستخدم** |
| `src/api/portalAuthCompatibility.ts` | طبقة توافق ميتة — **غير مستخدمة** (لها اختبار) |
| `src/types/portalTypes.ts:13` | تعليق قديم فقط ("Supabase Auth UID" / "data JSONB") |

### 2.2 اقتران البناء والأسرار

| الموقع | المشكلة |
|---|---|
| `package.json:17` | تبعية `@supabase/supabase-js` |
| `vite.config.ts:27` | `manualChunks` فيه `supabase: ['@supabase/supabase-js']` → **البناء ينكسر** إذا حُذفت التبعية دون إصلاحه |
| `.env` | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` ما زالت موجودة |
| `scripts/check-portal-boundary.mjs` | الحارس الحالي لا يمسح `vite.config.ts` ولا يرفض مسارات `supabase` بالاسم |

### 2.3 عيوب وظيفية حقيقية (مستقلة عن Supabase)

1. **زر "طلب جديد" مخفي:** `src/pages/customer/MyOrdersPage.tsx:798` يشترط `VITE_PORTAL_CUSTOMER_ORDERS_API_ENABLED === 'true'`، لكن `.env` **لا يعرّفه** (موجود فقط في `.env.example`) → `undefined` → الواجهة مخفية.
2. **منطق flags غير متسق:** `!== 'false'` في `portalAuthGateway.ts:290` و`portalGateway.ts:51` مقابل `=== 'true'` في `MyOrdersPage.tsx`.
3. **عقود أنواع قديمة ومكررة:** `src/types/portalTypes.ts` يوثّق JSONB/Supabase Auth UID، وفيه تكرار مع DTOs في `portalAuthGateway.ts` (`PortalOrder` مقابل `PortalOrderDto`، `PortalTicket` مقابل `PortalTicketDto`) — مخالفة لـ DRY.
4. **`src/env.d.ts` ناقص:** يعلن 3 متغيرات فقط (`VITE_PORTAL_API_BASE_URL`, `VITE_APP_NAME`, `VITE_APP_URL`) من ~6 تُقرأ فعلياً.

### 2.4 ملفات قديمة/تالفة في جذر `alx_web`

- `README.md` — ترميز UTF-16/تالف.
- `implementation_plan.md` + `implementation_plan copy.md` — مكرر وقديم (حقبة Supabase RLS).
- `ui_and_entity_specifications.md` — قديم (يشير إلى `supabase-firebase-adapter`).
- `PORTAL_DB_SETUP.sql` + `CUST_DETAILS_DB_SETUP.sql` — سكيمات `{id, data JSONB}` قديمة، حلّت محلّها migrations في `alx_api`.

### 2.5 التحقق من تغطية alx_api للكود الميت (شرط الحذف — **تم**)

- **`financialAccountHelper.ts`** → مستبدَل بالكامل في الخادم: `alx_api/src/modules/portal/portal-auth.repository.ts:358-485` (يحسب `account_code` التالي، يُدرج في `public.accounts`، ويربط `financial_account_id/code` بمستخدم البوابة — ضمن معاملة أثناء التسجيل).
- **`custDetailsHelper.ts`** → مستبدَل بـ `GET/PUT /api/v1/portal/customer-details`: `portal-owned.routes.ts:105,118` + `portal-owned.repository.ts:998-1104` (بقفل advisory وأعمدة مسطّحة، «لا مفاتيح حرة ولا jsonb»).
- **`portalAuthCompatibility.ts`** → مستبدَل بـ `portalAuthGateway` (login/register/me/refresh/logout/password عبر API).
- **stubs + `legacy-portal.ts`** → لا مستدعي حيّ لها؛ كل الوصول للبيانات عبر HTTP gateways.

---

## 3) القرارات المعتمدة من المالك

1. **الكود الميت:** التأكد من وجود أكواد `alx_api` البديلة (تم التحقق أعلاه) **ثم الحذف النهائي**.
2. **الملفات القديمة:** حذف التالف/المكرر + أرشفة الباقي.
3. **Feature flags:** اختيار الحل الأفضل بما يخدم **الاعتماد الكامل على `alx_api` فقط** → توحيد العلم إلى (base URL + `VITE_PORTAL_API_ENABLED` واحد) وإزالة الأعلام التفصيلية.
4. **Git/submodules:** تجاهل الموضوع تماماً (لا أوامر git، لا إعادة هيكلة).

---

## 4) مراحل التنفيذ (مرتبة، مع بوابات تحقق)

### P0 — تثبيت خط الأساس (read-only، دون تعديل)
- تشغيل وتسجيل: `npx tsc -b` (تم: EXIT 0)، `npm run test` (vitest)، `npm run build`، `npm run audit:portal-boundary`.
- توثيق أعداد النجاح/الفشل للمقارنة بعد التغيير.

### P1 — حذف كود Supabase الميت نهائياً
- قبل كل حذف: إعادة `grep` للتأكد من صفر مستوردين أحياء.
- حذف: `src/lib/supabase.ts`، `src/lib/legacy-supabase/supabase.ts` (+ المجلد الفارغ)، `src/api/legacy-portal.ts`، `src/lib/financialAccountHelper.ts`، `src/lib/custDetailsHelper.ts`، `src/api/portalAuthCompatibility.ts`، `src/api/portalAuthCompatibility.test.ts`.
- **بوابة:** `npx tsc -b` يبقى نظيفاً.

### P2 — فصل اقتران البناء والأسرار
- إزالة `@supabase/supabase-js` من `package.json`.
- إزالة `supabase: ['@supabase/supabase-js']` من `manualChunks` في `vite.config.ts` (وإلا انكسر البناء).
- حذف مفاتيح Supabase من `.env`؛ وإبقاء `.env.example` خالياً منها.
- تشديد `scripts/check-portal-boundary.mjs`: مسح `vite.config.ts` أيضاً، ورفض أي مسار/استيراد فيه `supabase`.
- **بوابة:** `npm run build` ينجح بدون التبعية؛ `npm run audit:portal-boundary` يُبلغ «صفر».

### P3 — توحيد feature flags نحو alx_api فقط
- توحيد منطق التفعيل: base URL + علم واحد `VITE_PORTAL_API_ENABLED`.
- إصلاح `MyOrdersPage.tsx:798`: جعل واجهة "طلب جديد" مرتبطة بوجود الـ gateway لا بعلم تفصيلي.
- مواءمة `portalAuthGateway.ts:290` مع `portalGateway`.
- إكمال `src/env.d.ts` بكل متغيرات `VITE_` المقروءة.
- تحديث `.env` و`.env.example` للمجموعة المصغّرة.
- **بوابة:** `npx tsc -b` نظيف.

### P4 — مطابقة العقود والأنواع مع قاعدة البيانات المسطّحة والـ API
- تحديث `src/types/portalTypes.ts`: إزالة تعليقات JSONB/Supabase Auth UID.
- إزالة التكرار مع DTOs في `portalAuthGateway.ts` → مصدر حقيقة واحد لكل شكل (DRY).
- مطابقة كل DTO/validator مع استجابة `alx_api` الحيّة لـ: orders، ledger، courier، supplier، tracking، announcements، customer-details، payment-requests (بعد التسطيح).
- ضبط الـ runtime validators حيثما انحرف الشكل.
- **بوابة:** `tsc` + `vitest` أخضر.

### P5 — ترتيب الهيكل وتنظيف الملفات القديمة
- إعادة كتابة `README.md` بترميز UTF-8 صالح ومحتوى حقيقي.
- حذف `implementation_plan copy.md` (مكرر).
- أرشفة إلى `alx_web/docs/archive/`: `implementation_plan.md`، `ui_and_entity_specifications.md`، `PORTAL_DB_SETUP.sql`، `CUST_DETAILS_DB_SETUP.sql`.
- التأكد أن `.gitignore` يغطي `dist/` و`tsconfig.tsbuildinfo`.
- الإبقاء على هيكل `src/` (نظيف بالفعل: api/، components/، context/، contracts/، layouts/، lib/، pages/، types/).

### P6 — Git/submodules
- **ملغاة** حسب قرار المالك («تجاهل الموضوع»). لا أوامر git ولا إعادة هيكلة.

### P7 — التحقق الشامل والتوثيق
- بوابة خضراء كاملة: `tsc -b`، `vitest run`، `npm run build`، `audit:portal-boundary` (صفر supabase).
- Smoke test يدوي عبر `npm run dev` + متصفح ضد `alx_api` يعمل: landing، login، register، طلبات العميل (و"طلب جديد" ظاهر الآن)، ledger + payment request، tickets، tracking عام، announcements، courier (tasks/stats/ledger)، supplier (orders/update)، job application.
- الإلحاق (دون حذف/استبدال) بـ `alx_web/todo.md` و`alx_web/devloping_history.md` و`alx_web/user_commends.md` بصيغة `## [YYYY-MM-DD HH:MM +03:00] — Qoder`.
- لا تغيير في قاعدة البيانات → `DBdevloping_history.md` و`db_commends.md` بلا تعديل.
- تحديث ذاكرة المشروع بحالة الهجرة المكتملة.

---

## 5) ملاحظات للشفافية

- مفتاح `VITE_SUPABASE_ANON_KEY` الحالي في `.env` (وإن كان anon عاماً) سيُزال من الملف؛ إن كان مكشوفاً في مستودع عام يُستحسن **تدويره من لوحة Supabase** (خارج نطاق هذه الخطة — تنبيه فقط).
- حذف `portalAuthCompatibility.test.ts` ضروري لأنه يختبر كوداً ميتاً سيُحذف.
- خط الأساس الحالي المعروف: `tsc -b` نظيف. بقية نتائج P0 تُسجَّل قبل أي تعديل.

---

## 6) ملخص الملفات المتأثرة

- **حذف:** `src/lib/supabase.ts`، `src/lib/legacy-supabase/supabase.ts`، `src/api/legacy-portal.ts`، `src/lib/financialAccountHelper.ts`، `src/lib/custDetailsHelper.ts`، `src/api/portalAuthCompatibility.ts`، `src/api/portalAuthCompatibility.test.ts`، `implementation_plan copy.md`.
- **تعديل:** `package.json`، `vite.config.ts`، `.env`، `.env.example`، `scripts/check-portal-boundary.mjs`، `src/pages/customer/MyOrdersPage.tsx`، `src/api/portalAuthGateway.ts`، `src/env.d.ts`، `src/types/portalTypes.ts`، `README.md`، `.gitignore`، (+ `todo.md`/`devloping_history.md`/`user_commends.md` إلحاقاً).
- **أرشفة إلى `docs/archive/`:** `implementation_plan.md`، `ui_and_entity_specifications.md`، `PORTAL_DB_SETUP.sql`، `CUST_DETAILS_DB_SETUP.sql`.
