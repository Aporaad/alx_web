/**
 * currencyLabel.ts
 * نص خيار العملة الموحّد في بوابة العميل — الرمز والاسم ووسم «افتراضية».
 * One shared currency option label for the portal: flag, code, localized name, symbol, default marker.
 *
 * العملات المعطّلة لا تصل لهذه القوائم أصلًا: /api/v1/portal/currencies يعيد النشطة فقط.
 * Disabled currencies never reach these lists: /api/v1/portal/currencies selects active rows server-side.
 */
import type { PortalCurrencyRefDto } from '../api/portalAuthGateway';

type CurrencyLabelSource = Pick<PortalCurrencyRefDto, 'code' | 'nameAr' | 'nameEn' | 'symbol' | 'flag' | 'isDefault'>;

export function currencyOptionLabel(currency: CurrencyLabelSource, isRtl: boolean): string {
  const name = isRtl ? (currency.nameAr || currency.nameEn) : (currency.nameEn || currency.nameAr);
  const marker = currency.isDefault ? (isRtl ? '— افتراضية' : '(Default)') : '';
  return [
    `${currency.flag ? `${currency.flag} ` : ''}${currency.code}`,
    name ? `— ${name}` : '',
    currency.symbol ? `(${currency.symbol})` : '',
    marker,
  ].filter(Boolean).join(' ');
}
