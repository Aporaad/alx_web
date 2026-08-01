import { getCollection, upsertDoc } from './supabase';

/**
 * Generates the next sequential account code for a given entity type prefix.
 * Performs strict uniqueness check for accountId, accountCode, code, and accountNumber
 * across all existing accounts in the database to prevent duplicate account IDs & codes.
 *
 * Prefix map:
 *   customer  → 1130  (Asset — Accounts Receivable)
 *   courier   → 2120  (Liability — Courier Ledger)
 *   supplier  → 2110  (Liability — Supplier Ledger)
 */
export async function getNextAccountCode(
  entityType: 'customer' | 'courier' | 'supplier'
): Promise<{ prefix: string; accountNumber: string; accountCode: string; code: string; accountId: string }> {
  const prefix = entityType === 'customer' ? '1130' : entityType === 'courier' ? '2120' : '2110';

  let allAccounts: any[] = [];
  try {
    allAccounts = await getCollection('accounts');
  } catch (_) {
    allAccounts = [];
  }

  const existingIds = new Set<string>();
  const existingCodes = new Set<string>();
  const existingNumbersForPrefix = new Set<string>();

  let maxSeq = 0;

  for (const a of allAccounts) {
    if (a.id) existingIds.add(String(a.id));

    const accCode = String(a.accountCode || a.code || '').trim();
    if (accCode) existingCodes.add(accCode);

    const rawCode = String(a.code || '').trim();
    if (rawCode) existingCodes.add(rawCode);

    const accNum = String(a.accountNumber || '').trim();
    const accPrefix = String(a.accountPrefix || a.parentCode || '').trim();

    if (accPrefix === prefix || accCode.startsWith(`${prefix}-`)) {
      if (accNum) existingNumbersForPrefix.add(accNum);

      const parts = accCode.split('-');
      if (parts.length >= 2) {
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
      if (accNum) {
        const num = parseInt(accNum, 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  let candidateSeq = Math.max(maxSeq + 1, allAccounts.length + 1, 1);

  while (true) {
    const seqStr = String(candidateSeq).padStart(4, '0');
    const candidateCode = `${prefix}-${seqStr}`;
    const candidateId = `acc_${prefix}_${seqStr}`;

    const isCodeTaken = existingCodes.has(candidateCode);
    const isIdTaken = existingIds.has(candidateId);
    const isNumTaken = existingNumbersForPrefix.has(seqStr);

    if (!isCodeTaken && !isIdTaken && !isNumTaken) {
      return {
        prefix,
        accountNumber: seqStr,
        accountCode: candidateCode,
        code: candidateCode,
        accountId: candidateId,
      };
    }
    candidateSeq++;
  }
}

/**
 * Creates the financial account record in the `accounts` table.
 * The entity document (customers/couriers/sources) MUST already have
 * financialAccountId and financialAccountCode set before calling this.
 */
export async function createFinancialAccountRecord(params: {
  accountId: string;
  accountCode: string;
  accountNumber: string;
  prefix: string;
  entityType: 'customer' | 'courier' | 'supplier';
  entityId: string;
  entityName: string;
  currency: string;
}): Promise<void> {
  const {
    accountId, accountCode, accountNumber, prefix,
    entityType, entityId, entityName, currency
  } = params;
  const now = Date.now();
  const typeName = entityType === 'customer' ? 'Asset' : 'Liability';
  const entityLabel = entityType === 'customer' ? 'العميل' : entityType === 'courier' ? 'المندوب' : 'المورد';

  const accountPayload = {
    id: accountId,
    accountCode,
    code: accountCode,
    accountNumber,
    accountPrefix: prefix,
    parentCode: prefix,
    balance: 0,
    debitTotal: 0,
    creditTotal: 0,
    currency,
    entityId,
    entityName,
    entityType,
    isActive: true,
    nameAr: `حساب ${entityLabel} - ${entityName}`,
    nameEn: `${entityType} Account - ${entityName}`,
    notes: 'حساب مالي تلقائي أُنشئ عند التسجيل عبر البوابة',
    type: typeName,
    createdAt: now,
    updatedAt: now,
  };

  await upsertDoc('accounts', accountId, accountPayload);
}
