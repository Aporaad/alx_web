
## [2026-10-03 03:44:30 +0300] — AI Model: Manus
```text
لم يتم تنفيذ أي أمر SQL في alx_web.
```

## [2026-10-18 20:41 +03:00] — فحص مخطط للقراءة فقط لدعم P1b — AI Model: Qoder
```sql
-- قراءة فقط (SELECT). لا DDL ولا كتابة. شُغِّلت عبر node --env-file=.env + pg للتأكّد من الأعمدة.
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_schema='public' AND table_name='accounts' ORDER BY ordinal_position;
SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='currency' ORDER BY ordinal_position;
SELECT cur_id, code, main_name_ar, symbol, is_default FROM public.currency ORDER BY is_default DESC, code;
-- النتيجة: الافتراضي code=YER symbol=ر.ي؛ accounts فيه balance/currency.

SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='orders'
   AND (column_name LIKE '%amount%' OR column_name LIKE '%cost%' OR column_name='order_currency_code');
-- النتيجة: amount_paid/amount_remaining/total_cost_sar/total_cost_yer متوفرة للتجميع الآمن.
```

## [2026-10-19 00:48 +03:00] — فحص قراءة فقط للتحقق من استعلام كشف الحساب (D3) ودعم job_req — AI Model: Qoder
```sql
-- قراءة فقط (SELECT). لا DDL ولا كتابة. عبر node --env-file + pg للتأكّد من صحة SQL قبل الاعتماد.
SELECT at.account_id, count(*) c FROM public.account_trans at
  JOIN public.main_entry me ON me.main_entry_id=at.main_entry_id
 WHERE me.posting_status='posted' GROUP BY at.account_id ORDER BY c DESC LIMIT 1;
-- حساب تجريبي: 1110-0003

SELECT me.entry_number, at.trans_type, at.amount, at.created_at
  FROM public.account_trans at JOIN public.main_entry me ON me.main_entry_id=at.main_entry_id
 WHERE at.account_id=$1 AND me.posting_status='posted'
   AND at.created_at >= to_timestamp($2/1000.0) AND at.created_at <= to_timestamp($3/1000.0)
 ORDER BY at.created_at DESC LIMIT 3;
-- نجح؛ trans_type ∈ {Credit, Debit}؛ amount numeric.

SELECT DISTINCT trans_type FROM public.account_trans WHERE account_id=$1 LIMIT 10;
-- النتيجة: Credit/Debit — استُخدمت كخيارات فلتر النوع في كشف الحساب.
```

