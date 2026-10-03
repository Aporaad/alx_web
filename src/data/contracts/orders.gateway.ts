import type { PortalOrder, OrderItemDto, ShipmentDto } from '../../types/portalTypes';

export interface GetOrdersParams {
  customerUid?: string;
  customerId?: string;
  courierId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateOrderInput {
  customerUid: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  deliveryCity: string;
  packageType: string;
  weightKg?: number;
  cbmVolume?: number;
  goodsDescription: string;
  estimatedCost: number;
  currency?: string;
  attachments?: string[];
  notes?: string;
}

export interface PortalOrdersGateway {
  getMyOrders(params: GetOrdersParams): Promise<PortalOrder[]>;
  getOrderById(orderId: string): Promise<PortalOrder | null>;
  getOrderByTrackingNumber(trackingNumber: string): Promise<PortalOrder | null>;
  getOrderItems(orderId: string): Promise<OrderItemDto[]>;
  getOrderShipments(orderId: string): Promise<ShipmentDto[]>;
  createNewOrder(input: CreateOrderInput): Promise<PortalOrder>;
  cancelOrder(orderId: string, reason?: string): Promise<void>;
}
