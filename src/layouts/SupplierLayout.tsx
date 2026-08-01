import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Factory, FileText, Megaphone, MessageSquare, User, LogOut, Menu, X, Globe, Sun, Moon, Search } from 'lucide-react';
import { usePortalAuth } from '../context/PortalAuthContext';
import { usePortalTheme } from '../context/PortalThemeContext';
import GlobalSearch from '../components/common/GlobalSearch';
import type { TKey } from '../lib/translations';

interface NavItem { to: string; icon: React.ReactNode; labelKey: TKey; }

const navItems: NavItem[] = [
  { to: '/portal/supplier',               icon: <LayoutDashboard size={16} />, labelKey: 'dashboard' },
  { to: '/portal/supplier/orders',        icon: <Factory size={16} />,         labelKey: 'mySupplyOrders' },
  { to: '/portal/supplier/ledger',        icon: <FileText size={16} />,        labelKey: 'mySupplierLedger' },
  { to: '/portal/supplier/announcements', icon: <Megaphone size={16} />,       labelKey: 'announcements' },
  { to: '/portal/supplier/tickets',       icon: <MessageSquare size={16} />,   labelKey: 'supportTickets' },
  { to: '/portal/supplier/profile',       icon: <User size={16} />,            labelKey: 'profile' },
];

export default function SupplierLayout() {
  const { user, logout } = usePortalAuth();
  const { tr, toggleTheme, toggleLang, theme, lang, isRtl } = usePortalTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-root)' }}>
      <aside className="portal-sidebar" style={{ transform: sidebarOpen ? 'translateX(0)' : (isRtl ? 'translateX(100%)' : 'translateX(-100%)'), ...(window.innerWidth >= 1024 ? { transform: 'translateX(0)' } : {}) }}>
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--bg-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.1rem' }}>🏭</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--gold)' }}>{tr('companyName')}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tr('supplier')}</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '0.75rem 0' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/portal/supplier'}
              className={({ isActive }) => `portal-sidebar-link${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              {item.icon}<span>{tr(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--bg-border)' }}>
          <button className="btn btn-ghost btn-full" onClick={handleLogout} style={{ justifyContent: 'flex-start', gap: '0.6rem' }}>
            <LogOut size={14} /><span style={{ fontSize: '0.8rem' }}>{tr('logout')}</span>
          </button>
        </div>
      </aside>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 39 }} />}
      <div style={{ flex: 1, marginInlineStart: window.innerWidth >= 1024 ? 240 : 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--bg-border)', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X size={16} /> : <Menu size={16} />}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSearchOpen(true)} style={{ flex: 1, justifyContent: 'flex-start', maxWidth: 280, color: 'var(--text-muted)' }}>
            <Search size={14} /><span style={{ fontSize: '0.78rem' }}>{tr('globalSearch')}</span>
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
          <button className="btn btn-ghost btn-sm" onClick={toggleLang} style={{ gap: '0.3rem' }}><Globe size={14} /><span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{lang === 'ar' ? 'EN' : 'ع'}</span></button>
          <div style={{ width: 28, height: 28, background: 'rgba(139,92,246,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#a78bfa' }}>
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
        </header>
        <main style={{ flex: 1, padding: '1.5rem 1.25rem' }}><Outlet /></main>
      </div>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
