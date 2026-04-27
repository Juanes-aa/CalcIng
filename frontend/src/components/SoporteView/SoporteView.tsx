import { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { TranslationKey } from '@engine/i18n';
import { submitTicket } from '../../services/supportService';

const SERVICES = [
  { name: 'API_GATEWAY',  uptime: '99.9%',  status: 'ONLINE'   },
  { name: 'CAS_ENGINE',   uptime: '97.42%', status: 'DEGRADED' },
  { name: 'DB_CLUST_01',  uptime: '99.99%', status: 'ONLINE'   },
  { name: 'REDIS_CACHE',  uptime: '90.08%', status: 'DOWN'     },
];

const STATUS_STYLE: Record<string, string> = {
  ONLINE:   'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30',
  DEGRADED: 'text-amber-400  bg-amber-400/10  border border-amber-400/30',
  DOWN:     'text-red-400    bg-red-400/10    border border-red-400/30',
};

const CATEGORY_KEYS: TranslationKey[] = [
  'support.cat.techError',
  'support.cat.billing',
  'support.cat.feature',
  'support.cat.bug',
  'support.cat.api',
  'support.cat.other',
];

const FAQ_KEYS: { q: TranslationKey; a: TranslationKey }[] = [
  { q: 'support.faq.q1', a: 'support.faq.a1' },
  { q: 'support.faq.q2', a: 'support.faq.a2' },
  { q: 'support.faq.q3', a: 'support.faq.a3' },
];

export function SoporteView() {
  const { t } = useI18n();
  const [fullName,    setFullName]    = useState('');
  const [engId,       setEngId]       = useState('');
  const [category,    setCategory]    = useState(CATEGORY_KEYS[0]);
  const [description, setDescription] = useState('');
  const [critical,    setCritical]    = useState(false);
  const [openFaq,     setOpenFaq]     = useState<number | null>(0);
  const [submitted,   setSubmitted]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleDispatch(): Promise<void> {
    if (!fullName.trim() || !description.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitTicket({
        full_name:   fullName.trim(),
        eng_id:      engId.trim(),
        category:    category ?? 'other',
        description: description.trim(),
        critical,
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setFullName(''); setEngId(''); setDescription(''); setCritical(false);
    } catch {
      setError(t('support.form.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-10 overflow-y-auto">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-mono font-black tracking-[0.15em] uppercase text-on-surface">
          {t('support.hero.title')}
        </h1>
        <p className="text-sm text-on-surface-dim max-w-lg mx-auto leading-relaxed">
          {t('support.hero.subtitle')}
        </p>
      </div>

      {/* ── Contact cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Discord */}
        <div className="relative flex flex-col gap-3 p-5 rounded-xl bg-surface-low border border-outline/20 hover:border-blue-500/30 transition-colors">
          <span className="absolute top-4 right-4 text-[9px] font-mono tracking-widest text-blue-400 uppercase">Live Support</span>
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-mono font-bold text-on-surface text-sm">Discord Server</h3>
            <p className="text-xs text-on-surface-dim mt-1 leading-relaxed">
              {t('support.discord.desc')}
            </p>
          </div>
          <a href="#" onClick={e => e.preventDefault()} className="mt-auto text-[11px] font-mono font-bold text-blue-400 hover:text-blue-300 tracking-wider uppercase flex items-center gap-1 transition-colors">
            {t('support.discord.link')}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>

        {/* GitHub */}
        <div className="relative flex flex-col gap-3 p-5 rounded-xl bg-surface-low border border-outline/20 hover:border-emerald-500/30 transition-colors">
          <span className="absolute top-4 right-4 text-[9px] font-mono tracking-widest text-emerald-400 uppercase">Open Source</span>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-mono font-bold text-on-surface text-sm">GitHub Repos</h3>
            <p className="text-xs text-on-surface-dim mt-1 leading-relaxed">
              {t('support.github.desc')}
            </p>
          </div>
          <a href="#" onClick={e => e.preventDefault()} className="mt-auto text-[11px] font-mono font-bold text-emerald-400 hover:text-emerald-300 tracking-wider uppercase flex items-center gap-1 transition-colors">
            {t('support.github.link')}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>

        {/* Email */}
        <div className="relative flex flex-col gap-3 p-5 rounded-xl bg-surface-low border border-outline/20 hover:border-violet-500/30 transition-colors">
          <span className="absolute top-4 right-4 text-[9px] font-mono tracking-widest text-violet-400 uppercase">Direct Contact</span>
          <div className="w-10 h-10 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
            </svg>
          </div>
          <div>
            <h3 className="font-mono font-bold text-on-surface text-sm">Email Support</h3>
            <p className="text-xs text-on-surface-dim mt-1 leading-relaxed">
              {t('support.email.desc')}
            </p>
          </div>
          <a href="mailto:soporte@calcing.app" className="mt-auto text-[11px] font-mono font-bold text-violet-400 hover:text-violet-300 tracking-wider uppercase flex items-center gap-1 transition-colors">
            {t('support.email.link')}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>
      </div>

      {/* ── System Status + Ticket Form ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* System Status */}
        <div className="rounded-xl bg-surface-low border border-outline/20 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-outline/20">
            <span className="text-[11px] font-mono font-bold tracking-widest text-on-surface uppercase">
              {t('support.status.title')}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              {t('support.status.live')}
            </span>
          </div>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-outline/15">
                <th className="text-left px-5 py-2 text-[10px] tracking-widest text-on-surface-dim uppercase font-normal">{t('support.table.service')}</th>
                <th className="text-left px-3 py-2 text-[10px] tracking-widest text-on-surface-dim uppercase font-normal">{t('support.table.uptime')}</th>
                <th className="text-left px-3 py-2 text-[10px] tracking-widest text-on-surface-dim uppercase font-normal">{t('support.table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {SERVICES.map(svc => (
                <tr key={svc.name} className="border-b border-outline/15 last:border-0">
                  <td className="px-5 py-3 text-on-surface tracking-wide">{svc.name}</td>
                  <td className="px-3 py-3 text-on-surface-dim">{svc.uptime}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest ${STATUS_STYLE[svc.status]}`}>
                      {svc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-outline/15">
            <p className="text-[10px] font-mono text-on-surface-dim leading-relaxed">
              {t('support.incident')}
            </p>
          </div>
        </div>

        {/* Ticket Form */}
        <div className="rounded-xl bg-surface-low border border-outline/20 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-cta shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
            <h2 className="font-mono font-bold text-on-surface text-sm tracking-wider">{t('support.ticket.title')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono tracking-[0.15em] text-on-surface-dim uppercase mb-1">{t('support.ticket.fullName')}</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder={t('support.ticket.fullNamePh')}
                className="w-full bg-surface-mid border border-outline/25 rounded-lg px-3 py-2 text-xs font-mono text-on-surface placeholder:text-on-surface-dim/60 focus:outline-none focus:border-primary-cta/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-[0.15em] text-on-surface-dim uppercase mb-1">{t('support.ticket.engId')}</label>
              <input
                type="text"
                value={engId}
                onChange={e => setEngId(e.target.value)}
                placeholder={t('support.ticket.engIdPh')}
                className="w-full bg-surface-mid border border-outline/25 rounded-lg px-3 py-2 text-xs font-mono text-on-surface placeholder:text-on-surface-dim/60 focus:outline-none focus:border-primary-cta/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-[0.15em] text-on-surface-dim uppercase mb-1">{t('support.ticket.category')}</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as TranslationKey)}
              className="w-full bg-surface-mid border border-outline/25 rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary-cta/50 transition-all appearance-none"
            >
              {CATEGORY_KEYS.map(c => <option key={c} value={c} className="bg-gray-900">{t(c)}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-[0.15em] text-on-surface-dim uppercase mb-1">{t('support.ticket.description')}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('support.ticket.descPh')}
              rows={4}
              className="w-full bg-surface-mid border border-outline/25 rounded-lg px-3 py-2 text-xs font-mono text-on-surface placeholder:text-on-surface-dim/60 focus:outline-none focus:border-primary-cta/50 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={critical}
                onChange={e => setCritical(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary-cta"
              />
              <span className="text-[10px] font-mono tracking-[0.15em] text-on-surface-dim uppercase">{t('support.ticket.critical')}</span>
            </label>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleDispatch}
                disabled={!fullName.trim() || !description.trim() || submitting}
                className="px-5 py-2 bg-primary-cta text-white text-[11px] font-mono font-bold tracking-widest uppercase rounded-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitted
                  ? t('support.ticket.dispatched')
                  : submitting
                    ? t('support.ticket.dispatching')
                    : t('support.ticket.dispatch')}
              </button>
              {error && (
                <span data-testid="support-error" className="text-[10px] font-mono text-red-400">
                  {error}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-lg font-mono font-black tracking-[0.2em] uppercase text-on-surface">
            {t('support.faq.title')}
          </h2>
          <div className="w-10 h-0.5 bg-primary-cta mx-auto mt-2 rounded-full"/>
        </div>

        <div className="space-y-2">
          {FAQ_KEYS.map((faq, i) => (
            <div key={i} className="rounded-xl border border-outline/20 bg-surface-low overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-mid transition-colors"
              >
                <span className="text-sm font-mono text-on-surface pr-4">{t(faq.q)}</span>
                <svg
                  className={`w-4 h-4 shrink-0 text-on-surface-dim transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 border-t border-outline/15">
                  <p className="text-xs text-on-surface-dim leading-relaxed pt-3 font-mono">{t(faq.a)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
