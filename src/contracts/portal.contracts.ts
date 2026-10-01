import type { ApprovalStatus, PortalRole } from '../types/portalTypes';

/** Public tracking data. Deliberately excludes names, phones, addresses and balances. */
export interface PublicTrackingDto {
  trackingToken: string;
  status: string;
  events: ReadonlyArray<PublicTrackingEventDto>;
  updatedAt: number | null;
}

export interface PublicTrackingEventDto {
  status: string;
  occurredAt: number | null;
}

/** Session projection safe for portal UI; never includes passwords or auth tokens. */
export interface PortalUserSessionDto {
  userId: string;
  role: PortalRole;
  approvalStatus: ApprovalStatus;
  expiresAt: number | null;
  lastSeenAt: number | null;
}

export interface PublicTrackingQuery {
  trackingToken: string;
}

export type PortalApiErrorCode =
  | 'PORTAL_API_UNAVAILABLE'
  | 'PORTAL_AUTH_REQUIRED'
  | 'PUBLIC_TRACKING_NOT_FOUND'
  | 'PUBLIC_TRACKING_INVALID';
