import type { PortalOrder, ShipmentDto } from '../../types/portalTypes';

export interface SecuredTrackingResult {
  order: PortalOrder | null;
  shipment: ShipmentDto | null;
  isOwner: boolean;
  message?: string;
}

export interface PortalTrackingGateway {
  trackOrderSecured(
    searchQuery: string,
    authUser: { uid: string; email?: string; phone?: string; linkedAccId?: string; fullName?: string }
  ): Promise<SecuredTrackingResult>;
}
