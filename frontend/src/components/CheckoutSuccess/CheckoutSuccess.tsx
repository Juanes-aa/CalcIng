import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { getStoredToken, refresh as refreshToken } from '../../services/authService';
import {
  getBillingStatus,
  getPlans,
  type BillingStatus,
  type Plan,
} from '../../services/billingService';

type Phase = 'processing' | 'confirmed' | 'timeout';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

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

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function navigateHome(): void {
  window.history.replaceState({}, '', '/');
  // Hard reload to remount App in non-checkout-success state.
  window.location.reload();
}

function navigatePricing(): void {
  window.history.replaceState({}, '', '/');
  window.location.hash = '';
  window.location.reload();
}

export function CheckoutSuccess(): JSX.Element {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('processing');
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const cancelRef = useRef<boolean>(false);

  useEffect(() => {
    cancelRef.current = false;

    // Cache catálogo para mostrar precio/moneda formateado.
    getPlans().then(p => { if (!cancelRef.current) setPlans(p); }).catch(() => { /* opcional */ });

    async function poll(): Promise<void> {
      const token = getStoredToken();
      if (!token) {
        setPhase('timeout');
        return;
      }
      // Refrescar el JWT para que `plan` refleje DB.
      try {
        await refreshToken();
      } catch {
        setPhase('timeout');
        return;
      }

      const start = Date.now();
      while (!cancelRef.current && Date.now() - start < POLL_TIMEOUT_MS) {
        try {
          const s = await getBillingStatus();
          setStatus(s);
          if (s.plan && s.plan !== 'free') {
            localStorage.setItem('calcing_plan', s.plan);
            setPhase('confirmed');
            return;
          }
        } catch {
          // silent — reintenta
        }
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      }
      if (!cancelRef.current) setPhase('timeout');
    }

    poll();

    return () => { cancelRef.current = true; };
  }, []);

  const planRow = status ? plans.find(p => p.tier === status.plan) ?? null : null;

  return (
    <div className="min-h-dvh w-full bg-surface text-on-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-outline/25 bg-surface-low p-8 space-y-6 shadow-[0_0_60px_rgba(37,99,235,0.08)]">

        {/* Icon + title */}
        <div className="flex flex-col items-center text-center space-y-3">
          {phase === 'processing' && (
            <div className="w-14 h-14 rounded-full border-4 border-primary-cta/30 border-t-primary-cta animate-spin" />
          )}
          {phase === 'confirmed' && (
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {phase === 'timeout' && (
            <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}

          <h1 className="text-2xl font-mono font-black tracking-tight">
            {phase === 'confirmed' ? t('checkout.success.confirmed') : t('checkout.success.title')}
          </h1>
          <p className="text-sm text-on-surface-dim leading-relaxed max-w-sm">
            {phase === 'processing' && t('checkout.success.subtitle')}
            {phase === 'confirmed' && t('checkout.success.confirmedDesc')}
            {phase === 'timeout' && t('checkout.success.timeout')}
          </p>
        </div>

        {/* Detail rows (only when confirmed) */}
        {phase === 'confirmed' && status && (
          <div className="rounded-xl border border-outline/20 bg-surface-mid/40 divide-y divide-outline/15">
            <Row
              label={t('checkout.success.plan')}
              value={(planRow?.name ?? status.plan).toUpperCase()}
            />
            {planRow && (
              <Row
                label={t('checkout.success.amount')}
                value={`${formatPrice(planRow.price_monthly, planRow.currency)} ${t('pricing.unit')}`}
              />
            )}
            <Row
              label={t('checkout.success.nextBilling')}
              value={formatDate(status.expires_at)}
            />
          </div>
        )}

        {/* Processing tiny status (informational while polling) */}
        {phase === 'processing' && (
          <p className="text-center text-[11px] font-mono tracking-widest text-on-surface-dim/80 uppercase">
            {t('checkout.success.processing')}
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-2 pt-2">
          {phase === 'confirmed' && (
            <button
              onClick={navigateHome}
              className="w-full py-3 rounded-xl bg-primary-cta text-white font-mono font-bold text-xs tracking-widest uppercase hover:brightness-110 transition-all active:scale-95"
            >
              {t('checkout.success.cta.calculator')}
            </button>
          )}
          {phase === 'timeout' && (
            <>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 rounded-xl bg-primary-cta text-white font-mono font-bold text-xs tracking-widest uppercase hover:brightness-110 transition-all active:scale-95"
              >
                {t('checkout.success.cta.retry')}
              </button>
              <button
                onClick={navigatePricing}
                className="w-full py-3 rounded-xl border border-outline/30 text-on-surface font-mono font-bold text-xs tracking-widest uppercase hover:bg-surface-mid transition-all active:scale-95"
              >
                {t('checkout.success.cta.pricing')}
              </button>
            </>
          )}
          {phase === 'processing' && (
            <button
              onClick={navigateHome}
              className="w-full py-3 rounded-xl border border-outline/30 text-on-surface-dim font-mono font-bold text-xs tracking-widest uppercase hover:bg-surface-mid transition-all active:scale-95"
            >
              {t('checkout.success.cta.calculator')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface RowProps { label: string; value: string }

function Row({ label, value }: RowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[11px] font-mono tracking-widest text-on-surface-dim uppercase">{label}</span>
      <span className="text-sm font-mono font-bold text-on-surface">{value}</span>
    </div>
  );
}

export default CheckoutSuccess;
