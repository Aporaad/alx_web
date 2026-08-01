import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, FileText, Megaphone } from 'lucide-react';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { supabase, extractRows } from '../../lib/supabase';

interface SearchResult {
  id: string;
  type: 'order' | 'transaction' | 'announcement' | 'ticket';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
}

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const { tr, isRtl } = usePortalTheme();
  const { user } = usePortalAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) runSearch(query.trim());
      else setResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const runSearch = async (q: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const all: SearchResult[] = [];

      // Search portal_orders
      const { data: orders } = await supabase
        .from('portal_orders')
        .select('*')
        .eq('customer_uid', user.uid)
        .or(`tracking_number.ilike.%${q}%,recipient_name.ilike.%${q}%,goods_description.ilike.%${q}%`)
        .limit(5);

      (orders || []).forEach((o: any) => {
        all.push({
          id: o.id,
          type: 'order',
          title: o.tracking_number || o.id,
          subtitle: o.recipient_name,
          icon: <Package size={14} style={{ color: 'var(--gold)' }} />
        });
      });

      // Search announcements
      const { data: anns } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .ilike('title', `%${q}%`)
        .limit(3);

      (anns || []).forEach((a: any) => {
        all.push({
          id: a.id,
          type: 'announcement',
          title: a.title,
          subtitle: a.content?.slice(0, 60) + '...',
          icon: <Megaphone size={14} style={{ color: '#60a5fa' }} />
        });
      });

      setResults(all);
    } finally {
      setLoading(false);
    }
  };

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
          {query.length < 2 && (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Search size={28} />
              <p style={{ fontSize: '0.8rem' }}>{tr('search')}</p>
            </div>
          )}
          {query.length >= 2 && results.length === 0 && !loading && (
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
                {r.icon}
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
