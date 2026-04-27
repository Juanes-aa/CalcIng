import { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { TranslationKey } from '@engine/i18n';

type DocSection = 'inicio' | 'calculadora' | 'cas' | 'graficados' | 'api' | 'ejemplos';

const DOC_NAV: { id: DocSection; labelKey: TranslationKey; icon: ReactNode }[] = [
  {
    id: 'inicio',
    labelKey: 'doc.nav.inicio',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  },
  {
    id: 'calculadora',
    labelKey: 'doc.nav.calculadora',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1z"/></svg>,
  },
  {
    id: 'cas',
    labelKey: 'doc.nav.cas',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.871 4A17.926 17.926 0 003 12c0 2.874.673 5.59 1.871 8m14.13 0a17.926 17.926 0 001.87-8 17.926 17.926 0 00-1.87-8M9 9h1.246a1 1 0 01.961.725l1.586 5.55a1 1 0 00.961.725H15m1-7h-.08a2 2 0 00-1.519.698L9.6 15.302A2 2 0 018.08 16H8"/></svg>,
  },
  {
    id: 'graficados',
    labelKey: 'doc.nav.graficados',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>,
  },
  {
    id: 'api',
    labelKey: 'doc.nav.api',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>,
  },
  {
    id: 'ejemplos',
    labelKey: 'doc.nav.ejemplos',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  },
];

function CodeBlock({ label, lines }: { label: string; lines: { type: 'in' | 'out'; idx: string; code: string }[] }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  function copy() {
    const text = lines.map(l => l.code).join('\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }
  return (
    <div className="rounded-xl border border-outline/20 overflow-hidden font-mono text-sm my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-mid border-b border-outline/20">
        <span className="text-[10px] tracking-widest text-on-surface-dim uppercase">{label}</span>
        <button onClick={copy} className="text-[10px] text-on-surface-dim hover:text-on-surface transition-colors uppercase tracking-widest">
          {copied ? t('doc.codeBlock.copied') : '⧉'}
        </button>
      </div>
      <div className="px-5 py-4 space-y-1 bg-surface">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-4">
            <span className={`shrink-0 w-16 text-right text-xs ${l.type === 'in' ? 'text-on-surface-dim' : 'text-emerald-400'}`}>
              {l.type === 'in' ? `In [${l.idx}]:` : `Out [${l.idx}]:`}
            </span>
            <span className={`text-xs leading-relaxed ${l.type === 'in' ? 'text-on-surface' : 'text-emerald-400'}`}>{l.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InlineCode({ children }: { children: string }) {
  return <code className="px-1.5 py-0.5 rounded bg-surface-high text-primary text-xs font-mono border border-outline/25">{children}</code>;
}

function SectionAnchor({ id }: { id: string }) {
  return <span id={id} className="block relative -top-4" />;
}

// ── Sections content ──────────────────────────────────────────────────────────

function DocInicio() {
  const { t } = useI18n();
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs text-on-surface-dim font-mono mb-3 flex items-center gap-2">
          <span>{t('doc.breadcrumb')}</span><span className="text-on-surface-dim/70">/</span><span className="text-on-surface">{t('doc.nav.inicio')}</span>
        </div>
        <h1 className="text-3xl font-mono font-black text-on-surface mb-4">{t('doc.inicio.title')}</h1>
        <p className="text-sm text-on-surface-dim leading-relaxed max-w-xl">
          {t('doc.inicio.subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { labelKey: 'doc.inicio.cardCalc' as TranslationKey, descKey: 'doc.inicio.cardCalcDesc' as TranslationKey, color: 'blue' },
          { labelKey: 'doc.inicio.cardCas' as TranslationKey, descKey: 'doc.inicio.cardCasDesc' as TranslationKey, color: 'violet' },
          { labelKey: 'doc.inicio.cardGraph' as TranslationKey, descKey: 'doc.inicio.cardGraphDesc' as TranslationKey, color: 'emerald' },
          { labelKey: 'doc.inicio.cardApi' as TranslationKey, descKey: 'doc.inicio.cardApiDesc' as TranslationKey, color: 'amber' },
        ].map(c => (
          <div key={c.labelKey} className="p-4 rounded-xl border border-outline/20 bg-surface-low hover:border-outline/30 transition-colors">
            <h3 className="font-mono font-bold text-sm text-on-surface mb-1">{t(c.labelKey)}</h3>
            <p className="text-xs text-on-surface-dim">{t(c.descKey)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocCAS() {
  const { t } = useI18n();
  return (
    <div className="space-y-10">
      <div>
        <div className="text-xs text-on-surface-dim font-mono mb-3 flex items-center gap-2">
          <span>{t('doc.breadcrumb')}</span><span className="text-on-surface-dim/70">/</span><span className="text-on-surface">{t('doc.cas.title')}</span>
        </div>
        <h1 className="text-3xl font-mono font-black text-on-surface mb-4">{t('doc.cas.title')}</h1>
        <p className="text-sm text-on-surface-dim leading-relaxed max-w-xl">
          {t('doc.cas.subtitle')}
        </p>
      </div>

      {/* Intro box */}
      <div className="rounded-xl border-l-4 border-primary-cta bg-primary-cta/5 border border-primary-cta/20 p-5 space-y-3">
        <h3 className="font-mono font-bold text-sm text-on-surface">{t('doc.cas.introTitle')}</h3>
        <p className="text-xs text-on-surface-dim leading-relaxed">
          {t('doc.cas.introDesc')}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {['EXACTITUD: 128-BIT', 'IPRK V4 1.0', 'THREAD: MULTI-CORE'].map(b => (
            <span key={b} className="px-2 py-0.5 rounded bg-surface-mid border border-outline/25 text-[10px] font-mono text-on-surface-dim tracking-widest">{b}</span>
          ))}
        </div>
      </div>

      {/* Diferenciación */}
      <div>
        <SectionAnchor id="diferenciacion" />
        <h2 className="text-xl font-mono font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="text-primary-cta">≈</span> {t('doc.cas.diffTitle')}
        </h2>
        <p className="text-sm text-on-surface-dim leading-relaxed mb-1">
          {t('doc.cas.diffDesc')} <InlineCode>diff(f, x)</InlineCode>.
        </p>
        <CodeBlock
          label={t('doc.cas.labInput')}
          lines={[
            { type: 'in',  idx: '1', code: 'f = sin(x)**2 * exp(2*x)' },
            { type: 'in',  idx: '2', code: 'diff(f, x)' },
            { type: 'out', idx: '2', code: '2*exp(2*x)*sin(x)**2 +' },
            { type: 'out', idx: '',  code: '2*exp(2*x)*sin(x)*cos(x)' },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-surface-low border border-outline/20 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1z"/></svg>
            </div>
            <h4 className="font-mono font-bold text-sm text-on-surface">{t('doc.cas.autoSimp')}</h4>
            <p className="text-xs text-on-surface-dim leading-relaxed">{t('doc.cas.autoSimpDesc')}</p>
            <div className="mt-2 px-3 py-2 rounded-lg bg-surface border border-outline/20 text-xs font-mono text-emerald-400">
              simplify(sin(x)**2 + cos(x)**2) + 1
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-low border border-outline/20 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h4 className="font-mono font-bold text-sm text-on-surface">{t('doc.cas.cache')}</h4>
            <p className="text-xs text-on-surface-dim leading-relaxed">{t('doc.cas.cacheDesc')}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-surface-mid overflow-hidden">
                <div className="h-full w-[68%] bg-emerald-500 rounded-full"/>
              </div>
              <span className="text-[10px] font-mono text-on-surface-dim">PAR HIT RATE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Integración */}
      <div>
        <SectionAnchor id="integracion" />
        <h2 className="text-xl font-mono font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="text-primary-cta">⊞</span> {t('doc.cas.intTitle')}
        </h2>
        <p className="text-sm text-on-surface-dim leading-relaxed mb-1">
          {t('doc.cas.intDesc')}
        </p>
        <CodeBlock
          label={t('doc.cas.labSymbolic')}
          lines={[
            { type: 'in',  idx: '3', code: 'integrate(log(x), x)' },
            { type: 'out', idx: '3', code: 'x*log(x) - x' },
          ]}
        />
      </div>

      {/* Algoritmo de Risch */}
      <div>
        <SectionAnchor id="risch" />
        <h2 className="text-xl font-mono font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="text-primary-cta">∂</span> {t('doc.cas.rischTitle')}
        </h2>
        <p className="text-sm text-on-surface-dim leading-relaxed">
          {t('doc.cas.rischDesc')}
        </p>
        <CodeBlock
          label={t('doc.cas.labSymbolic')}
          lines={[
            { type: 'in',  idx: '4', code: 'integrate(exp(x)/x, x)' },
            { type: 'out', idx: '4', code: 'Ei(x)' },
          ]}
        />
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-outline/20 flex items-center justify-between text-[10px] font-mono text-on-surface-dim/70 tracking-widest uppercase">
        <span>{t('doc.footer.lastUpdate')}</span>
        <div className="flex gap-6">
          <a href="#" onClick={e => e.preventDefault()} className="hover:text-on-surface-dim transition-colors">{t('doc.footer.github')}</a>
          <a href="#" onClick={e => e.preventDefault()} className="hover:text-on-surface-dim transition-colors">{t('doc.footer.community')}</a>
        </div>
      </div>
    </div>
  );
}

function DocCalculadora() {
  const { t } = useI18n();
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs text-on-surface-dim font-mono mb-3 flex items-center gap-2">
          <span>{t('doc.breadcrumb')}</span><span className="text-on-surface-dim/70">/</span><span className="text-on-surface">{t('doc.calc.title')}</span>
        </div>
        <h1 className="text-3xl font-mono font-black text-on-surface mb-4">{t('doc.calc.title')}</h1>
        <p className="text-sm text-on-surface-dim leading-relaxed max-w-xl">
          {t('doc.calc.subtitle')}
        </p>
      </div>
      <CodeBlock
        label={t('doc.calc.labCalc')}
        lines={[
          { type: 'in',  idx: '1', code: 'sin(pi/4) + cos(pi/4)' },
          { type: 'out', idx: '1', code: '1.41421356...' },
          { type: 'in',  idx: '2', code: 'log(e**3)' },
          { type: 'out', idx: '2', code: '3' },
        ]}
      />
    </div>
  );
}

// ── Graficados ───────────────────────────────────────────────────────────────

function DocGraficados() {
  const { t } = useI18n();
  return (
    <div className="space-y-10">
      <div>
        <div className="text-xs text-on-surface-dim font-mono mb-3 flex items-center gap-2">
          <span>{t('doc.breadcrumb')}</span><span className="text-on-surface-dim/70">/</span><span className="text-on-surface">{t('doc.graph.title')}</span>
        </div>
        <h1 className="text-3xl font-mono font-black text-on-surface mb-4">{t('doc.graph.title')}</h1>
        <p className="text-sm text-on-surface-dim leading-relaxed max-w-xl">{t('doc.graph.subtitle')}</p>
      </div>

      {/* Modos */}
      <div>
        <h2 className="text-xl font-mono font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="text-primary-cta">≡</span> {t('doc.graph.modesTitle')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: t('doc.graph.modeCartesian'), desc: t('doc.graph.modeCartesianDesc') },
            { name: t('doc.graph.modeParam'),     desc: t('doc.graph.modeParamDesc') },
            { name: t('doc.graph.modePolar'),     desc: t('doc.graph.modePolarDesc') },
          ].map(m => (
            <div key={m.name} className="p-4 rounded-xl bg-surface-low border border-outline/20">
              <h3 className="font-mono font-bold text-sm text-on-surface mb-1">{m.name}</h3>
              <p className="text-xs text-on-surface-dim leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div>
        <h2 className="text-xl font-mono font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="text-primary-cta">⌨</span> {t('doc.graph.inputTitle')}
        </h2>
        <p className="text-sm text-on-surface-dim leading-relaxed mb-3">{t('doc.graph.inputDesc')}</p>
        <CodeBlock
          label={t('doc.graph.labCanvas')}
          lines={[
            { type: 'in', idx: '1', code: 'f1(x) = sin(x)/x' },
            { type: 'in', idx: '2', code: 'f2(x) = cos(x)' },
            { type: 'in', idx: '3', code: 'x ∈ [-2π, 2π]' },
          ]}
        />
      </div>

      {/* Controles */}
      <div>
        <h2 className="text-xl font-mono font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="text-primary-cta">⊕</span> {t('doc.graph.controlsTitle')}
        </h2>
        <ul className="space-y-2 text-sm text-on-surface-dim">
          {[t('doc.graph.ctrlZoom'), t('doc.graph.ctrlPan'), t('doc.graph.ctrlReset'), t('doc.graph.ctrlWindow')].map(c => (
            <li key={c} className="flex gap-2">
              <span className="text-primary-cta shrink-0">▸</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Herramientas */}
      <div>
        <h2 className="text-xl font-mono font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="text-primary-cta">∂</span> {t('doc.graph.toolsTitle')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: t('doc.graph.toolDeriv'),  desc: t('doc.graph.toolDerivDesc') },
            { name: t('doc.graph.toolArea'),   desc: t('doc.graph.toolAreaDesc') },
            { name: t('doc.graph.toolExport'), desc: t('doc.graph.toolExportDesc') },
          ].map(tool => (
            <div key={tool.name} className="p-4 rounded-xl bg-surface-low border border-outline/20">
              <h3 className="font-mono font-bold text-sm text-on-surface mb-1">{tool.name}</h3>
              <p className="text-xs text-on-surface-dim leading-relaxed">{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── API Pública ──────────────────────────────────────────────────────────────

interface ApiEndpoint {
  path:    string;
  method:  'GET' | 'POST';
  authKey: TranslationKey;
  descKey: TranslationKey;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  { path: '/health',         method: 'GET',  authKey: 'doc.api.authNo',       descKey: 'doc.api.descHealth' },
  { path: '/solve',          method: 'POST', authKey: 'doc.api.authOptional', descKey: 'doc.api.descSolve' },
  { path: '/differentiate',  method: 'POST', authKey: 'doc.api.authOptional', descKey: 'doc.api.descDiff' },
  { path: '/integrate',      method: 'POST', authKey: 'doc.api.authOptional', descKey: 'doc.api.descIntegrate' },
  { path: '/simplify',       method: 'POST', authKey: 'doc.api.authOptional', descKey: 'doc.api.descSimplify' },
  { path: '/expand',         method: 'POST', authKey: 'doc.api.authOptional', descKey: 'doc.api.descExpand' },
  { path: '/factor',         method: 'POST', authKey: 'doc.api.authOptional', descKey: 'doc.api.descFactor' },
  { path: '/solve-equation', method: 'POST', authKey: 'doc.api.authOptional', descKey: 'doc.api.descSolveEq' },
  { path: '/evaluate',       method: 'POST', authKey: 'doc.api.authOptional', descKey: 'doc.api.descEvaluate' },
];

function DocApi() {
  const { t } = useI18n();
  return (
    <div className="space-y-10">
      <div>
        <div className="text-xs text-on-surface-dim font-mono mb-3 flex items-center gap-2">
          <span>{t('doc.breadcrumb')}</span><span className="text-on-surface-dim/70">/</span><span className="text-on-surface">{t('doc.api.title')}</span>
        </div>
        <h1 className="text-3xl font-mono font-black text-on-surface mb-4">{t('doc.api.title')}</h1>
        <p className="text-sm text-on-surface-dim leading-relaxed max-w-xl">{t('doc.api.subtitle')}</p>
      </div>

      {/* Base URL */}
      <div className="rounded-xl border-l-4 border-primary-cta bg-primary-cta/5 border border-primary-cta/20 p-5 space-y-2">
        <h3 className="font-mono font-bold text-xs text-on-surface tracking-widest uppercase">{t('doc.api.baseUrl')}</h3>
        <code className="block font-mono text-sm text-emerald-400">https://calcing.onrender.com</code>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-outline/20 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-mid">
            <tr>
              <th className="text-left px-4 py-3 font-mono text-[10px] tracking-widest uppercase text-on-surface-dim">{t('doc.api.tableEndpoint')}</th>
              <th className="text-left px-4 py-3 font-mono text-[10px] tracking-widest uppercase text-on-surface-dim">{t('doc.api.tableMethod')}</th>
              <th className="text-left px-4 py-3 font-mono text-[10px] tracking-widest uppercase text-on-surface-dim">{t('doc.api.tableAuth')}</th>
              <th className="text-left px-4 py-3 font-mono text-[10px] tracking-widest uppercase text-on-surface-dim">{t('doc.api.tableDesc')}</th>
            </tr>
          </thead>
          <tbody>
            {API_ENDPOINTS.map((e, i) => (
              <tr key={e.path} className={`border-t border-outline/10 ${i % 2 === 0 ? 'bg-surface-low' : 'bg-surface'}`}>
                <td className="px-4 py-3"><code className="font-mono text-xs text-primary">{e.path}</code></td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${e.method === 'GET' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>{e.method}</span>
                </td>
                <td className="px-4 py-3 text-xs text-on-surface-dim">{t(e.authKey)}</td>
                <td className="px-4 py-3 text-xs text-on-surface-dim">{t(e.descKey)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ejemplo */}
      <div>
        <h2 className="text-xl font-mono font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="text-primary-cta">⇄</span> {t('doc.api.exampleTitle')}
        </h2>
        <CodeBlock
          label={t('doc.api.exampleReqLabel')}
          lines={[
            { type: 'in', idx: '1', code: 'POST /differentiate' },
            { type: 'in', idx: '2', code: 'Content-Type: application/json' },
            { type: 'in', idx: '3', code: '{ "expression": "x^3 * sin(x)", "variable": "x" }' },
          ]}
        />
        <CodeBlock
          label={t('doc.api.exampleResLabel')}
          lines={[
            { type: 'out', idx: '1', code: '{ "result": "x**3*cos(x) + 3*x**2*sin(x)",' },
            { type: 'out', idx: '',  code: '  "steps": [], "level": "basic" }' },
          ]}
        />
      </div>

      {/* Errores */}
      <div>
        <h2 className="text-xl font-mono font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="text-primary-cta">!</span> {t('doc.api.errorsTitle')}
        </h2>
        <ul className="space-y-2 text-sm text-on-surface-dim">
          {[t('doc.api.error400'), t('doc.api.error402'), t('doc.api.error429'), t('doc.api.error500')].map(e => (
            <li key={e} className="flex gap-2">
              <span className="text-primary-cta shrink-0">▸</span>
              <span className="font-mono text-xs">{e}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Ejemplos ─────────────────────────────────────────────────────────────────

interface DocExample {
  titleKey:  TranslationKey;
  descKey:   TranslationKey;
  engineKey: TranslationKey;
  input:     string;
  output:    string;
}

const EXAMPLES: DocExample[] = [
  { titleKey: 'doc.ex.basicTitle',   descKey: 'doc.ex.basicDesc',   engineKey: 'doc.ex.engineCalc',    input: 'sin(pi/4)^2 + cos(pi/4)^2', output: '1' },
  { titleKey: 'doc.ex.derivTitle',   descKey: 'doc.ex.derivDesc',   engineKey: 'doc.ex.engineCAS',     input: 'd/dx(x^3 * sin(x))',       output: 'x**3*cos(x) + 3*x**2*sin(x)' },
  { titleKey: 'doc.ex.intTitle',     descKey: 'doc.ex.intDesc',     engineKey: 'doc.ex.engineCAS',     input: '∫ exp(-x^2) dx',           output: 'sqrt(pi)*erf(x)/2' },
  { titleKey: 'doc.ex.eqTitle',      descKey: 'doc.ex.eqDesc',      engineKey: 'doc.ex.engineCAS',     input: 'x^2 - 5*x + 6 = 0',        output: 'x = 2, x = 3' },
  { titleKey: 'doc.ex.matTitle',     descKey: 'doc.ex.matDesc',     engineKey: 'doc.ex.engineMatrix',  input: 'det([[1,2,3],[0,1,4],[5,6,0]])', output: '1' },
  { titleKey: 'doc.ex.statTitle',    descKey: 'doc.ex.statDesc',    engineKey: 'doc.ex.engineStat',    input: 'mean(2, 4, 4, 4, 5, 5, 7, 9)', output: 'mean = 5,  σ = 2' },
  { titleKey: 'doc.ex.basesTitle',   descKey: 'doc.ex.basesDesc',   engineKey: 'doc.ex.engineBases',   input: 'decToBin(255)',            output: '11111111' },
  { titleKey: 'doc.ex.complexTitle', descKey: 'doc.ex.complexDesc', engineKey: 'doc.ex.engineComplex', input: '(3 + 2i) * (1 - 4i)',      output: '11 - 10i' },
  { titleKey: 'doc.ex.graphTitle',   descKey: 'doc.ex.graphDesc',   engineKey: 'doc.ex.engineGraph',   input: 'f(x) = sin(x)/x,  area [-π, π]', output: '≈ 3.7038' },
];

function DocEjemplos() {
  const { t } = useI18n();
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs text-on-surface-dim font-mono mb-3 flex items-center gap-2">
          <span>{t('doc.breadcrumb')}</span><span className="text-on-surface-dim/70">/</span><span className="text-on-surface">{t('doc.ex.title')}</span>
        </div>
        <h1 className="text-3xl font-mono font-black text-on-surface mb-4">{t('doc.ex.title')}</h1>
        <p className="text-sm text-on-surface-dim leading-relaxed max-w-xl">{t('doc.ex.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {EXAMPLES.map(ex => (
          <div key={ex.titleKey} className="rounded-xl border border-outline/20 bg-surface-low overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-outline/15 flex items-center justify-between gap-2">
              <h3 className="font-mono font-bold text-sm text-on-surface">{t(ex.titleKey)}</h3>
              <span className="px-2 py-0.5 rounded bg-primary-cta/10 border border-primary-cta/25 text-[10px] font-mono text-primary tracking-widest uppercase shrink-0">
                {t(ex.engineKey)}
              </span>
            </div>
            <div className="px-4 py-3 text-xs text-on-surface-dim leading-relaxed">{t(ex.descKey)}</div>
            <div className="px-4 pb-4 space-y-2">
              <div>
                <span className="block text-[10px] font-mono text-on-surface-dim/70 tracking-widest uppercase mb-1">{t('doc.ex.labelInput')}</span>
                <code className="block px-3 py-2 rounded-lg bg-surface border border-outline/20 font-mono text-xs text-on-surface break-words">{ex.input}</code>
              </div>
              <div>
                <span className="block text-[10px] font-mono text-on-surface-dim/70 tracking-widest uppercase mb-1">{t('doc.ex.labelOutput')}</span>
                <code className="block px-3 py-2 rounded-lg bg-surface border border-outline/20 font-mono text-xs text-emerald-400 break-words">{ex.output}</code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocumentacionView() {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<DocSection>('cas');
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 px-1 pb-3 border-b border-outline/20 shrink-0 overflow-x-auto">
        {DOC_NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
              activeSection === item.id
                ? 'bg-primary-cta/15 text-primary border border-primary-cta/30'
                : 'text-on-surface-dim hover:text-on-surface hover:bg-surface-mid'
            }`}
          >
            {item.icon}
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {activeSection === 'inicio'      && <DocInicio />}
          {activeSection === 'calculadora' && <DocCalculadora />}
          {activeSection === 'cas'         && <DocCAS />}
          {activeSection === 'graficados'  && <DocGraficados />}
          {activeSection === 'api'         && <DocApi />}
          {activeSection === 'ejemplos'    && <DocEjemplos />}
        </div>
      </div>
    </div>
  );
}
