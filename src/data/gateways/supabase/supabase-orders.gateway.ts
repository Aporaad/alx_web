import { supabase, getPrimaryKeyColumn, extractRows, extractRow } from '../../../lib/supabase';
import type { PortalOrdersGateway, GetOrdersParams, CreateOrderInput } from '../../contracts/orders.gateway';
import type { PortalOrder, OrderItemDto, ShipmentDto } from '../../../types/portalTypes';
import { mapOrderRowToDto, mapOrderItemRowToDto, mapShipmentRowToDto } from '../../dtos/mappers/order.mapper';

export class SupabaseOrdersGateway implements PortalOrdersGateway {
  async getMyOrders(params: GetOrdersParams): Promise<PortalOrder[]> {
    try {
      let query = supabase.from('orders').select('*');

      if (params.customerUid) {
        query = query.or(`created_by.eq.${params.customerUid},customer_id.eq.${params.customerUid}`);
      } else if (params.customerId) {
        query = query.eq('customer_id', params.customerId);
      } else if (params.courierId) {
        query = query.or(`delivery_courier_id.eq.${params.courierId},shipping_courier_id.eq.${params.courierId}`);
      }

      if (params.status) {
        query = query.or(`order_status1.eq.${params.status},order_status_id.eq.${params.status}`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.warn('[SupabaseOrdersGateway] getMyOrders error:', error.message);
        // Fallback to portal_orders if table is missing or empty
        const fallback = await supabase.from('portal_orders').select('*').order('created_at', { ascending: false });
        return (fallback.data || []).map(mapOrderRowToDto);
      }

      return (data || []).map(mapOrderRowToDto);
    } catch (err) {
      console.error('[SupabaseOrdersGateway] getMyOrders exception:', err);
      return [];
    }
  }

  async getOrderById(orderId: string): Promise<PortalOrder | null> {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('order_id', orderId).maybeSingle();
      if (error || !data) {
        const fallback = await supabase.from('portal_orders').select('*').eq('order_id', orderId).maybeSingle();
        if (fallback.data) return mapOrderRowToDto(fallback.data);
        return null;
      }
      return mapOrderRowToDto(data);
    } catch (_) {
      return null;
    }
  }

  async getOrderByTrackingNumber(trackingNumber: string): Promise<PortalOrder | null> {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('tracking_number', trackingNumber).maybeSingle();
      if (error || !data) {
        const fallback = await supabase.from('portal_orders').select('*').eq('tracking_number', trackingNumber).maybeSingle();
        if (fallback.data) return mapOrderRowToDto(fallback.data);
        return null;
      }
      return mapOrderRowToDto(data);
    } catch (_) {
      return null;
    }
  }

  async getOrderItems(orderId: string): Promise<OrderItemDto[]> {
    try {
      const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
      if (error || !data) return [];
      return data.map(mapOrderItemRowToDto);
    } catch (_) {
      return [];
    }
  }

  async getOrderShipments(orderId: string): Promise<ShipmentDto[]> {
    try {
      const { data, error } = await supabase.from('shipments').select('*').eq('order_id', orderId);
      if (error || !data) return [];
      return data.map(mapShipmentRowToDto);
    } catch (_) {
      return [];
    }
  }

  async createNewOrder(input: CreateOrderInput): Promise<PortalOrder> {
    const now = Date.now();
    const orderSeq = Math.floor(100000 + Math.random() * 900000);
    const orderId = `ord_${now}_${orderSeq}`;
    const trackingNumber = `ALX-${orderSeq}`;

    const orderRow = {
      order_id: orderId,
      order_number: `ORD-${orderSeq}`,
      tracking_number: trackingNumber,
      customer_id: input.customerId || input.customerUid,
      created_by: input.customerUid,
      created_by_name: input.customerName,
      order_status1: 'pending_review',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      data: {
        id: orderId,
        trackingNumber,
        customerUid: input.customerUid,
        customerId: input.customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        recipientAddress: input.recipientAddress,
        deliveryCity: input.deliveryCity,
        packageType: input.packageType,
        weightKg: input.weightKg,
        cbmVolume: input.cbmVolume,
        goodsDescription: input.goodsDescription,
        estimatedCost: input.estimatedCost,
        currency: input.currency || 'YER',
        status: 'pending_review',
        source: 'web_portal',
        attachments: input.attachments || [],
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      },
    };

    const { error } = await supabase.from('orders').insert(orderRow);
    if (error) {
      console.warn('[SupabaseOrdersGateway] insert to orders failed, writing to portal_orders:', error.message);
      await supabase.from('portal_orders').upsert({ order_id: orderId, id: orderId, data: orderRow.data });
    }

    return mapOrderRowToDto(orderRow);
  }

  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from('orders')
      .update({ order_status1: 'cancelled', updated_at: updatedAt })
      .eq('order_id', orderId);

    if (error) {
      console.warn('[SupabaseOrdersGateway] cancelOrder error on orders, updating portal_orders:', error.message);
      const existing = await this.getOrderById(orderId);
      if (existing) {
        const updatedData = { ...existing, status: 'cancelled', notes: reason ? `إلغاء: ${reason}` : existing.notes, updatedAt: Date.now() };
        await supabase.from('portal_orders').update({ data: updatedData }).eq('order_id', orderId);
      }
    }
  }
}

export const ordersGateway = new SupabaseOrdersGateway();
