import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Megaphone } from 'lucide-react';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { portalAuthGateway } from '../../api/portalAuthGateway';
import { portalGateway } from '../../api/portalGateway';
import { searchPortalResources } from '../../lib/globalSearch';

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const { tr, isRtl } = usePortalTheme();
  const { user } = usePortalAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReturnType<typeof searchPortalResources>>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    let active = true;
    const searchTerm = query.trim();

    if (searchTerm.length < 2 || !user) {
      setResults([]);
      setLoading(false);
      return () => { active = false; };
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      const ordersRequest = user.portalRole === 'customer'
        ? (portalAuthGateway
          ? portalAuthGateway.listCustomerOrders(searchTerm)
          : Promise.reject(new Error('PORTAL_API_NOT_CONFIGURED')))
        : Promise.resolve([]);

      void Promise.all([ordersRequest, portalGateway.getAnnouncements()])
        .then(([orders, announcements]) => {
          if (active) setResults(searchPortalResources(searchTerm, orders, announcements));
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, user?.portalRole, user?.uid]);

  return (
    <div className="modal-backdrop" onClick={onClose} dir={isRtl ? 'rtl' : 'ltr'}>
      <div
        className="animate-scale-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--gold-border)',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: 520,
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderBottom: '1px solid var(--bg-border)' }}>
          {loading
            ? <div className="spinner" style={{ flexShrink: 0 }} />
            : <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tr('search')}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-main)'
            }}
          />
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '0.5rem' }}>
          {query.trim().length < 2 && (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Search size={28} />
              <p style={{ fontSize: '0.8rem' }}>{tr('search')}</p>
            </div>
          )}
          {query.trim().length >= 2 && results.length === 0 && !loading && (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p style={{ fontSize: '0.8rem' }}>{tr('noResults')}</p>
            </div>
          )}
          {results.map(r => (
            <div
              key={r.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', borderRadius: '0.6rem', cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={onClose}
            >
              <div style={{
                width: 32, height: 32,
                background: 'var(--bg-input)',
                borderRadius: '0.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {r.type === 'order'
                  ? <Package size={14} style={{ color: 'var(--gold)' }} />
                  : <Megaphone size={14} style={{ color: '#60a5fa' }} />}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</div>
                {r.subtitle && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.subtitle}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
