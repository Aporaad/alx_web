# سجل أوامر وتحديثات قاعدة البيانات - مشروع الويب (db_commends.md)

---

## [2026-10-01T01:21:34+03:00] - تنفيذ بواسطة النموذج: Gemini 3.6 Flash

### حالة المهمة:
حالة تحليل وتوثيق خطة الهيكلة مسبقة الـ API.

### الأوامر والعبارات المنفذة:
```sql
-- لم يتم تنفيذ أي أوامر SQL أو تعديل على قاعدة البيانات خلال مرحلة إعداد الخطة.
```

---

## [2026-10-01T02:23:25+03:00] - تنفيذ بواسطة النموذج: Gemini 3.6 Flash

### حالة المهمة:
جلب خريطة حقول وأعمدة جداول قاعدة البيانات الحقيقية من Supabase المطورة لمطابقة كود الموقع.

### الأوامر والعبارات المنفذة:
```sql

---

## [2026-10-01T03:51:00+03:00] - تنفيذ بواسطة النموذج: Gemini 3.6 Flash

### حالة المهمة:
تحديث كافة استعلامات ومسميات الحقول القديمة في أكواد وبوابات مشروع الويب لمطابقة أسماء المفاتيح الكيانية بجدول قاعدة البيانات.

### الاستعلامات والأوامر المحدثة بفرع البوابات والمساعدات:
```sql
-- portal_users update by entity primary key:
UPDATE portal_users SET join_by = $1, referrer_id = $2 WHERE portal_user_id = $3;

-- customers update by entity primary key:
UPDATE customers SET join_by = $1, referrer_id = $2 WHERE customer_id = $3;

-- orders update and query by entity primary key:
SELECT * FROM orders WHERE order_id = $1;
UPDATE orders SET order_status1 = 'cancelled' WHERE order_id = $1;


---

## [2026-10-01T04:08:00+03:00] - تنفيذ بواسطة النموذج: Gemini 3.6 Flash

### حالة المهمة:
إلغاء استخدام auth.users واعتمد المصادقة الحصرية المباشرة عبر جدول `public.portal_users`.

### الأوامر والعبارات المستعملة:
```sql
-- Authenticate directly against public.portal_users:
SELECT * FROM portal_users WHERE email = $1 OR username = $1 OR data->>'phone' = $1 LIMIT 1;

-- Register directly into public.portal_users:
INSERT INTO portal_users (portal_user_id, username, email, full_name, password, portal_role, approval_status, account_id, linked_customer_id, join_by, referrer_id, created_at, updated_at, data)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);

-- Update user password directly in public.portal_users:
UPDATE portal_users SET password = $1, updated_at = $2 WHERE portal_user_id = $3;
```

---

## [2026-10-01T04:24:00+03:00] - تنفيذ بواسطة النموذج: Gemini 3.6 Flash

### حالة المهمة:
تطوير تصفية الأعمدة ومنع تمرير خصائص camelCase كـ top-level columns لـ Supabase.

### الأوامر والعبارات المستعملة:
```sql
-- Sanitized Upsert into customers table with strict snake_case columns & jsonb data:
INSERT INTO customers (customer_id, account_id, full_name, created_at, updated_at, data)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (customer_id) DO UPDATE 
SET account_id = EXCLUDED.account_id, full_name = EXCLUDED.full_name, updated_at = EXCLUDED.updated_at, data = EXCLUDED.data;
```



