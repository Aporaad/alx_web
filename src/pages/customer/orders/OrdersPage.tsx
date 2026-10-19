import React, { useState } from 'react';
import { Package, Truck, ShoppingBag } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import MyOrdersPage from '../MyOrdersPage';
import ShipmentsListPage from './ShipmentsListPage';
import MyProductsListPage from './MyProductsListPage';

/**
 * حاوية تبويبات الطلبات (§3.1): الطلبات • الشحنات • منتجاتي.
 * Orders tab container: Orders • Shipments • My Products.
 * تبويب «الطلبات» يُضمّن قائمة MyOrdersPage؛ الإنشاء نافذة منبثقة (CreateOrderModal) لا تبويبة داخلية.
 * The Orders tab embeds MyOrdersPage (list); creation is a pop-up modal (CreateOrderModal), not an inner tab.
 */
type OrdersTab = 'orders' | 'shipments' | 'products';

export default function OrdersPage() {
  const { isRtl } = usePortalTheme();
  const [tab, setTab] = useState<OrdersTab>('orders');

  const tabs: Array<{ id: OrdersTab; label: string; icon: React.ReactNode }> = [
    { id: 'orders', label: isRtl ? 'الطلبات' : 'Orders', icon: <Package size={15} /> },
    { id: 'shipments', label: isRtl ? 'الشحنات' : 'Shipments', icon: <Truck size={15} /> },
    { id: 'products', label: isRtl ? 'منتجاتي' : 'My Products', icon: <ShoppingBag size={15} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="glass-card" style={{ padding: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`btn btn-sm ${tab === t.id ? 'btn-gold' : 'btn-ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'orders' && <MyOrdersPage />}
      {tab === 'shipments' && <ShipmentsListPage />}
      {tab === 'products' && <MyProductsListPage />}
    </div>
  );
}
