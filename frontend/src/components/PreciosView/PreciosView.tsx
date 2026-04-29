import { useEffect, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { TranslationKey } from '@engine/i18n';
import {
  cancelSubscription,
  createCheckout,
  getBillingStatus,
  getPlans,
  type Plan,
} from '../../services/billingService';

interface PreciosViewProps {
  currentPlan?: string;
  isLoggedIn?: boolean;
  onRequestLogin?: () => void;
}

function CheckIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ) : (
    <svg className="w-4 h-4 text-on-surface-dim/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  );
}

function formatPrice(amount: number, currency: string): string {
  if (amount === 0) return '0';
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function PreciosView({ currentPlan = 'free', isLoggedIn = false, onRequestLogin }: PreciosViewProps) {
  const { t } = useI18n();
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    let alive = true;
    getPlans()
      .then(data => { if (alive) { setPlans(data); setLoadingPlans(false); } })
      .catch(() => { if (alive) { setError(t('pricing.checkoutError' as TranslationKey)); setLoadingPlans(false); } });
    return () => { alive = false; };
  }, [t]);

  async function handleCheckout(plan: Plan) {
    if (!isLoggedIn) {
      onRequestLogin?.();
      return;
    }
    if (plan.tier === 'free' || plan.tier === currentPlan) return;

    const cycle = annual ? 'annual' : 'monthly';
    const isAvailable = annual ? plan.has_annual : plan.has_monthly;
    if (!isAvailable) {
      setError(t('pricing.notConfigured' as TranslationKey));
      return;
    }

    setLoading(plan.tier);
    setError(null);
    try {
      const { url } = await createCheckout(plan.tier, cycle);
      window.location.href = url;
    } catch {
      setError(t('pricing.checkoutError' as TranslationKey));
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel() {
    const confirmMsg = t('pricing.cancelConfirm' as TranslationKey);
    if (!window.confirm(confirmMsg)) return;

    setLoading('cancel');
    setError(null);
    try {
      await cancelSubscription();
      const status = await getBillingStatus();
      localStorage.setItem('calcing_plan', status.plan);
      window.location.reload();
    } catch {
      setError(t('pricing.cancelError' as TranslationKey));
    } finally {
      setLoading(null);
    }
  }

  // Plan a destacar visualmente: el del usuario, o si es free, el is_recommended.
  const highlightTier: string =
    currentPlan !== 'free'
      ? currentPlan
      : plans.find(p => p.is_recommended)?.tier ?? '';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 space-y-14 overflow-y-auto">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-mono font-black text-on-surface tracking-tight">
          {t('pricing.hero.title')}
        </h1>
        <p className="text-sm text-on-surface-dim max-w-lg mx-auto leading-relaxed">
          {t('pricing.hero.subtitle')}
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className={`text-sm font-mono ${!annual ? 'text-on-surface' : 'text-on-surface-dim'}`}>{t('pricing.toggle.monthly')}</span>
          <button
            onClick={() => setAnnual(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${annual ? 'bg-primary-cta' : 'bg-surface-high'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${annual ? 'translate-x-5' : 'translate-x-0'}`}/>
          </button>
          <span className={`text-sm font-mono ${annual ? 'text-on-surface' : 'text-on-surface-dim'}`}>{t('pricing.toggle.annual')}</span>
          {annual && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold tracking-widest uppercase">
              {t('pricing.toggle.discount')}
            </span>
          )}
        </div>
      </div>

      {/* ── Plan cards ───────────────────────────────────────────────── */}
      {loadingPlans ? (
        <p className="text-center text-xs font-mono text-on-surface-dim">...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {plans.map(plan => {
            const isActive    = plan.tier === currentPlan;
            const isHighlight = plan.tier === highlightTier;
            const price       = annual ? plan.price_annual : plan.price_monthly;
            const isAvailable = plan.tier === 'free' || (annual ? plan.has_annual : plan.has_monthly);
            const ctaStyle = isHighlight
              ? 'bg-primary-cta text-white hover:brightness-110'
              : 'border border-outline/30 text-on-surface hover:bg-surface-mid';

            return (
              <div
                key={plan.tier}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                  isHighlight
                    ? 'border-primary-cta bg-primary-cta/5 shadow-[0_0_40px_rgba(37,99,235,0.15)]'
                    : 'border-outline/25 bg-surface-low'
                }`}
              >
                {/* "TU PLAN" badge */}
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary-cta text-white text-[10px] font-mono font-black tracking-widest uppercase whitespace-nowrap">
                    {t('pricing.badge.yourPlan')}
                  </div>
                )}

                {/* Plan name + price */}
                <div className="mb-4">
                  <p className="text-xs font-mono font-bold tracking-[0.2em] text-on-surface-dim uppercase mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl md:text-4xl font-mono font-black text-on-surface">
                      {formatPrice(price, plan.currency)}
                    </span>
                    <span className="text-on-surface-dim font-mono text-sm mb-1">{t('pricing.unit')}</span>
                  </div>
                  {plan.subtitle_key && (
                    <p className="text-[10px] font-mono tracking-widest text-on-surface-dim uppercase mt-1">
                      {t(plan.subtitle_key as TranslationKey)}
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-2.5 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckIcon ok={f.included}/>
                      <span className={`text-xs leading-relaxed ${f.included ? 'text-on-surface' : 'text-on-surface-dim/70'}`}>
                        {t(f.key as TranslationKey)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={isActive || loading !== null || !isAvailable}
                  title={!isAvailable ? t('pricing.notConfigured' as TranslationKey) : undefined}
                  className={`w-full py-3 rounded-xl font-mono font-bold text-xs tracking-widest uppercase transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${ctaStyle}`}
                >
                  {loading === plan.tier
                    ? '...'
                    : isActive
                      ? t('pricing.badge.yourPlan')
                      : plan.cta_key
                        ? t(plan.cta_key as TranslationKey)
                        : plan.name}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Error / Portal ────────────────────────────────────────── */}
      {error && (
        <p className="text-center text-xs text-red-400 font-mono">{error}</p>
      )}
      {isLoggedIn && currentPlan !== 'free' && (
        <div className="text-center">
          <button
            onClick={handleCancel}
            disabled={loading !== null}
            className="text-xs font-mono text-red-400 underline underline-offset-4 hover:brightness-125 transition-all disabled:opacity-50"
          >
            {loading === 'cancel' ? '...' : t('pricing.cancelSubscription' as TranslationKey)}
          </button>
        </div>
      )}

      {/* ── Why CalcIng Engine ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-outline/20">
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-on-surface-dim uppercase mb-2">{t('pricing.why.sectionLabel')}</p>
            <h2 className="text-2xl font-mono font-black text-on-surface">{t('pricing.why.title')}</h2>
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
                titleKey: 'pricing.why.latency' as TranslationKey,
                descKey: 'pricing.why.latencyDesc' as TranslationKey,
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                ),
                color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25',
                titleKey: 'pricing.why.encrypted' as TranslationKey,
                descKey: 'pricing.why.encryptedDesc' as TranslationKey,
              },
            ].map(item => (
              <div key={item.titleKey} className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-mono font-bold text-sm text-on-surface mb-1">{t(item.titleKey)}</h4>
                  <p className="text-xs text-on-surface-dim leading-relaxed">{t(item.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-2xl border border-outline/20 bg-surface-low overflow-hidden flex flex-col">
          <div className="flex-1 p-6 space-y-3">
            {[
              { label: 'API_GATEWAY',  val: '99.9%',  ok: true  },
              { label: 'CAS_ENGINE',   val: '97.42%', ok: true  },
              { label: 'DB_CLUST_01',  val: '99.99%', ok: true  },
              { label: 'REDIS_CACHE',  val: '90.08%', ok: false },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs font-mono text-on-surface-dim tracking-widest">{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-on-surface-dim">{s.val}</span>
                  <span className={`w-2 h-2 rounded-full ${s.ok ? 'bg-emerald-400' : 'bg-red-400'}`}/>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-outline/20 bg-surface-highest/40">
            <p className="text-[10px] font-mono text-on-surface-dim/70 tracking-widest">SYS_STATUS: OPTIMAL [v4.2.0]</p>
          </div>
        </div>
      </div>
    </div>
  );
}
