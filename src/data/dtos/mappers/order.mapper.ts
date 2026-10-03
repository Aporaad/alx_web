import type { PortalOrder, OrderItemDto, ShipmentDto, OrderStatus } from '../../../types/portalTypes';

/**
 * Maps raw PostgreSQL row from `orders` table (with optional jsonb data fallback) to PortalOrder DTO.
 */
export function mapOrderRowToDto(row: any): PortalOrder {
  if (!row) return {} as PortalOrder;

  const payload = typeof row.data === 'string'
    ? JSON.parse(row.data)
    : (row.data || {});

  const orderId = row.order_id || row.id || payload.id || payload.orderId || '';
  const orderNumber = row.order_number || payload.orderNumber || orderId;
  const trackingNumber = row.tracking_number || payload.trackingNumber || '';
  const customerUid = row.created_by || row.customer_uid || payload.customerUid || payload.uid || '';
  const customerId = row.customer_id || payload.customerId || '';

  const status: OrderStatus = (
    row.order_status1 ||
    row.order_status_id ||
    payload.status ||
    payload.orderStatus ||
    'pending_review'
  ) as OrderStatus;

  return {
    id: orderId,
    orderId,
    orderNumber,
    trackingNumber,
    customerUid,
    customerId,
    orderStatusId: row.order_status_id || payload.orderStatusId,
    orderStatus1: row.order_status1 || payload.orderStatus1,
    orderSourceId: row.order_source_id || payload.orderSourceId,
    deliveryCourierId: row.delivery_courier_id || payload.deliveryCourierId,
    shippingCourierId: row.shipping_courier_id || payload.shippingCourierId,
    customerName: payload.customerName || row.created_by_name || 'عميل البوابة',
    customerPhone: payload.customerPhone || '',
    recipientName: payload.recipientName || '',
    recipientPhone: payload.recipientPhone || '',
    recipientAddress: payload.recipientAddress || '',
    deliveryCity: payload.deliveryCity || 'صنعاء',
    packageType: payload.packageType || 'standard',
    weightKg: Number(payload.weightKg || row.weight || 0),
    cbmVolume: Number(payload.cbmVolume || 0),
    goodsDescription: payload.goodsDescription || row.notes || 'بضائع شحن',
    estimatedCost: Number(payload.estimatedCost || 0),
    currency: payload.currency || 'YER',
    status,
    source: 'web_portal',
    courierId: row.courier_id || payload.courierId,
    courierName: payload.courierName,
    attachments: payload.attachments || [],
    notes: payload.notes || row.notes,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : (payload.createdAt || Date.now()),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : (payload.updatedAt || Date.now()),
  };
}

/**
 * Maps raw PostgreSQL row from `order_items` table to OrderItemDto.
 */
export function mapOrderItemRowToDto(row: any): OrderItemDto {
  if (!row) return {} as OrderItemDto;
  return {
    orderItemId: row.order_item_id || row.id || '',
    orderId: row.order_id || '',
    productId: row.product_id || '',
    productPrice: Number(row.product_price || 0),
    productUrl: row.product_url || '',
    trackingNumber: row.tracking_number || '',
    productSourceId: row.produc_source_id || '',
    productSourceUrl: row.produc_source_url || '',
    productCooler: row.product_cooler || '',
    quantity: Number(row.quantity || 1),
    totalPrice: Number(row.total_price || 0),
    totalWeight: Number(row.total__weight || 0),
    totalCbm: Number(row.total_cbm || 0),
    packagingOptionId: row.packaging_option_id || '',
    packagingOptionPrice: Number(row.packaging_option_price || 0),
    isInsured: Boolean(row.is_insured),
    insuranceFee: Number(row.insurance_fee || 0),
    itemsStatus: row.items_status || '',
    createdAt: row.created_at || Date.now(),
    updatedAt: row.updated_at || Date.now(),
  };
}

/**
 * Maps raw PostgreSQL row from `shipments` table to ShipmentDto.
 */
export function mapShipmentRowToDto(row: any): ShipmentDto {
  if (!row) return {} as ShipmentDto;

  const payload = typeof row.data === 'string'
    ? JSON.parse(row.data)
    : (row.data || {});

  return {
    shipmentId: row.shipment_id || row.id || '',
    orderId: row.order_id || payload.orderId || '',
    trackingNumber: row.tracking_number || payload.trackingNumber || '',
    shippingCompanyId: row.shipping_company_id || payload.shippingCompanyId || '',
    courierId: row.courier_id || payload.courierId || '',
    shipmentStatus: row.shipment_status || payload.shipmentStatus || 'pending',
    shippingCost: Number(row.shipping_cost || payload.shippingCost || 0),
    weight: Number(row.weight || payload.weight || 0),
    shippingCategoryId: row.shipping_category_id || '',
    contentCategoryId: row.content_category_id || '',
    contentCategoryName: row.content_category_name || '',
    cartonCount: Number(row.carton_count || 0),
    customsFee: Number(row.customs_fee || 0),
    taxFee: Number(row.tax_fee || 0),
    otherCategoryFee: Number(row.other_category_fee || 0),
    categoryFeesTotal: Number(row.category_fees_total || 0),
    categoryFeeCurrency: row.category_fee_currency || 'YER',
    createdAt: row.created_at || payload.createdAt || Date.now(),
    updatedAt: row.updated_at || payload.updatedAt || Date.now(),
  };
}
