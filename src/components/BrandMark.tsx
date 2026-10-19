import { useEffect, useState } from 'react';
import { loadPortalBrand, type PortalBrand } from '../api/brandGateway';

interface BrandMarkProps {
  /** الرمز المستخدم عندما لا يرفع المالك شعارًا — emoji shown while the DB has no logo. */
  fallbackEmoji: string;
  /** صفRole تحت الاسم (عميل/مندوب/مورّد) — the role caption under the name. */
  caption?: string;
}

/**
 * اسم الشركة وشعارها من قاعدة البيانات، في مكوّن واحد تستخدمه كل تخطيطات البوابة.
 * The company name and logo come from the database through one component every portal layout shares.
 */
export function BrandMark({ fallbackEmoji, caption }: BrandMarkProps) {
  const [brand, setBrand] = useState<PortalBrand | null>(null);

  useEffect(() => {
    let active = true;
    void loadPortalBrand().then((value) => {
      if (!active) return;
      setBrand(value);
      // عنوان النافذة جزء من الهوية: يتبع اسم الشركة في القاعدة لا نصًا ثابتًا في البناء.
      // The window title is part of the identity: it follows the stored company name, not build-time text.
      const title = value.companyName || value.systemName;
      if (title) document.title = title;
    });
    return () => { active = false; };
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{
        width: 36, height: 36,
        background: 'rgba(212,175,55,0.1)',
        border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: '0.6rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {brand?.systemLogo
          ? <img src={brand.systemLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <span style={{ fontSize: '1.1rem' }}>{fallbackEmoji}</span>}
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--gold)' }}>
          {brand?.companyName || brand?.systemName || ''}
        </div>
        {caption && (
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{caption}</div>
        )}
      </div>
    </div>
  );
}
