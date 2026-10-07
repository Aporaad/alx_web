import { describe, expect, it } from "vitest";
import type { PortalOrderDto } from "../api/portalAuthGateway";
import type { PortalAnnouncementDto } from "../contracts/portal.contracts";
import { searchPortalResources } from "./globalSearch";

function makeOrder(
  id: string,
  values: Record<string, unknown> = {},
): PortalOrderDto {
  return {
    id,
    orderNumber: `ORD-${id}`,
    trackingNumber: `TRK-${id}`,
    status: "pending",
    orderStatus: "pending",
    createdAt: 1,
    ...values,
  };
}

function makeAnnouncement(id: string, title: string): PortalAnnouncementDto {
  return {
    id,
    title,
    content: "Announcement details",
    priority: "normal",
    createdAt: 1,
  };
}

describe("searchPortalResources", () => {
  it("matches only customer order fields and announcement titles", () => {
    const results = searchPortalResources(
      "  RECIPIENT  ",
      [
        makeOrder("1", {
          recipientName: "Recipient One",
          goodsDescription: "Shoes",
        }),
      ],
      [makeAnnouncement("1", "Recipient service update")],
    );

    expect(results).toEqual([
      {
        id: "order:1",
        type: "order",
        title: "TRK-1",
        subtitle: "Recipient One",
      },
      {
        id: "announcement:1",
        type: "announcement",
        title: "Recipient service update",
        subtitle: "Announcement details",
      },
    ]);
  });

  it("limits results to five orders and three announcements", () => {
    const orders = Array.from({ length: 7 }, (_, index) =>
      makeOrder(String(index), { goodsDescription: "matching item" }),
    );
    const announcements = Array.from({ length: 5 }, (_, index) =>
      makeAnnouncement(String(index), `matching notice ${index}`),
    );

    const results = searchPortalResources("matching", orders, announcements);

    expect(results.filter((result) => result.type === "order")).toHaveLength(5);
    expect(
      results.filter((result) => result.type === "announcement"),
    ).toHaveLength(3);
  });

  it("returns no results for a query shorter than two characters", () => {
    expect(
      searchPortalResources(
        "x",
        [makeOrder("1")],
        [makeAnnouncement("1", "x")],
      ),
    ).toEqual([]);
  });
});
