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
