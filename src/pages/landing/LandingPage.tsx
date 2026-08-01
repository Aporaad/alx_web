import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Truck, Globe, Star, Phone, Mail, MessageCircle,
  ArrowLeft, ArrowRight, Search, MapPin, Clock, Shield, Zap,
  ChevronDown, Sun, Moon, CheckCircle, TrendingUp, Users, Award
} from 'lucide-react';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { supabase } from '../../lib/supabase';
import type { Announcement } from '../../types/portalTypes';

// ─── Track Modal ──────────────────────────────────────────────────────────────
function TrackModal({ trackingNum, onClose }: { trackingNum: string; onClose: () => void }) {
  const { tr, isRtl } = usePortalTheme();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const find = async () => {
      const { data } = await supabase
        .from('portal_orders')
        .select('*')
        .eq('tracking_number', trackingNum)
        .maybeSingle();
      if (data) setOrder(data);
      else setNotFound(true);
      setLoading(false);
    };
    find();
  }, [trackingNum]);

  const steps = [
    { key: 'pending_review',    label: isRtl ? 'استلام الطلب' : 'Order Received' },
    { key: 'accepted',          label: isRtl ? 'تم القبول' : 'Accepted' },
    { key: 'in_progress',       label: isRtl ? 'جاري التجهيز' : 'Processing' },
    { key: 'out_for_delivery',  label: isRtl ? 'خرج للتوصيل' : 'Out for Delivery' },
    { key: 'delivered',         label: isRtl ? 'تم التسليم' : 'Delivered' },
  ];

  const currentIdx = steps.findIndex(s => s.key === order?.status);

  return (
    <div className="modal-backdrop" onClick={onClose} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="modal-box animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="gold-line-top" />
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>
              {isRtl ? 'تتبع الشحنة' : 'Track Shipment'} — <span style={{ color: 'var(--gold)' }}>{trackingNum}</span>
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>

          {loading && <div className="empty-state"><div className="spinner spinner-lg" /></div>}

          {notFound && (
            <div className="alert alert-error">
              {isRtl ? 'رقم التتبع غير موجود. تأكد من الرقم وحاول مجدداً.' : 'Tracking number not found. Please verify and try again.'}
            </div>
          )}

          {order && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Timeline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {steps.map((step, i) => (
                  <React.Fragment key={step.key}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: i <= currentIdx ? 'var(--gold)' : 'var(--bg-border)',
                        border: `2px solid ${i <= currentIdx ? 'var(--gold)' : 'var(--bg-border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.3s'
                      }}>
                        {i <= currentIdx && <CheckCircle size={14} style={{ color: '#0a0a0a' }} />}
                      </div>
                      <span style={{ fontSize: '0.6rem', color: i <= currentIdx ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
                        {step.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: i < currentIdx ? 'var(--gold)' : 'var(--bg-border)', marginBottom: '1.2rem', transition: 'background 0.3s' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Details */}
              <div className="section-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>{isRtl ? 'المستلم' : 'Recipient'}:</span><div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{order.recipient_name}</div></div>
                <div><span style={{ color: 'var(--text-muted)' }}>{isRtl ? 'المدينة' : 'City'}:</span><div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{order.delivery_city}</div></div>
                <div><span style={{ color: 'var(--text-muted)' }}>{isRtl ? 'تاريخ الطلب' : 'Order Date'}:</span><div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{new Date(order.created_at).toLocaleDateString('en-GB')}</div></div>
                <div><span style={{ color: 'var(--text-muted)' }}>{isRtl ? 'المندوب' : 'Courier'}:</span><div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{order.courier_name || (isRtl ? 'لم يُحدد بعد' : 'Not yet assigned')}</div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Counter ────────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 25);
    return () => clearInterval(t);
  }, [target]);
  return <>{val.toLocaleString()}{suffix}</>;
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const { tr, lang, toggleLang, toggleTheme, theme, isRtl } = usePortalTheme();
  const [trackInput, setTrackInput] = useState('');
  const [trackingModal, setTrackingModal] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    supabase.from('announcements').select('*').eq('is_active', true).eq('target_audience', 'all').order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => setAnnouncements((data || []) as Announcement[]));
  }, []);

  const handleTrack = () => {
    if (trackInput.trim()) setTrackingModal(trackInput.trim());
  };

  const services = [
    { icon: '🚚', title: isRtl ? 'الشحن المحلي السريع' : 'Fast Local Delivery', desc: isRtl ? 'توصيل داخل المدينة خلال 24 ساعة بكفاءة عالية وضمان تام' : 'City-wide delivery within 24 hours with full guarantee' },
    { icon: '🌍', title: isRtl ? 'الشحن الدولي' : 'International Shipping', desc: isRtl ? 'شحنك إلى كل مكان في العالم بأسعار تنافسية' : 'We ship globally at competitive rates' },
    { icon: '🏭', title: isRtl ? 'توريد المصانع' : 'Factory Supply', desc: isRtl ? 'استيراد مباشر من المصانع بشحن CBM احترافي' : 'Direct factory imports with professional CBM shipping' },
    { icon: '📦', title: isRtl ? 'تغليف احترافي' : 'Professional Packaging', desc: isRtl ? 'تغليف متخصص لضمان سلامة بضائعك' : 'Specialized packaging to ensure goods safety' },
  ];

  const features = [
    { icon: <Shield size={22} style={{ color: 'var(--gold)' }} />, title: isRtl ? 'ضمان سلامة الشحنات' : 'Shipment Safety Guarantee' },
    { icon: <Clock size={22} style={{ color: '#34d399' }} />, title: isRtl ? 'التسليم في الوقت المحدد' : 'On-Time Delivery' },
    { icon: <Globe size={22} style={{ color: '#60a5fa' }} />, title: isRtl ? 'تغطية عالمية شاملة' : 'Global Coverage' },
    { icon: <Zap size={22} style={{ color: '#fb923c' }} />, title: isRtl ? 'تتبع لحظي ودقيق' : 'Real-Time Tracking' },
    { icon: <Star size={22} style={{ color: '#a78bfa' }} />, title: isRtl ? 'خدمة عملاء مميزة' : 'Premium Customer Service' },
    { icon: <TrendingUp size={22} style={{ color: '#f472b6' }} />, title: isRtl ? 'أسعار منافسة' : 'Competitive Rates' },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'var(--bg-root)', fontFamily: 'var(--font-main)' }}>
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212,175,55,0.12)',
        padding: '0 1.25rem'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: '1rem' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '0.6rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem'
            }}>📦</div>
            <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--gold)', letterSpacing: '-0.01em' }}>
              ALX <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Delivery</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginInlineStart: '1.5rem' }}>
            {['services','features','globalReach','contactUs'].map(key => (
              <a key={key} href={`#${key}`} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--text-primary)')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--text-secondary)')}>
                {tr(key as any)}
              </a>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={toggleTheme} title={tr(theme === 'dark' ? 'lightMode' : 'darkMode')}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={toggleLang} style={{ gap: '0.25rem', fontWeight: 700, fontSize: '0.72rem' }}>
              <Globe size={13} /> {lang === 'ar' ? 'EN' : 'ع'}
            </button>
            <Link to="/auth/login" className="btn btn-ghost btn-sm hide-mobile">{tr('login')}</Link>
            <Link to="/auth/register" className="btn btn-gold btn-sm">{tr('register')}</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '6rem 1.25rem 3rem',
        position: 'relative', overflow: 'hidden', textAlign: 'center'
      }}>
        {/* Ambient backgrounds */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="container animate-slide-up" style={{ maxWidth: 760, position: 'relative' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: '99px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '1.5rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.05em' }}>
              {isRtl ? 'منصة الشحن والتوصيل الأولى' : 'Premier Shipping & Delivery Platform'}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            <span className="gold-shimmer">{tr('heroTitle')}</span>
          </h1>

          <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            {tr('heroSubtitle')}
          </p>

          {/* Tracking Input */}
          <div style={{
            display: 'flex', gap: '0.5rem', maxWidth: 500, margin: '0 auto 2rem',
            background: 'rgba(13,13,15,0.8)', border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '0.85rem', padding: '0.4rem', backdropFilter: 'blur(8px)'
          }}>
            <input
              value={trackInput}
              onChange={e => setTrackInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTrack()}
              placeholder={tr('trackingPlaceholder')}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: '0.85rem', padding: '0.4rem 0.75rem',
                fontFamily: 'var(--font-main)'
              }}
            />
            <button className="btn btn-gold" onClick={handleTrack} style={{ gap: '0.4rem', flexShrink: 0 }}>
              <Search size={14} /> {tr('trackNow')}
            </button>
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth/register" className="btn btn-gold btn-lg" style={{ gap: '0.5rem' }}>
              {tr('startNow')}
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
            <a href="#services" className="btn btn-outline btn-lg">
              {tr('services')} <ChevronDown size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Section ────────────────────────────────────────────────── */}
      <section style={{ padding: '3rem 1.25rem', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
          {[
            { icon: <Package size={22} />, value: 15000, suffix: '+', label: isRtl ? 'شحنة تم توصيلها' : 'Shipments Delivered' },
            { icon: <Users size={22} />, value: 3200, suffix: '+', label: isRtl ? 'عميل راضٍ' : 'Happy Customers' },
            { icon: <Globe size={22} />, value: 24, suffix: '', label: isRtl ? 'دولة نغطيها' : 'Countries Covered' },
            { icon: <Award size={22} />, value: 98, suffix: '%', label: isRtl ? 'نسبة الرضا' : 'Satisfaction Rate' },
          ].map((stat, i) => (
            <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: 'var(--gold)' }}>{stat.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services Section ──────────────────────────────────────────────── */}
      <section id="services" style={{ padding: '4rem 1.25rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 900, marginBottom: '0.6rem' }}>
              {tr('services')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {isRtl ? 'حلول شحن متكاملة لكل احتياجاتك اللوجستية' : 'Comprehensive shipping solutions for all your logistics needs'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {services.map((svc, i) => (
              <div key={i} className="glass-card animate-slide-up" style={{ padding: '1.5rem', animationDelay: `${i * 0.1}s` }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{svc.icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{svc.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '4rem 1.25rem', background: 'rgba(13,13,15,0.5)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 900, marginBottom: '0.6rem' }}>{tr('features')}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {features.map((feat, i) => (
              <div key={i} className="section-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center', padding: '1.5rem 1rem', transition: 'all 0.25s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)')}>
                <div style={{ width: 44, height: 44, background: 'var(--bg-input)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feat.icon}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{feat.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Announcements Section ─────────────────────────────────────────── */}
      {announcements.length > 0 && (
        <section style={{ padding: '4rem 1.25rem' }}>
          <div className="container">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem', textAlign: 'center' }}>{tr('announcements')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {announcements.map(ann => (
                <div key={ann.id} className="glass-card" style={{ padding: '1.25rem' }}>
                  {ann.priority === 'urgent' && (
                    <span className="badge badge-danger" style={{ marginBottom: '0.5rem' }}>
                      {isRtl ? 'عاجل' : 'Urgent'}
                    </span>
                  )}
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{ann.title}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Global Presence ───────────────────────────────────────────────── */}
      <section id="globalReach" style={{ padding: '4rem 1.25rem', background: 'rgba(13,13,15,0.5)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 900, marginBottom: '0.75rem' }}>{tr('globalReach')}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            {isRtl ? 'نتواجد في أكثر من 24 دولة حول العالم بشبكة موثوقة من الشركاء اللوجستيين' : 'Present in over 24 countries with a trusted network of logistics partners'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            {['🇾🇪 اليمن', '🇸🇦 السعودية', '🇦🇪 الإمارات', '🇶🇦 قطر', '🇴🇲 عُمان', '🇰🇼 الكويت', '🇨🇳 الصين', '🇹🇷 تركيا', '🇮🇳 الهند', '🇩🇪 ألمانيا', '🇺🇸 أمريكا', '🇬🇧 بريطانيا'].map(country => (
              <span key={country} style={{
                padding: '0.5rem 1rem', borderRadius: '99px',
                background: 'rgba(212,175,55,0.05)',
                border: '1px solid rgba(212,175,55,0.15)',
                fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600
              }}>{country}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Section ───────────────────────────────────────────────── */}
      <section id="contactUs" style={{ padding: '4rem 1.25rem' }}>
        <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 900, marginBottom: '0.75rem' }}>{tr('contactUs')}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            {isRtl ? 'فريقنا في خدمتك على مدار الساعة' : 'Our team is at your service around the clock'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="tel:785557070" className="btn btn-gold btn-lg" style={{ gap: '0.5rem' }}>
              <Phone size={16} /> 785557070
            </a>
            <a href="https://wa.me/967785557070" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg" style={{ gap: '0.5rem', color: '#25D366', borderColor: '#25D366' }}>
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a href="mailto:alxdelivery777@gmail.com" className="btn btn-ghost btn-lg" style={{ gap: '0.5rem' }}>
              <Mail size={16} /> Email
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section style={{ padding: '3rem 1.25rem', background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.02))' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)', fontWeight: 900, marginBottom: '0.75rem' }}>
            {isRtl ? 'هل أنت جاهز للبدء؟' : 'Ready to get started?'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {isRtl ? 'سجّل حسابك الآن وابدأ في تتبع شحناتك وإدارة طلباتك بكل سهولة' : 'Register now and start tracking your shipments and managing your orders easily'}
          </p>
          <Link to="/auth/register" className="btn btn-gold btn-lg" style={{ gap: '0.5rem' }}>
            {tr('register')} {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--bg-border)', padding: '2rem 1.25rem' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📦</span>
              <span style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '0.95rem' }}>ALX Delivery</span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <a href="#" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{tr('privacyPolicy')}</a>
              <a href="#" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{tr('termsOfService')}</a>
              <Link to="/auth/login" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{tr('login')}</Link>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} ALX Delivery. {tr('allRightsReserved')}
            </p>
          </div>
        </div>
      </footer>

      {/* Tracking Modal */}
      {trackingModal && (
        <TrackModal trackingNum={trackingModal} onClose={() => setTrackingModal(null)} />
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
