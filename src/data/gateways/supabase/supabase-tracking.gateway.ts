import { ordersGateway } from './supabase-orders.gateway';
import type { PortalTrackingGateway, SecuredTrackingResult } from '../../contracts/tracking.gateway';

export class SupabaseTrackingGateway implements PortalTrackingGateway {
  async trackOrderSecured(
    searchQuery: string,
    authUser: { uid: string; email?: string; phone?: string; linkedAccId?: string; fullName?: string }
  ): Promise<SecuredTrackingResult> {
    const query = searchQuery.trim();
    if (!query) {
      return { order: null, shipment: null, isOwner: false, message: 'يرجى إدخال رقم التتبع أو رقم الطلب.' };
    }

    if (!authUser || !authUser.uid) {
      return { order: null, shipment: null, isOwner: false, message: 'يرجى تسجيل الدخول أولاً لتتبع الشحنات.' };
    }

    // Search by tracking number or order ID
    let order = await ordersGateway.getOrderByTrackingNumber(query);
    if (!order) {
      order = await ordersGateway.getOrderById(query);
    }

    if (!order) {
      return { order: null, shipment: null, isOwner: false, message: 'لم يتم العثور على أي شحنة أو طلب بهذا الرقم.' };
    }

    // Perform strict ownership verification
    const uUid = authUser.uid.toLowerCase();
    const uAcc = (authUser.linkedAccId || '').toLowerCase();
    const uEmail = (authUser.email || '').toLowerCase();
    const uPhone = (authUser.phone || '').trim();
    const uName = (authUser.fullName || '').trim().toLowerCase();

    const oCustUid = (order.customerUid || '').toLowerCase();
    const oCustId = (order.customerId || '').toLowerCase();
    const oPhone = (order.customerPhone || '').trim();
    const oName = (order.customerName || '').trim().toLowerCase();

    const isMatched =
      (oCustUid && (oCustUid === uUid || oCustUid === uAcc)) ||
      (oCustId && (oCustId === uAcc || oCustId === uUid)) ||
      (uEmail && order.notes?.toLowerCase().includes(uEmail)) ||
      (uPhone && oPhone && (uPhone === oPhone || uPhone.endsWith(oPhone.slice(-7)))) ||
      (uName && oName && (uName.includes(oName) || oName.includes(uName)));

    if (!isMatched) {
      return {
        order: null,
        shipment: null,
        isOwner: false,
        message: 'تقييد الوصول وحماية الخصوصية: هذا الطلب غير مرتبط بحسابك المسجل.'
      };
    }

    const shipments = await ordersGateway.getOrderShipments(order.id);
    const shipment = shipments.length > 0 ? shipments[0] : null;

    return {
      order,
      shipment,
      isOwner: true,
    };
  }
}

export const trackingGateway = new SupabaseTrackingGateway();
