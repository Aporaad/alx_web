/**
 * PortalCalculatorModal.tsx — نافذة الآلة الحاسبة والمصارفة (نسخة بوابة العميل)
 * Portal copy of the system's FinancialCalculatorModal: a two-tab dialog —
 *  1 الحاسبة (Calculator): + − × ÷ % ± C CE with keyboard support and copy.
 *  2 المصارفة (Currency exchange): converts amounts between the REAL active currencies
 *    loaded from the API (public.currency + cur_price via gw.listCurrencies()), never a
 *    hard-coded rate or currency literal.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calculator, ArrowRightLeft, X, Copy, Check, Loader2,
} from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import { portalAuthGateway, type PortalCurrencyRefDto } from '../../../api/portalAuthGateway';
import { currencyOptionLabel } from '../../../lib/currencyLabel';

export default function PortalCalculatorModal({
  open, onClose, initialTab = 'calc',
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: 'calc' | 'exchange';
}) {
  const { isRtl } = usePortalTheme();
  const label = (ar: string, en: string) => (isRtl ? ar : en);
  const [activeTab, setActiveTab] = useState<'calc' | 'exchange'>(initialTab);

  // حالة الحاسبة — Calculator state.
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [copied, setCopied] = useState(false);

  // حالة المصارفة — Exchange state (الأسعار من قاعدة البيانات عبر API).
  const [amount, setAmount] = useState('1000');
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');
  const [currencyOptions, setCurrencies] = useState<PortalCurrencyRefDto[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);

  // تحميل العملات الحقيقية وأسعارها لحظة الفتح؛ لا قيم ثابتة.
  // Load the real currencies + rates on open; no literals.
  useEffect(() => {
    if (!open || !portalAuthGateway) return;
    setRatesLoading(true);
    portalAuthGateway.listCurrencies()
      .then((list) => {
        setCurrencies(list);
        const defaultCode = list.find((c) => c.isDefault)?.code ?? list[0]?.code ?? '';
        setFromCode((prev) => (prev && list.some((c) => c.code === prev) ? prev : defaultCode));
        setToCode((prev) => {
          if (prev && list.some((c) => c.code === prev) && prev !== defaultCode) return prev;
          return list.find((c) => c.code !== defaultCode)?.code ?? defaultCode;
        });
      })
      .catch(() => setCurrencies([]))
      .finally(() => setRatesLoading(false));
  }, [open]);

  const rateOf = useCallback((code: string): number => {
    const found = currencyOptions.find((c) => c.code === code);
    return found && Number.isFinite(found.rate) && found.rate > 0 ? found.rate : 1;
  }, [currencyOptions]);

  // منطق الحاسبة — Calculator engine.
  const handleDigit = useCallback((digit: string) => {
    setDisplay((prev) => {
      if (waitingForNext) { setWaitingForNext(false); return digit === '.' ? '0.' : digit; }
      if (digit === '.') return prev.includes('.') ? prev : prev + '.';
      if (prev === '0') return digit;
      if (prev.length >= 15) return prev;
      return prev + digit;
    });
  }, [waitingForNext]);

  const execute = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleOp = useCallback((op: string) => {
    const current = parseFloat(display);
    if (prevVal === null) {
      setPrevVal(current);
      setEquation(`${current} ${op}`);
    } else if (operation && !waitingForNext) {
      const result = execute(prevVal, current, operation);
      setPrevVal(result);
      setDisplay(String(result));
      setEquation(`${result} ${op}`);
    } else {
      setEquation(`${prevVal} ${op}`);
    }
    setOperation(op);
    setWaitingForNext(true);
  }, [display, prevVal, operation, waitingForNext]);

  const handleEquals = useCallback(() => {
    if (prevVal === null || !operation) return;
    const current = parseFloat(display);
    const result = Number(execute(prevVal, current, operation).toFixed(6));
    setDisplay(String(result));
    setEquation(`${prevVal} ${operation} ${current} =`);
    setPrevVal(null); setOperation(null); setWaitingForNext(true);
  }, [display, prevVal, operation]);

  const handleClear = useCallback(() => {
    setDisplay('0'); setEquation(''); setPrevVal(null); setOperation(null); setWaitingForNext(false);
  }, []);

  useEffect(() => {
    if (!open || activeTab !== 'calc') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === '.') handleDigit('.');
      else if (e.key === '+') handleOp('+');
      else if (e.key === '-') handleOp('-');
      else if (e.key === '*') handleOp('×');
      else if (e.key === '/') { e.preventDefault(); handleOp('÷'); }
      else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleEquals(); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, activeTab, handleDigit, handleOp, handleEquals, onClose]);

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exchange = useMemo(() => {
    const parsed = parseFloat(amount) || 0;
    const rf = rateOf(fromCode);
    const rt = rateOf(toCode);
    const converted = rt > 0 ? (parsed * rf) / rt : 0;
    return { converted, direct: rt > 0 ? rf / rt : 0 };
  }, [amount, fromCode, toCode, rateOf]);

  if (!open) return null;

  // أنماط أزرار لوحة الحاسبة مطابقة لتصميم النظام (بلا Tailwind — أنماط مضمّنة + متغيرات CSS).
  // Keypad styling mirrors the system calculator using inline styles + CSS tokens (alx_web has no Tailwind).
  type KeyKind = 'num' | 'op' | 'eq' | 'danger' | 'util';
  const cellStyle = (text: string, kind: KeyKind): React.CSSProperties => {
    const base: React.CSSProperties = {
      borderRadius: '0.75rem', padding: '0.9rem 0', textAlign: 'center', cursor: 'pointer',
      border: '1px solid var(--bg-border)', fontFamily: 'var(--font-mono)', fontWeight: 800,
      fontSize: kind === 'num' ? '1.05rem' : '0.95rem', transition: 'var(--transition-base)',
    };
    const activeOp = (kind === 'op' && operation === text);
    if (kind === 'eq') return { ...base, background: 'var(--gold)', color: '#0a0a0a', border: 'none', fontSize: '1.15rem', fontWeight: 900 };
    if (kind === 'danger') return { ...base, background: 'rgba(239,68,68,0.14)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' };
    if (kind === 'util') return { ...base, background: 'var(--bg-input)', color: 'var(--text-secondary)' };
    if (kind === 'op') return { ...base, background: activeOp ? 'var(--gold)' : 'rgba(212,175,55,0.12)', color: activeOp ? '#0a0a0a' : 'var(--gold)', border: '1px solid rgba(212,175,55,0.2)' };
    return { ...base, background: 'var(--bg-input)', color: 'var(--text-primary)' };
  };

  const keypad: { t: string; fn: () => void; kind: KeyKind }[] = [
    { t: 'C', fn: handleClear, kind: 'danger' }, { t: 'CE', fn: () => setDisplay('0'), kind: 'util' },
    { t: '%', fn: () => setDisplay(String(parseFloat(display) / 100)), kind: 'util' }, { t: '÷', fn: () => handleOp('÷'), kind: 'op' },
    { t: '7', fn: () => handleDigit('7'), kind: 'num' }, { t: '8', fn: () => handleDigit('8'), kind: 'num' },
    { t: '9', fn: () => handleDigit('9'), kind: 'num' }, { t: '×', fn: () => handleOp('×'), kind: 'op' },
    { t: '4', fn: () => handleDigit('4'), kind: 'num' }, { t: '5', fn: () => handleDigit('5'), kind: 'num' },
    { t: '6', fn: () => handleDigit('6'), kind: 'num' }, { t: '-', fn: () => handleOp('-'), kind: 'op' },
    { t: '1', fn: () => handleDigit('1'), kind: 'num' }, { t: '2', fn: () => handleDigit('2'), kind: 'num' },
    { t: '3', fn: () => handleDigit('3'), kind: 'num' }, { t: '+', fn: () => handleOp('+'), kind: 'op' },
    { t: '±', fn: () => setDisplay(String(-parseFloat(display))), kind: 'util' }, { t: '0', fn: () => handleDigit('0'), kind: 'num' },
    { t: '.', fn: () => handleDigit('.'), kind: 'num' }, { t: '=', fn: handleEquals, kind: 'eq' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} dir={isRtl ? 'rtl' : 'ltr'} style={{ zIndex: 120 }}>
      <div className="modal-box animate-scale-in" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="gold-line-top" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--bg-border)' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button type="button" onClick={() => setActiveTab('calc')} className={`btn btn-sm ${activeTab === 'calc' ? 'btn-gold' : 'btn-ghost'}`}><Calculator size={14} /> {label('الحاسبة', 'Calculator')}</button>
            <button type="button" onClick={() => setActiveTab('exchange')} className={`btn btn-sm ${activeTab === 'exchange' ? 'btn-gold' : 'btn-ghost'}`}><ArrowRightLeft size={14} /> {label('المصارفة', 'Exchange')}</button>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="close"><X size={16} /></button>
        </div>

        {activeTab === 'calc' ? (
          <div style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div className="section-card" style={{ padding: '0.85rem', textAlign: 'left' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minHeight: 16, overflow: 'hidden' }}>{equation || ' '}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(display)} title={label('نسخ', 'Copy')}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', overflow: 'hidden' }}>{display}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {keypad.map(k => <button key={k.t} type="button" style={cellStyle(k.t, k.kind)} onClick={k.fn}>{k.t}</button>)}
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {ratesLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}><Loader2 size={14} className="animate-spin" /> {label('جارٍ تحميل الأسعار…', 'Loading rates…')}</div>
            ) : currencyOptions.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label('لا توجد عملات متاحة حالياً.', 'No currencies available.')}</p>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">{label('المبلغ المراد تحويله', 'Amount to convert')}</label>
                  <input type="number" className="form-input" dir="ltr" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'end', gap: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">{label('من عملة', 'From')}</label>
                    {/* قائمة العملة بنص مصغّر — توجيه المالك لتوحيد حجم قوائم العملات. */}
                    <select className="form-select" style={{ fontSize: '0.72rem' }} value={fromCode} onChange={e => setFromCode(e.target.value)}>
                      {currencyOptions.map(c => <option key={c.code} value={c.code}>{currencyOptionLabel(c, isRtl)}</option>)}
                    </select>
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ marginBottom: 2 }} title={label('تبديل', 'Swap')} onClick={() => { const t = fromCode; setFromCode(toCode); setToCode(t); }}><ArrowRightLeft size={16} /></button>
                  <div className="form-group">
                    <label className="form-label">{label('إلى عملة', 'To')}</label>
                    <select className="form-select" style={{ fontSize: '0.72rem' }} value={toCode} onChange={e => setToCode(e.target.value)}>
                      {currencyOptions.map(c => <option key={c.code} value={c.code}>{currencyOptionLabel(c, isRtl)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="section-card" style={{ padding: '0.9rem', textAlign: 'center', borderColor: 'var(--gold)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{label('النتيجة المحولة', 'Converted result')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>{Number(exchange.converted.toFixed(4)).toLocaleString()}</span>
                    <span className="badge" style={{ fontSize: '0.72rem' }}>{toCode}</span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(String(exchange.converted))} title={label('نسخ', 'Copy')}><Copy size={13} /></button>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {label('سعر الصرف المعتمد', 'Applied rate')}: 1 {fromCode} = {Number(exchange.direct.toFixed(6))} {toCode}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
