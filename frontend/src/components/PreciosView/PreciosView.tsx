import { useState } from 'react';

interface PreciosViewProps {
  currentPlan?: string;
}

const PLANS = [
  {
    id: 'free',
    name: 'FREE',
    price: { monthly: 0, annual: 0 },
    sub: 'ENTRY LEVEL RESEARCH',
    color: 'slate',
    features: [
      { text: '100 Basic Calculations/day', included: true },
      { text: 'Standard Library Access',    included: true },
      { text: '2 Local Projects',           included: false },
      { text: 'No API Access',              included: false },
    ],
    cta: 'GET STARTED',
    ctaStyle: 'border border-white/15 text-slate-300 hover:bg-white/5',
  },
  {
    id: 'pro',
    name: 'PRO',
    price: { monthly: 9, annual: 7 },
    sub: 'ADVANCED ENGINEERING',
    color: 'blue',
    features: [
      { text: 'Unlimited High-Precision Calc', included: true },
      { text: 'Full Scientific Constants Lib',  included: true },
      { text: 'Unlimited Cloud Projects',       included: true },
      { text: 'Extended Export Options',        included: true },
      { text: 'Basic API Webhooks',             included: true },
    ],
    cta: 'UPGRADE NOW',
    ctaStyle: 'bg-primary-cta text-white hover:brightness-110',
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    price: { monthly: 29, annual: 23 },
    sub: 'TEAM DEPLOYMENT',
    color: 'slate',
    features: [
      { text: 'Everything in Pro',          included: true },
      { text: 'SSO & Team Auth',            included: true },
      { text: 'Custom Compute Clusters',    included: true },
      { text: '24/7 Dedicated Support',     included: true },
      { text: 'Advanced Admin Console',     included: true },
    ],
    cta: 'CONTACT SALES',
    ctaStyle: 'border border-white/15 text-slate-300 hover:bg-white/5',
  },
] as const;

function CheckIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ) : (
    <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  );
}

export function PreciosView({ currentPlan = 'free' }: PreciosViewProps) {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 space-y-14 overflow-y-auto">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-mono font-black text-on-surface tracking-tight">
          Precision Tiers
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          Select the computational power required for your engineering workflow.
          Scale from sandbox experimentation to enterprise-grade cluster processing.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className={`text-sm font-mono ${!annual ? 'text-on-surface' : 'text-slate-500'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${annual ? 'bg-primary-cta' : 'bg-white/15'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${annual ? 'translate-x-5' : 'translate-x-0'}`}/>
          </button>
          <span className={`text-sm font-mono ${annual ? 'text-on-surface' : 'text-slate-500'}`}>Annual</span>
          {annual && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold tracking-widest uppercase">
              20% Discount
            </span>
          )}
        </div>
      </div>

      {/* ── Plan cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {PLANS.map(plan => {
          const isActive = plan.id === currentPlan;
          const isPro    = plan.id === 'pro';
          const price    = annual ? plan.price.annual : plan.price.monthly;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                isPro
                  ? 'border-primary-cta bg-primary-cta/5 shadow-[0_0_40px_rgba(37,99,235,0.15)]'
                  : 'border-white/10 bg-surface-low'
              }`}
            >
              {/* "TU PLAN" badge */}
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary-cta text-white text-[10px] font-mono font-black tracking-widest uppercase whitespace-nowrap">
                  Tu Plan
                </div>
              )}

              {/* Plan name */}
              <div className="mb-4">
                <p className="text-xs font-mono font-bold tracking-[0.2em] text-slate-400 uppercase mb-1">{plan.name}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-mono font-black text-on-surface">${price}</span>
                  <span className="text-slate-500 font-mono text-sm mb-1">/mo</span>
                </div>
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mt-1">{plan.sub}</p>
              </div>

              {/* Features */}
              <ul className="flex-1 space-y-2.5 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckIcon ok={f.included}/>
                    <span className={`text-xs leading-relaxed ${f.included ? 'text-slate-300' : 'text-slate-600'}`}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`w-full py-3 rounded-xl font-mono font-bold text-xs tracking-widest uppercase transition-all active:scale-95 ${plan.ctaStyle}`}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Why CalcIng Engine ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/8">
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-slate-500 uppercase mb-2">Infrastructure Layer</p>
            <h2 className="text-2xl font-mono font-black text-on-surface">Why CalcIng Engine?</h2>
          </div>
          <div className="space-y-5">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                ),
                color: 'text-blue-400 bg-blue-500/15 border-blue-500/25',
                title: 'Ultra-Low Latency',
                desc: 'Global edge network ensures your mathematical modeling runs in real-time without computational bottleneck.',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                ),
                color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25',
                title: 'Encrypted Logic',
                desc: 'End-to-end encryption for your proprietary formulas and data sets. Not even we can see your inputs.',
              },
            ].map(item => (
              <div key={item.title} className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-mono font-bold text-sm text-on-surface mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-2xl border border-white/8 bg-surface-low overflow-hidden flex flex-col">
          <div className="flex-1 p-6 space-y-3">
            {[
              { label: 'API_GATEWAY',  val: '99.9%',  ok: true  },
              { label: 'CAS_ENGINE',   val: '97.42%', ok: true  },
              { label: 'DB_CLUST_01',  val: '99.99%', ok: true  },
              { label: 'REDIS_CACHE',  val: '90.08%', ok: false },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 tracking-widest">{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">{s.val}</span>
                  <span className={`w-2 h-2 rounded-full ${s.ok ? 'bg-emerald-400' : 'bg-red-400'}`}/>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-white/8 bg-black/20">
            <p className="text-[10px] font-mono text-slate-600 tracking-widest">SYS_STATUS: OPTIMAL [v4.2.0]</p>
          </div>
        </div>
      </div>
    </div>
  );
}
