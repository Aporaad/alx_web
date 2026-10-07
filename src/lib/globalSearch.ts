import type { PortalAnnouncementDto } from "../contracts/portal.contracts";
import type { PortalOrderDto } from "../api/portalAuthGateway";

export interface PortalSearchResult {
  id: string;
  type: "order" | "announcement";
  title: string;
  subtitle?: string;
}

function stringField(order: PortalOrderDto, key: string): string {
  const value = order[key];
  return typeof value === "string" ? value : "";
}

function containsQuery(value: string, query: string): boolean {
  return value.toLocaleLowerCase().includes(query);
}

export function searchPortalResources(
  rawQuery: string,
  orders: readonly PortalOrderDto[],
  announcements: readonly PortalAnnouncementDto[],
): PortalSearchResult[] {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (query.length < 2) return [];

  const orderResults = orders
    .filter((order) =>
      [
        order.trackingNumber,
        order.orderNumber,
        stringField(order, "recipientName"),
        stringField(order, "goodsDescription"),
      ].some((value) => containsQuery(value, query)),
    )
    .slice(0, 5)
    .map((order): PortalSearchResult => {
      const recipientName = stringField(order, "recipientName");
      const goodsDescription = stringField(order, "goodsDescription");
      const subtitle = recipientName || goodsDescription;
      return {
        id: `order:${order.id}`,
        type: "order",
        title: order.trackingNumber || order.orderNumber || order.id,
        ...(subtitle ? { subtitle } : {}),
      };
    });

  const announcementResults = announcements
    .filter((announcement) => containsQuery(announcement.title, query))
    .slice(0, 3)
    .map((announcement): PortalSearchResult => ({
      id: `announcement:${announcement.id}`,
      type: "announcement",
      title: announcement.title,
      subtitle:
        announcement.content.length > 60
          ? `${announcement.content.slice(0, 60)}...`
          : announcement.content,
    }));

  return [...orderResults, ...announcementResults];
}
