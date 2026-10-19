import { useState } from 'react';
import { Printer, Search, FileText } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import { useCustomerStatement } from './useCustomerStatement';

/**
 * شاشة كشف الحساب المخصص (D3): فترة من/إلى + نوع حركة اختياري، عرض وطباعة.
 * Custom statement screen (D3): from/to period + optional movement type; display and print.
 * البيانات كلها مقيّدة بالملكية على الخادم وتصل بعملة الحساب فقط — بلا حسابات داخلية أو أرقام شركة.
 */
export default function StatementSection() {
  const { isRtl } = usePortalTheme();
  const { statement, loading, error, load } = useCustomerStatement();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('');

  const label = (ar: string, en: string) => (isRtl ? ar : en);
  const symbol = statement?.currency.symbol ?? '';

  const handleGenerate = () => {
    const fromMs = from ? new Date(`${from}T00:00:00`).getTime() : undefined;
    const toMs = to ? new Date(`${to}T23:59:59`).getTime() : undefined;
    load({
      ...(typeof fromMs === 'number' && !Number.isNaN(fromMs) ? { from: fromMs } : {}),
      ...(typeof toMs === 'number' && !Number.isNaN(toMs) ? { to: toMs } : {}),
      ...(type.trim() ? { type: type.trim() } : {}),
      limit: 1000,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* أدوات الفلترة / Filter controls */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ margin: 0, minWidth: 150 }}>
          <label className="form-label">{label('من تاريخ', 'From')}</label>
          <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: 150 }}>
          <label className="form-label">{label('إلى تاريخ', 'To')}</label>
          <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
          <label className="form-label">{label('نوع الحركة', 'Type')}</label>
          <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{label('الكل', 'All')}</option>
            <option value="Debit">{label('مدين', 'Debit')}</option>
            <option value="Credit">{label('دائن', 'Credit')}</option>
          </select>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => void handleGenerate()} disabled={loading}>
          <Search size={14} /> {label('إنشاء الكشف', 'Generate')}
        </button>
        {statement && statement.entries.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
            <Printer size={14} /> {label('طباعة', 'Print')}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{label('تعذّر إنشاء الكشف.', 'Failed to build the statement.')}</div>}

      {/* نتيجة الكشف / Statement result */}
      {statement ? (
        <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={15} /> {label('كشف الحساب', 'Account Statement')}
            </h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {label(`عدد الحركات: ${statement.entries.length}`, `Entries: ${statement.entries.length}`)}
              {symbol && ` • ${symbol}`}
            </div>
          </div>
          {statement.entries.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <FileText size={30} />
              <p>{label('لا حركات ضمن هذه الفترة.', 'No movements in this period.')}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>{label('القيد', 'Entry')}</th>
                    <th>{label('النوع', 'Type')}</th>
                    <th>{label('البيان', 'Description')}</th>
                    <th>{label('المبلغ', 'Amount')}</th>
                    <th>{label('التاريخ', 'Date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.entries.map((entry, i) => (
                    <tr key={`${entry.entryNumber}-${i}`}>
                      <td style={{ direction: 'ltr', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{entry.entryNumber || '—'}</td>
                      <td><span className="badge badge-muted" style={{ fontSize: '0.68rem' }}>{entry.transType || '—'}</span></td>
                      <td>{entry.description || entry.note || '—'}</td>
                      <td style={{ direction: 'ltr', fontWeight: 800, color: 'var(--gold)' }}>
                        {entry.amount.toLocaleString()}{symbol ? ` ${symbol}` : ''}
                      </td>
                      <td style={{ direction: 'ltr', fontSize: '0.75rem' }}>{new Date(entry.createdAt).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <FileText size={30} />
          <p>{label('اختر الفترة ثم أنشئ الكشف.', 'Pick a period then generate the statement.')}</p>
        </div>
      )}
    </div>
  );
}
