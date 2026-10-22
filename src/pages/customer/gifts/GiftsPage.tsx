/**
 * GiftsPage.tsx — قسم «الهدايا والمسابقات» في بوابة العميل (P11).
 * Customer portal "Gifts & Competitions" section (P11).
 *
 * الفصل الصارم للأدوار: هذه الواجهة تعرض بيانات الميزات فقط وتُرسل نوايا العميل (مشاركة/مطالبة).
 * Strict separation: this UI only displays feature data and submits customer intents (join / claim).
 * كل قرارات الأهلية والفوز والخصم وتواريخ الانتهاء تُتّخذ خادميًا في alx_api؛ الواجهة لا تحسب شيئًا.
 * All eligibility/win/discount/expiry decisions are made server-side in alx_api; the UI computes nothing.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  Gift,
  Trophy,
  TicketPercent,
  RefreshCw,
  CalendarClock,
  MapPin,
  Phone,
  ListChecks,
} from "lucide-react";
import { usePortalTheme } from "../../../context/PortalThemeContext";
import { portalAuthGateway } from "../../../api/portalAuthGateway";
import type {
  PortalFeatureContestDto,
  PortalFeatureContestDetailDto,
  PortalFeatureAwardDto,
  PortalFeatureCouponDto,
  PortalFeatureEntryDto,
} from "../../../api/portalAuthGateway";

type GiftsTab = "competitions" | "myEntries" | "awards" | "coupons";

/** ينسج رمز خطأ الخادم الآمن إلى رسالة مفهومة، مع الحفاظ على الرمز كنص احتياطي.
 *  Maps the server's safe error code to a friendly message, keeping the code as a fallback. */
function errorMessage(
  code: string,
  label: (ar: string, en: string) => string
): string {
  switch (code) {
    case "CONTEST_ENTRY_NOT_ALLOWED":
      return label(
        "المسابقة غير متاحة أو تمت المشاركة مسبقًا.",
        "Contest unavailable or you already entered."
      );
    case "PORTAL_CUSTOMER_SCOPE_REQUIRED":
      return label(
        "الحساب غير مرتبط بعميل.",
        "Account is not linked to a customer."
      );
    case "WINNER_AWARD_NOT_OWNED":
    case "INVALID_AWARD_TRANSITION":
      return label(
        "لا يمكن المطالبة بهذه الجائزة الآن.",
        "This award cannot be claimed right now."
      );
    case "PORTAL_API_NOT_CONFIGURED":
      return label("واجهة البرمجة غير مُهيّأة.", "API not configured.");
    default:
      return code || label("حدث خطأ غير متوقع.", "Unexpected error.");
  }
}

/** تنسيق تاريخ مختار حسب الاتجاه؛ null عند غياب القيمة.
 *  Direction-aware short date; null renders a dash. */
function fmtDate(ms: number | null, isRtl: boolean): string {
  if (ms === null || !Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleDateString(isRtl ? "ar-EG" : "en-GB");
}

export default function GiftsPage() {
  const { isRtl } = usePortalTheme();
  const label = (ar: string, en: string) => (isRtl ? ar : en);

  const [tab, setTab] = useState<GiftsTab>("competitions");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [contests, setContests] = useState<PortalFeatureContestDto[]>([]);
  const [entries, setEntries] = useState<PortalFeatureEntryDto[]>([]);
  const [awards, setAwards] = useState<PortalFeatureAwardDto[]>([]);
  const [coupons, setCoupons] = useState<PortalFeatureCouponDto[]>([]);

  // تفاصيل المسابقة المفتوحة حاليًا + حالة الانشغال لكل إجراء (مشاركة/مطالبة).
  // Currently expanded contest detail + per-action busy flags (join / claim).
  const [detail, setDetail] = useState<PortalFeatureContestDetailDto | null>(
    null
  );
  const [detailContestId, setDetailContestId] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [joining, setJoining] = useState(false);
  const [claimAwardId, setClaimAwardId] = useState("");
  const [claimAddress, setClaimAddress] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claiming, setClaiming] = useState(false);

  // تحميل قائمة التبويب النشط فقط — الخادم يرسل مجموعة مسطّحة جاهزة للعرض.
  // Load only the active tab's list — the server returns a flat, display-ready collection.
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (!portalAuthGateway) {
      setContests([]);
      setEntries([]);
      setAwards([]);
      setCoupons([]);
      setLoading(false);
      return;
    }
    try {
      if (tab === "competitions")
        setContests(await portalAuthGateway.listFeatureContests());
      else if (tab === "myEntries")
        setEntries(await portalAuthGateway.listMyFeatureEntries());
      else if (tab === "awards")
        setAwards(await portalAuthGateway.listMyFeatureAwards());
      else setCoupons(await portalAuthGateway.listMyFeatureCoupons());
    } catch (err: any) {
      setError(errorMessage(String(err?.message ?? ""), label));
    } finally {
      setLoading(false);
    }
  }, [tab, isRtl]);

  useEffect(() => {
    void load();
  }, [load]);

  const openContest = async (contestId: string) => {
    if (!portalAuthGateway) return;
    setError("");
    if (detailContestId === contestId) {
      setDetail(null);
      setDetailContestId("");
      return;
    }
    setDetailContestId(contestId);
    setDetail(null);
    setTermsAccepted(false);
    setDetailLoading(true);
    try {
      setDetail(await portalAuthGateway.getFeatureContest(contestId));
    } catch (err: any) {
      setError(errorMessage(String(err?.message ?? ""), label));
      setDetailContestId("");
    } finally {
      setDetailLoading(false);
    }
  };

  // المشاركة: تُرسل النية فقط (قبول الشروط)؛ الأهلية والتسجيل يقرّرهما الخادم ضمن معاملة.
  // Join sends only the intent (terms accepted); eligibility and enrollment are decided server-side.
  const joinContest = async () => {
    if (!portalAuthGateway || !detailContestId) return;
    if (!termsAccepted) {
      setError(
        label(
          "يجب قبول شروط المسابقة أولًا.",
          "You must accept the contest terms first."
        )
      );
      return;
    }
    setJoining(true);
    setError("");
    try {
      await portalAuthGateway.joinFeatureContest(
        detailContestId,
        crypto.randomUUID()
      );
      setDetail(await portalAuthGateway.getFeatureContest(detailContestId));
      setTermsAccepted(false);
    } catch (err: any) {
      setError(errorMessage(String(err?.message ?? ""), label));
    } finally {
      setJoining(false);
    }
  };

  const startClaim = (award: PortalFeatureAwardDto) => {
    setClaimAwardId(award.awardId);
    setClaimAddress("");
    setClaimPhone("");
    setError("");
  };

  // المطالبة بالجائزة: العميل يقدّم بيانات التواصل فقط؛ الحالة والمهلة يتحقق منهما الخادم.
  // Claiming supplies only contact details; the server validates status and the claim deadline.
  const submitClaim = async () => {
    if (!portalAuthGateway || !claimAwardId) return;
    setClaiming(true);
    setError("");
    try {
      await portalAuthGateway.claimFeatureAward(claimAwardId, {
        ...(claimAddress.trim() ? { claimAddress: claimAddress.trim() } : {}),
        ...(claimPhone.trim() ? { claimPhone: claimPhone.trim() } : {}),
      });
      setClaimAwardId("");
      setAwards(await portalAuthGateway.listMyFeatureAwards());
    } catch (err: any) {
      setError(errorMessage(String(err?.message ?? ""), label));
    } finally {
      setClaiming(false);
    }
  };

  // نص الخصم للكوبون — يُعرض فقط؛ لا يُحسب أي مبلغ في المتصفح.
  // Coupon discount label — display only; no amount is computed in the browser.
  const couponDiscountLabel = (c: PortalFeatureCouponDto): string =>
    c.discountType === "percent"
      ? `${c.percent}%`
      : `${c.amount.toLocaleString()} ${c.currencyCode}`;

  const tabs: Array<{ id: GiftsTab; label: string; icon: React.ReactNode }> = [
    {
      id: "competitions",
      label: label("المسابقات", "Competitions"),
      icon: <Trophy size={15} />,
    },
    {
      // §11.2: تبويب "مشاركاتي" — سجل مشاركات العميل (قراءة فقط من الخادم).
      // §11.2: "My Entries" tab — the customer's participation log (server read-only).
      id: "myEntries",
      label: label("مشاركاتي", "My Entries"),
      icon: <ListChecks size={15} />,
    },
    {
      id: "awards",
      label: label("جوائزَي", "My Awards"),
      icon: <Gift size={15} />,
    },
    {
      id: "coupons",
      label: label("كوبوناتي", "My Coupons"),
      icon: <TicketPercent size={15} />,
    },
  ];

  const claimable = (status: string) =>
    status === "assigned" || status === "notified";

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* شريط التبويبات */}
      <div
        className="glass-card"
        style={{
          padding: "0.4rem",
          display: "flex",
          gap: "0.4rem",
          flexWrap: "wrap",
        }}
      >
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            className={`btn btn-sm ${tab === t.id ? "btn-gold" : "btn-ghost"}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
        <button
          className="btn btn-ghost btn-sm"
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
          onClick={() => void load()}
        >
          <RefreshCw size={14} /> {label("تحديث", "Refresh")}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state">
          <div className="spinner spinner-lg" />
        </div>
      ) : tab === "competitions" ? (
        contests.length === 0 ? (
          <div className="empty-state">
            <Trophy size={30} />
            <p>
              {label(
                "لا توجد مسابقات متاحة حاليًا.",
                "No competitions available right now."
              )}
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
          >
            {contests.map(c => (
              <div
                key={c.contestId}
                className="section-card"
                style={{ padding: "1rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <h4
                      style={{
                        margin: "0 0 0.25rem",
                        fontSize: "0.95rem",
                        fontWeight: 900,
                        color: "var(--gold)",
                      }}
                    >
                      {c.title}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {c.description || "—"}
                    </p>
                  </div>
                  <span
                    className="badge badge-gold"
                    style={{ fontSize: "0.68rem", whiteSpace: "nowrap" }}
                  >
                    {c.status}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    flexWrap: "wrap",
                    marginTop: "0.6rem",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <CalendarClock size={12} /> {label("تنتهي", "Ends")}:{" "}
                    {fmtDate(c.endsAt, isRtl)}
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => void openContest(c.contestId)}
                  >
                    {detailContestId === c.contestId
                      ? label("إخفاء التفاصيل", "Hide Details")
                      : label("التفاصيل", "Details")}
                  </button>
                </div>

                {detailContestId === c.contestId && (
                  <div
                    style={{
                      marginTop: "0.85rem",
                      paddingTop: "0.85rem",
                      borderTop: "1px solid var(--bg-border)",
                    }}
                  >
                    {detailLoading ? (
                      <div className="spinner" />
                    ) : detail ? (
                      <>
                        <div
                          style={{ fontSize: "0.8rem", marginBottom: "0.6rem" }}
                        >
                          <strong style={{ color: "var(--gold)" }}>
                            {label("الجوائز: ", "Prizes: ")}
                          </strong>
                          {detail.prizes.length
                            ? detail.prizes
                                .map(p => `${p.name} (${p.prizeType})`)
                                .join("، ")
                            : label("غير محددة", "Not specified")}
                        </div>
                        {detail.hasEntered ? (
                          <span
                            className="badge status-delivered"
                            style={{ fontSize: "0.72rem" }}
                          >
                            {label("تمت المشاركة ✓", "Entered ✓")}
                          </span>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.6rem",
                            }}
                          >
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={e =>
                                  setTermsAccepted(e.target.checked)
                                }
                                style={{ accentColor: "var(--gold)" }}
                              />
                              {label(
                                `أوافق على الشروط (الإصدار ${detail.contest.termsVersion})`,
                                `I accept the terms (v${detail.contest.termsVersion})`
                              )}
                            </label>
                            <button
                              className="btn btn-gold btn-sm"
                              onClick={() => void joinContest()}
                              disabled={joining || !termsAccepted}
                            >
                              {joining ? (
                                <div className="spinner" />
                              ) : (
                                <Trophy size={14} />
                              )}
                              {label("المشاركة الآن", "Enter Now")}
                            </button>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : tab === "myEntries" ? (
        entries.length === 0 ? (
          <div className="empty-state">
            <ListChecks size={30} />
            <p>
              {label(
                "لم تشارك في أي مسابقة بعد.",
                "You have not joined any competition yet."
              )}
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
          >
            {entries.map(e => (
              <div
                key={e.entryId}
                className="section-card"
                style={{ padding: "1rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <h4
                      style={{
                        margin: "0 0 0.25rem",
                        fontSize: "0.95rem",
                        fontWeight: 900,
                        color: "var(--gold)",
                      }}
                    >
                      {e.contestTitle || "—"}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {label("تاريخ المشاركة: ", "Joined: ")}
                      {fmtDate(e.createdAt, isRtl)}
                      {" · "}
                      {label("إصدار الشروط: ", "Terms v")}
                      {e.termsVersion}
                    </p>
                  </div>
                  <span
                    className={`badge ${e.status === "winner" ? "status-delivered" : e.status === "disqualified" || e.status === "ineligible" ? "status-cancelled" : "status-in_progress"}`}
                    style={{ fontSize: "0.7rem" }}
                  >
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === "awards" ? (
        awards.length === 0 ? (
          <div className="empty-state">
            <Gift size={30} />
            <p>
              {label(
                "لم تفُز بأي جائزة بعد. شارك في المسابقات!",
                "No awards yet. Join a competition!"
              )}
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
          >
            {awards.map(a => (
              <div
                key={a.awardId}
                className="section-card"
                style={{ padding: "1rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <h4
                      style={{
                        margin: "0 0 0.25rem",
                        fontSize: "0.95rem",
                        fontWeight: 900,
                        color: "var(--gold)",
                      }}
                    >
                      {a.prizeName || "—"}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {a.contestTitle || "—"}
                    </p>
                  </div>
                  <span
                    className={`badge status-${a.status === "delivered" ? "delivered" : a.status === "expired" || a.status === "rejected" ? "cancelled" : "in_progress"}`}
                    style={{ fontSize: "0.7rem" }}
                  >
                    {a.status}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginTop: "0.5rem",
                  }}
                >
                  {label("الموعد النهائي للمطالبة: ", "Claim deadline: ")}
                  {fmtDate(a.claimDeadline, isRtl)}
                </div>

                {claimAwardId === a.awardId ? (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      display: "grid",
                      gap: "0.6rem",
                    }}
                  >
                    <div className="form-group" style={{ margin: 0 }}>
                      <label
                        className="form-label"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <MapPin size={13} />{" "}
                        {label("عنوان التسليم", "Delivery Address")}
                      </label>
                      <input
                        className="form-input"
                        value={claimAddress}
                        onChange={e => setClaimAddress(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label
                        className="form-label"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <Phone size={13} /> {label("رقم الهاتف", "Phone")}
                      </label>
                      <input
                        className="form-input"
                        dir="ltr"
                        value={claimPhone}
                        onChange={e => setClaimPhone(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn btn-gold btn-sm"
                        onClick={() => void submitClaim()}
                        disabled={claiming}
                      >
                        {claiming ? (
                          <div className="spinner" />
                        ) : (
                          <Gift size={14} />
                        )}{" "}
                        {label("تأكيد المطالبة", "Confirm Claim")}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setClaimAwardId("")}
                        disabled={claiming}
                      >
                        {label("إلغاء", "Cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  claimable(a.status) && (
                    <button
                      className="btn btn-gold btn-sm"
                      style={{ marginTop: "0.6rem" }}
                      onClick={() => startClaim(a)}
                    >
                      <Gift size={14} />{" "}
                      {label("المطالبة بالجائزة", "Claim Award")}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )
      ) : coupons.length === 0 ? (
        <div className="empty-state">
          <TicketPercent size={30} />
          <p>
            {label("لا توجد كوبونات لديك بعد.", "You have no coupons yet.")}
          </p>
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
        >
          {coupons.map(c => (
            <div
              key={c.issuanceId}
              className="section-card"
              style={{
                padding: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: "1rem",
                    color: "var(--gold)",
                    direction: "ltr",
                  }}
                >
                  {c.issuedCode || c.code}
                </div>
                <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                  {label("الخصم: ", "Discount: ")}
                  <strong>{couponDiscountLabel(c)}</strong>
                  {c.minimumProductsSubtotal > 0 && (
                    <span style={{ color: "var(--text-muted)" }}>
                      {" · "}
                      {label(
                        `حد أدنى ${c.minimumProductsSubtotal.toLocaleString()} ${c.currencyCode}`,
                        `min ${c.minimumProductsSubtotal.toLocaleString()} ${c.currencyCode}`
                      )}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "0.25rem",
                  }}
                >
                  {label("تنتهي: ", "Expires: ")}
                  {fmtDate(c.expiresAt, isRtl)}
                </div>
              </div>
              <span
                className={`badge ${c.status === "issued" ? "status-delivered" : c.status === "redeemed" ? "status-in_progress" : "status-cancelled"}`}
                style={{ fontSize: "0.7rem" }}
              >
                {c.status}
              </span>
            </div>
          ))}
          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            {label(
              "استخدم رمز الكوبون في خطوة «كوبون الخصم» عند إنشاء طلب جديد؛ يتحقّق الخادم منه ويحسب الخصم.",
              "Use the coupon code in the «Discount Coupon» step when creating an order; the server validates it and computes the discount."
            )}
          </p>
        </div>
      )}
    </div>
  );
}
