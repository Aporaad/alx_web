import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Truck, Globe, Star, Phone, Mail, MessageCircle,
  ArrowLeft, ArrowRight, MapPin, Clock, Shield, Zap,
  ChevronDown, Sun, Moon, CheckCircle, TrendingUp, Users, Award,
  Calculator, HelpCircle, ShieldCheck, FileText, ChevronUp, Sparkles, Box, Lock, PlusCircle
} from 'lucide-react';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { supabase } from '../../lib/supabase';
import type { Announcement } from '../../types/portalTypes';

import JobApplicationModal from '../public/JobApplicationModal';

// ─── Stats Counter Component ──────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.ceil(target / 50));
    const t = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(t);
      } else {
        setVal(start);
      }
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return <>{val.toLocaleString()}{suffix}</>;
}

// ─── Main Landing Page Component ──────────────────────────────────────────────
export default function LandingPage() {
  const { tr, lang, toggleLang, toggleTheme, theme, isRtl } = usePortalTheme();
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Interactive Calculator State
  const [calcServiceType, setCalcServiceType] = useState<'local' | 'express' | 'factory'>('local');
  const [calcWeight, setCalcWeight] = useState<number>(2);
  const [calcCbm, setCalcCbm] = useState<number>(0.5);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    supabase.from('announcements')
      .select('*')
      .eq('is_active', true)
      .eq('target_audience', 'all')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setAnnouncements((data || []) as Announcement[]));
  }, []);

  // Shipping Fee Estimator Calculation
  const estimatedCostResult = React.useMemo(() => {
    if (calcServiceType === 'local') {
      // Local Yemen delivery flat + weight
      const base = 4000;
      const weightFee = Math.max(0, calcWeight - 1) * 1000;
      return { yer: base + weightFee, usd: Math.round((base + weightFee) / 535) };
    } else if (calcServiceType === 'express') {
      // Int'l Air Express per KG in SAR converted to YER
      const sarRate = 390;
      const baseSar = calcWeight * 18 + 25; // 18 SAR per kg + express priority
      const yer = baseSar * sarRate;
      return { yer, usd: Math.round(yer / 535) };
    } else {
      // Factory CBM import
      const sarRate = 390;
      const cbmSar = calcCbm * 450; // 450 SAR per CBM
      const yer = cbmSar * sarRate;
      return { yer, usd: Math.round(yer / 535) };
    }
  }, [calcServiceType, calcWeight, calcCbm]);

  const services = [
    {
      icon: '🚚',
      title: isRtl ? 'الشحن المحلي السريع' : 'Fast Local Delivery',
      desc: isRtl ? 'توصيل داخل المدينة وتغطية كافة المحافظات خلال 24-48 ساعة بأعلى ضمان كفاءة' : 'City & governorate delivery within 24-48 hours with full guarantee',
      tag: isRtl ? 'توصيل محلي' : 'Local Delivery'
    },
    {
      icon: '✈️',
      title: isRtl ? 'الشحن الدولي الإكسبرس' : 'Intl Air Freight',
      desc: isRtl ? 'شحن جوي سريع لبضائعك من وإلى أكثر من 24 دولة بأسعار منافسة وتخليص دقيق' : 'Fast air cargo to/from 24+ countries with competitive rates & clearance',
      tag: isRtl ? 'شحن جوي' : 'Air Cargo'
    },
    {
      icon: '🏭',
      title: isRtl ? 'توريد المصانع (CBM)' : 'Factory CBM Sourcing',
      desc: isRtl ? 'استيراد وتوريد مباشر من المصانع العالمية وحساب الحجم بالتكعيب الاحترافي' : 'Direct factory imports with professional CBM volume measurement',
      tag: isRtl ? 'توريد مصانع' : 'Factory Direct'
    },
    {
      icon: '🔒',
      title: isRtl ? 'التتبع والتأمين الآمن' : 'Secured Portal Tracking',
      desc: isRtl ? 'تتبع لحظي مقيد بالملكية من بوابة العميل لضمان كامل السرية والخصوصية' : 'Real-time ownership-protected tracking from your private portal',
      tag: isRtl ? 'تتبع آمن' : 'Secure Tracking'
    },
  ];

  const features = [
    { icon: <Shield size={22} style={{ color: 'var(--gold)' }} />, title: isRtl ? 'ضمان سلامة الشحنات' : 'Shipment Safety Guarantee', desc: isRtl ? 'تأمين كامل ضد الضرر والأخطار' : 'Full insurance against damage' },
    { icon: <Clock size={22} style={{ color: '#34d399' }} />, title: isRtl ? 'التسليم في الوقت المحدد' : 'On-Time Delivery', desc: isRtl ? 'التزام تام بالمواعيد المحددة' : 'Strict deadline adherence' },
    { icon: <Globe size={22} style={{ color: '#60a5fa' }} />, title: isRtl ? 'تغطية عالمية شاملة' : 'Global Coverage', desc: isRtl ? 'شبكة متكاملة في 24+ دولة' : 'Integrated 24+ countries network' },
    { icon: <Zap size={22} style={{ color: '#fb923c' }} />, title: isRtl ? 'معالجة فورية للطلبات' : 'Instant Processing', desc: isRtl ? 'اعتماد الطلبات وتجهيزها آلياً' : 'Automated order processing' },
    { icon: <Star size={22} style={{ color: '#a78bfa' }} />, title: isRtl ? 'خدمة عملاء راقية' : 'Premium Customer Support', desc: isRtl ? 'دعم متواصل على مدار الساعة' : '24/7 dedicated support' },
    { icon: <TrendingUp size={22} style={{ color: '#f472b6' }} />, title: isRtl ? 'أسعار منافسة شفافة' : 'Competitive Transparent Rates', desc: isRtl ? 'بدون رسوم خفية أو إضافات' : 'No hidden fees or extras' },
  ];

  const howItWorksSteps = [
    { step: '01', title: tr('step1Title'), desc: tr('step1Desc'), icon: <Box size={20} /> },
    { step: '02', title: tr('step2Title'), desc: tr('step2Desc'), icon: <Package size={20} /> },
    { step: '03', title: tr('step3Title'), desc: tr('step3Desc'), icon: <Lock size={20} /> },
    { step: '04', title: tr('step4Title'), desc: tr('step4Desc'), icon: <Truck size={20} /> },
  ];

  const faqItems = [
    { q: tr('faq1Q'), a: tr('faq1A') },
    { q: tr('faq2Q'), a: tr('faq2A') },
    { q: tr('faq3Q'), a: tr('faq3A') },
    { q: tr('faq4Q'), a: tr('faq4A') },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'var(--bg-root)', fontFamily: 'var(--font-main)' }}>
      
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        padding: '0 1.25rem'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 68, gap: '1rem' }}>
          
          {/* Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.05))',
              border: '1px solid rgba(212,175,55,0.4)',
              borderRadius: '0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.35rem', boxShadow: '0 0 15px rgba(212,175,55,0.15)'
            }}>📦</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--gold)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                ALX <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Delivery</span>
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {isRtl ? 'منصة الشحن والتوصيل المتكاملة' : 'Global Shipping & Logistics'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginInlineStart: '2rem' }}>
            {[
              { id: 'services', label: tr('services') },
              { id: 'howItWorks', label: tr('howItWorks') },
              { id: 'calculator', label: isRtl ? 'حاسبة الشحن' : 'Estimator' },
              { id: 'features', label: tr('features') },
              { id: 'faq', label: tr('faqTitle') },
              { id: 'contactUs', label: tr('contactUs') },
            ].map(item => (
              <a key={item.id} href={`#${item.id}`} style={{
                padding: '0.45rem 0.85rem', borderRadius: '0.5rem',
                color: 'var(--text-secondary)', fontSize: '0.82rem',
                fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.color = 'var(--gold)';
                (e.target as HTMLElement).style.background = 'rgba(212,175,55,0.06)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.color = 'var(--text-secondary)';
                (e.target as HTMLElement).style.background = 'transparent';
              }}>
                {item.label}
              </a>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Actions & Portal Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-outline btn-sm hide-mobile" onClick={() => setIsJobModalOpen(true)} style={{ gap: '0.35rem', borderColor: 'rgba(212,175,55,0.4)', color: 'var(--gold)' }}>
              💼 {isRtl ? 'الوظائف' : 'Careers'}
            </button>

            <button className="btn btn-ghost btn-sm" onClick={toggleTheme} title={tr(theme === 'dark' ? 'lightMode' : 'darkMode')}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button className="btn btn-ghost btn-sm" onClick={toggleLang} style={{ gap: '0.25rem', fontWeight: 700, fontSize: '0.72rem' }}>
              <Globe size={13} /> {lang === 'ar' ? 'EN' : 'ع'}
            </button>

            <Link to="/auth/login" className="btn btn-ghost btn-sm" style={{ fontWeight: 700 }}>
              {tr('login')}
            </Link>

            <Link to="/auth/register" className="btn btn-gold btn-sm" style={{ fontWeight: 800 }}>
              {tr('register')}
            </Link>
          </div>

        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section style={{
        minHeight: '92vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '7rem 1.25rem 4rem',
        position: 'relative', overflow: 'hidden', textAlign: 'center'
      }}>
        {/* Glowing background ambience */}
        <div style={{
          position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
          width: '70vw', height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.02) 45%, transparent 70%)',
          pointerEvents: 'none', borderRadius: '50%'
        }} />

        <div className="container animate-slide-up" style={{ maxWidth: 840, position: 'relative', zIndex: 2 }}>
          
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.4rem 1.25rem', borderRadius: '99px',
            background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)',
            marginBottom: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.04em' }}>
              ✨ {isRtl ? 'المنصة اللوجستية المتكاملة للشحن والتوصيل' : 'Premier Integrated Logistics Platform'}
            </span>
          </div>

          {/* Hero Main Headline */}
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            <span className="gold-shimmer">{tr('heroTitle')}</span>
          </h1>

          <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.18rem)', color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            {tr('heroSubtitle')}
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <Link to="/auth/register" className="btn btn-gold btn-lg" style={{ gap: '0.6rem', padding: '0.85rem 2rem', fontSize: '0.95rem', boxShadow: '0 0 25px rgba(212,175,55,0.25)' }}>
              <Sparkles size={18} />
              {tr('startNow')}
              {isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
            </Link>

            <Link to="/auth/login" className="btn btn-outline btn-lg" style={{ gap: '0.5rem', padding: '0.85rem 1.75rem', fontSize: '0.95rem', borderColor: 'rgba(212,175,55,0.4)', color: 'var(--gold)' }}>
              <Lock size={16} />
              {isRtl ? 'تتبع شحنتك من حسابك' : 'Track In Your Portal'}
            </Link>

            <a href="#calculator" className="btn btn-ghost btn-lg" style={{ gap: '0.4rem', color: 'var(--text-secondary)' }}>
              <Calculator size={16} />
              {isRtl ? 'حاسبة التكلفة' : 'Cost Estimator'}
            </a>
          </div>

          {/* Trust Highlights Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem', background: 'rgba(13,13,15,0.7)',
            border: '1px solid rgba(212,175,55,0.15)', borderRadius: '1rem',
            padding: '1.25rem', backdropFilter: 'blur(10px)'
          }}>
            {[
              { icon: <ShieldCheck size={20} style={{ color: 'var(--gold)' }} />, title: isRtl ? 'تتبع آمن ومشفر' : 'Secured Ownership Tracking', sub: isRtl ? 'محمي بالكامل داخل حساب العميل' : 'Protected in Client Portal' },
              { icon: <Truck size={20} style={{ color: '#34d399' }} />, title: isRtl ? 'توصيل محلي 24 ساعة' : '24h Local Delivery', sub: isRtl ? 'تغطية للمدن والمحافظات' : 'Wide city coverage' },
              { icon: <Globe size={20} style={{ color: '#60a5fa' }} />, title: isRtl ? 'تغطية 24+ دولة' : '24+ Countries Reach', sub: isRtl ? 'شحن وتوريد من المصانع' : 'Factory Direct Sourcing' },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: isRtl ? 'right' : 'left' }}>
                <div style={{ width: 38, height: 38, borderRadius: '0.6rem', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>{item.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Animated Stats Bar ────────────────────────────────────────────── */}
      <section style={{ padding: '3.5rem 1.25rem', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', background: 'rgba(10,10,12,0.8)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
          {[
            { icon: <Package size={24} />, value: 18500, suffix: '+', label: isRtl ? 'شحنة تم توصيلها' : 'Shipments Delivered' },
            { icon: <Users size={24} />, value: 4200, suffix: '+', label: isRtl ? 'عميل ومؤسسة مخدومة' : 'Satisfied Clients' },
            { icon: <Globe size={24} />, value: 24, suffix: '+', label: isRtl ? 'دولة نغطيها' : 'Countries Covered' },
            { icon: <Award size={24} />, value: 99, suffix: '%', label: isRtl ? 'نسبة الالتزام والرضا' : 'Satisfaction Rate' },
          ].map((stat, i) => (
            <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: 'var(--gold)' }}>{stat.icon}</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 700 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services Section ──────────────────────────────────────────────── */}
      <section id="services" style={{ padding: '5rem 1.25rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isRtl ? 'خدماتنا اللوجستية' : 'Our Services'}
            </span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, marginTop: '0.4rem', marginBottom: '0.6rem' }}>
              {tr('services')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 540, margin: '0 auto' }}>
              {isRtl ? 'حلول متكاملة تغطي كافة تطلعاتك من التوصيل المحلي إلى التوريد والتخليص الدولي' : 'End-to-end logistics solutions covering local delivery and global factory sourcing'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {services.map((svc, i) => (
              <div key={i} className="glass-card animate-slide-up" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', animationDelay: `${i * 0.1}s` }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '2.5rem' }}>{svc.icon}</div>
                  <span className="badge badge-gold" style={{ fontSize: '0.68rem', fontWeight: 800 }}>{svc.tag}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>{svc.title}</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works Timeline Section ─────────────────────────────────── */}
      <section id="howItWorks" style={{ padding: '5rem 1.25rem', background: 'rgba(10,10,12,0.6)', borderTop: '1px solid var(--bg-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.08em' }}>
              {isRtl ? 'رحلة الشحنة' : 'Shipment Journey'}
            </span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, marginTop: '0.4rem', marginBottom: '0.6rem' }}>
              {tr('howItWorks')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 560, margin: '0 auto' }}>
              {tr('howItWorksSub')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', position: 'relative' }}>
            {howItWorksSteps.map((stepItem, i) => (
              <div key={i} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '0.6rem', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                    {stepItem.icon}
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'rgba(212,175,55,0.25)', fontFamily: 'var(--font-mono)' }}>
                    {stepItem.step}
                  </span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{stepItem.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{stepItem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shipping Estimator Calculator Section ─────────────────────────── */}
      <section id="calculator" style={{ padding: '5rem 1.25rem' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="glass-card" style={{ padding: '2rem 1.5rem', borderColor: 'var(--gold-border)', background: 'rgba(13,13,15,0.96)', position: 'relative' }}>
            <div className="gold-line-top" />
            
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', padding: '0.5rem', borderRadius: '0.75rem', background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', marginBottom: '0.75rem' }}>
                <Calculator size={24} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                {tr('calculatorTitle')}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                {tr('calculatorSub')}
              </p>
            </div>

            {/* Service Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[
                { id: 'local', label: isRtl ? 'شحن محلي' : 'Local Delivery', sub: isRtl ? 'توصيل المحافظات' : 'City Wide' },
                { id: 'express', label: isRtl ? 'شحن دولي جوي' : 'Intl Express Air', sub: isRtl ? 'بالكيلو KG' : 'Per KG' },
                { id: 'factory', label: isRtl ? 'توريد مصنع CBM' : 'Factory CBM', sub: isRtl ? 'بالحجم CBM' : 'Per CBM' },
              ].map(tab => (
                <button key={tab.id} type="button" onClick={() => setCalcServiceType(tab.id as any)} style={{
                  padding: '0.75rem 0.5rem', borderRadius: '0.65rem', border: 'none',
                  background: calcServiceType === tab.id ? 'var(--gold)' : 'var(--bg-input)',
                  color: calcServiceType === tab.id ? '#000' : 'var(--text-secondary)',
                  fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s ease',
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <span>{tab.label}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 600 }}>{tab.sub}</span>
                </button>
              ))}
            </div>

            {/* Inputs based on selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
              {calcServiceType !== 'factory' ? (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{tr('weightKgLabel')}: <span style={{ color: 'var(--gold)', fontWeight: 800 }}>{calcWeight} KG</span></label>
                  <input
                    type="range" min="1" max="100" step="1"
                    value={calcWeight}
                    onChange={e => setCalcWeight(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--gold)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <span>1 KG</span><span>50 KG</span><span>100 KG</span>
                  </div>
                </div>
              ) : (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{tr('cbmLabel')}: <span style={{ color: 'var(--gold)', fontWeight: 800 }}>{calcCbm} CBM</span></label>
                  <input
                    type="range" min="0.1" max="20" step="0.1"
                    value={calcCbm}
                    onChange={e => setCalcCbm(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--gold)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <span>0.1 CBM</span><span>10 CBM</span><span>20 CBM</span>
                  </div>
                </div>
              )}
            </div>

            {/* Price Preview Card */}
            <div className="section-card" style={{ padding: '1.25rem', textAlign: 'center', background: 'rgba(212,175,55,0.04)', borderColor: 'rgba(212,175,55,0.25)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>{tr('estimatedShippingFee')}</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--gold)', fontFamily: 'var(--font-mono)', margin: '0.2rem 0' }}>
                {estimatedCostResult.yer.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 700 }}>YER</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginInlineStart: '0.5rem', fontWeight: 600 }}>
                  (~${estimatedCostResult.usd} USD)
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{tr('disclaimerCalc')}</p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link to="/auth/register" className="btn btn-gold btn-sm" style={{ gap: '0.4rem', padding: '0.6rem 1.5rem' }}>
                <PlusCircle size={15} /> {tr('startNow')}
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Features Grid Section ─────────────────────────────────────────── */}
      <section id="features" style={{ padding: '5rem 1.25rem', background: 'rgba(10,10,12,0.6)', borderTop: '1px solid var(--bg-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.08em' }}>
              {isRtl ? 'لماذا ALX' : 'Why Choose Us'}
            </span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, marginTop: '0.4rem', marginBottom: '0.6rem' }}>{tr('features')}</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {features.map((feat, i) => (
              <div key={i} className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.5rem', transition: 'all 0.25s' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}>
                <div style={{ width: 46, height: 46, background: 'var(--bg-input)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{feat.title}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section (Accordion) ───────────────────────────────────────── */}
      <section id="faq" style={{ padding: '5rem 1.25rem' }}>
        <div className="container" style={{ maxWidth: 780 }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.08em' }}>
              {isRtl ? 'مركز التساؤلات' : 'FAQ Center'}
            </span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, marginTop: '0.4rem', marginBottom: '0.6rem' }}>
              {tr('faqTitle')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{tr('faqSub')}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="glass-card" style={{ overflow: 'hidden', transition: 'all 0.2s ease' }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%', padding: '1.1rem 1.25rem', background: 'transparent', border: 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                      cursor: 'pointer', textAlign: isRtl ? 'right' : 'left'
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isOpen ? 'var(--gold)' : 'var(--text-primary)' }}>
                      {item.q}
                    </span>
                    {isOpen ? <ChevronUp size={18} style={{ color: 'var(--gold)', flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 1.25rem 1.25rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.7, borderTop: '1px solid var(--bg-border)', paddingTop: '0.85rem' }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Global Presence Pill Grid ───────────────────────────────────────── */}
      <section id="globalReach" style={{ padding: '4.5rem 1.25rem', background: 'rgba(10,10,12,0.6)', borderTop: '1px solid var(--bg-border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 900, marginBottom: '0.75rem' }}>{tr('globalReach')}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem', maxWidth: 560, margin: '0 auto 2rem' }}>
            {isRtl ? 'نتواجد في أكثر من 24 دولة حول العالم بشبكة موثوقة من الشركاء ومستودعات التجميع' : 'Present in over 24 countries with a trusted network of logistics partners'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem', maxWidth: 840, margin: '0 auto' }}>
            {['🇾🇪 اليمن', '🇸🇦 السعودية', '🇦🇪 الإمارات', '🇶🇦 قطر', '🇴🇲 عُمان', '🇰🇼 الكويت', '🇨🇳 الصين', '🇹🇷 تركيا', '🇮🇳 الهند', '🇩🇪 ألمانيا', '🇺🇸 أمريكا', '🇬🇧 بريطانيا'].map(country => (
              <span key={country} style={{
                padding: '0.55rem 1.15rem', borderRadius: '99px',
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.2)',
                fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700
              }}>{country}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Section ───────────────────────────────────────────────── */}
      <section id="contactUs" style={{ padding: '5rem 1.25rem' }}>
        <div className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 900, marginBottom: '0.75rem' }}>{tr('contactUs')}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
            {isRtl ? 'فريقنا في خدمتك على مدار الساعة للإجابة على استفساراتك واستلام طلباتك' : 'Our team is at your service 24/7 to answer inquiries & process orders'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="tel:785557070" className="btn btn-gold btn-lg" style={{ gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
              <Phone size={16} /> 785557070
            </a>
            <a href="https://wa.me/967785557070" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg" style={{ gap: '0.5rem', color: '#25D366', borderColor: '#25D366', padding: '0.75rem 1.5rem' }}>
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a href="mailto:alxdelivery777@gmail.com" className="btn btn-ghost btn-lg" style={{ gap: '0.5rem' }}>
              <Mail size={16} /> Email
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.25rem', background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))', borderTop: '1px solid rgba(212,175,55,0.15)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 680 }}>
          <h2 style={{ fontSize: 'clamp(1.35rem, 3vw, 2.2rem)', fontWeight: 900, marginBottom: '0.85rem' }}>
            {isRtl ? 'هل أنت جاهز لبدء تجربتك المميزة مع ALX؟' : 'Ready to start your premium experience with ALX?'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.92rem', lineHeight: 1.6 }}>
            {isRtl ? 'سجّل حسابك الآن كعميل، وابدأ في تتبع شحناتك المعتمدة وإدارة فواتيرك بكل سهولة وخصوصية' : 'Register now and start managing your orders and viewing secure tracking anytime'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth/register" className="btn btn-gold btn-lg" style={{ gap: '0.5rem', padding: '0.8rem 2rem' }}>
              {tr('register')} {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
            <Link to="/auth/login" className="btn btn-outline btn-lg" style={{ padding: '0.8rem 1.75rem' }}>
              {tr('login')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--bg-border)', padding: '2.5rem 1.25rem', background: '#050505' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.3rem' }}>📦</span>
              <span style={{ fontWeight: 900, color: 'var(--gold)', fontSize: '1.05rem' }}>ALX Delivery</span>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => setIsJobModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 700 }}>
                💼 {isRtl ? 'تقديم على وظيفة' : 'Careers'}
              </button>
              <a href="#" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{tr('privacyPolicy')}</a>
              <a href="#" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{tr('termsOfService')}</a>
              <Link to="/auth/login" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{tr('login')}</Link>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              © {new Date().getFullYear()} ALX Delivery. {tr('allRightsReserved')}
            </p>
          </div>
        </div>
      </footer>

      {/* Job Application Modal */}
      <JobApplicationModal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
