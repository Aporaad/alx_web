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
