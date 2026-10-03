import { useState, useEffect, useCallback } from 'react';
import { ordersGateway } from '../../../data/gateways/supabase/supabase-orders.gateway';
import type { PortalOrder, OrderStatus } from '../../../types/portalTypes';

export function useMyOrders(customerUid?: string, customerId?: string) {
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!customerUid && !customerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await ordersGateway.getMyOrders({ customerUid, customerId });
      setOrders(data);
    } catch (err: any) {
      console.error('[useMyOrders] fetch error:', err);
      setError(err.message || 'فشل جلب الطلبات');
    } finally {
      setLoading(false);
    }
  }, [customerUid, customerId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const cancelOrder = useCallback(async (orderId: string, reason?: string) => {
    try {
      await ordersGateway.cancelOrder(orderId, reason);
      await fetchOrders();
    } catch (err: any) {
      throw new Error(err.message || 'فشل إلغاء الطلب');
    }
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refreshOrders: fetchOrders,
    cancelOrder,
  };
}
