import React, { useState, useEffect } from 'react';
import { MessageSquare, PlusCircle, Send, X } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { queryCollection, insertDoc } from '../../lib/supabase';
import type { PortalTicket, TicketType } from '../../types/portalTypes';

export default function SupportTicketsPage() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  const [tickets, setTickets] = useState<PortalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [type, setType] = useState<TicketType>('inquiry');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    loadTickets();
  }, [user]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const userTickets = await queryCollection('portal_tickets', 'userUid', user?.uid);
      userTickets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setTickets(userTickets as PortalTicket[]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject || !message) {
      setError(tr('required'));
      return;
    }

    setSending(true);
    setError('');

    try {
      const ticketId = 'tkt_' + Math.random().toString(36).substring(2, 11);
      const ticketData = {
        userUid: user.uid,
        userName: user.fullName,
        userRole: user.portalRole,
        type,
        subject,
        message,
        status: 'open',
        createdAt: Date.now(),
      };

      await insertDoc('portal_tickets', ticketId, ticketData);

      await loadTickets();
      setShowModal(false);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || tr('error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>{tr('supportTickets')}</h1>
          <p>{isRtl ? 'أرسل اقتراحاتك وشكاواك واستفساراتك لفريق الدعم الفني' : 'Submit suggestions, complaints and inquiries to our support team'}</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowModal(true)}>
          <PlusCircle size={16} /> {tr('newTicket')}
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-lg" /></div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={40} />
          <p>{tr('noTickets')}</p>
          <button className="btn btn-gold btn-sm" onClick={() => setShowModal(true)} style={{ marginTop: '0.5rem' }}>
            <PlusCircle size={14} /> {tr('newTicket')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tickets.map(tkt => (
            <div key={tkt.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-gold">{tr(tkt.type as any)}</span>
                <span className={`badge ${tkt.status === 'open' ? 'badge-warning' : tkt.status === 'resolved' ? 'badge-success' : 'badge-muted'}`}>
                  {tr(`ticketStatus_${tkt.status}` as any)}
                </span>
              </div>

              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{tkt.subject}</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tkt.message}</p>

              {tkt.adminResponse && (
                <div className="section-card" style={{ background: 'rgba(212,175,55,0.04)', borderColor: 'var(--gold-border)', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '0.2rem' }}>
                    {tr('adminReply')}:
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{tkt.adminResponse}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)} dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="modal-box animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="gold-line-top" />
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{tr('newTicket')}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>

              {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

              <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{tr('ticketType')}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {[
                      { id: 'inquiry', label: tr('inquiry') },
                      { id: 'suggestion', label: tr('suggestion') },
                      { id: 'complaint', label: tr('complaint') },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setType(item.id as TicketType)}
                        style={{
                          padding: '0.65rem 0.4rem', borderRadius: '0.6rem',
                          background: type === item.id ? 'rgba(212,175,55,0.12)' : 'var(--bg-input)',
                          border: `1px solid ${type === item.id ? 'var(--gold)' : 'var(--bg-border)'}`,
                          color: type === item.id ? 'var(--gold)' : 'var(--text-secondary)',
                          fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{tr('subject')}</label>
                  <input type="text" required className="form-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="موضوع التذكرة..." />
                </div>

                <div className="form-group">
                  <label className="form-label">{tr('message')}</label>
                  <textarea
                    required
                    className="form-input"
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="اكتب تفاصيل التذكرة هنا..."
                  />
                </div>

                <button type="submit" disabled={sending} className="btn btn-gold btn-full btn-lg">
                  {sending ? <div className="spinner" /> : <Send size={16} />}
                  {tr('sendTicket')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
