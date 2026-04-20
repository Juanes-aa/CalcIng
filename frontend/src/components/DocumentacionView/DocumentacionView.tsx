import { useState, useRef } from 'react';
import type { ReactNode } from 'react';

type DocSection = 'inicio' | 'calculadora' | 'cas' | 'graficados' | 'api' | 'ejemplos';

const DOC_NAV: { id: DocSection; label: string; icon: ReactNode }[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  },
  {
    id: 'calculadora',
    label: 'Calculadora',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1z"/></svg>,
  },
  {
    id: 'cas',
    label: 'CAS Simbólico',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.871 4A17.926 17.926 0 003 12c0 2.874.673 5.59 1.871 8m14.13 0a17.926 17.926 0 001.87-8 17.926 17.926 0 00-1.87-8M9 9h1.246a1 1 0 01.961.725l1.586 5.55a1 1 0 00.961.725H15m1-7h-.08a2 2 0 00-1.519.698L9.6 15.302A2 2 0 018.08 16H8"/></svg>,
  },
  {
    id: 'graficados',
    label: 'Graficados',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>,
  },
  {
    id: 'api',
    label: 'API Pública',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>,
  },
  {
    id: 'ejemplos',
    label: 'Ejemplos',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  },
];

function CodeBlock({ label, lines }: { label: string; lines: { type: 'in' | 'out'; idx: string; code: string }[] }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    const text = lines.map(l => l.code).join('\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }
  return (
    <div className="rounded-xl border border-white/8 overflow-hidden font-mono text-sm my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/8">
        <span className="text-[10px] tracking-widest text-slate-500 uppercase">{label}</span>
        <button onClick={copy} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">
          {copied ? '✓ Copiado' : '⧉'}
        </button>
      </div>
      <div className="px-5 py-4 space-y-1 bg-[#0a0d14]">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-4">
            <span className={`shrink-0 w-16 text-right text-xs ${l.type === 'in' ? 'text-slate-500' : 'text-emerald-400'}`}>
              {l.type === 'in' ? `In [${l.idx}]:` : `Out [${l.idx}]:`}
            </span>
            <span className={`text-xs leading-relaxed ${l.type === 'in' ? 'text-slate-200' : 'text-emerald-400'}`}>{l.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InlineCode({ children }: { children: string }) {
  return <code className="px-1.5 py-0.5 rounded bg-white/10 text-primary text-xs font-mono border border-white/10">{children}</code>;
}

function SectionAnchor({ id }: { id: string }) {
  return <span id={id} className="block relative -top-4" />;
}

// ── Sections content ──────────────────────────────────────────────────────────

function DocInicio() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs text-slate-500 font-mono mb-3 flex items-center gap-2">
          <span>Docs</span><span className="text-slate-600">/</span><span className="text-slate-300">Inicio</span>
        </div>
        <h1 className="text-3xl font-mono font-black text-on-surface mb-4">Documentación CalcIng</h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
          CalcIng es un motor de cálculo simbólico y numérico diseñado para ingenieros. Explora las secciones para aprender a usar la calculadora, el CAS, los gráficos y la API pública.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Calculadora', desc: 'Operaciones numéricas, funciones y constantes físicas.', color: 'blue' },
          { label: 'CAS Simbólico', desc: 'Álgebra computacional, derivadas e integrales exactas.', color: 'violet' },
          { label: 'Graficados', desc: 'Visualización de funciones en 2D con zoom interactivo.', color: 'emerald' },
          { label: 'API Pública', desc: 'Integra CalcIng en tus aplicaciones vía REST.', color: 'amber' },
        ].map(c => (
          <div key={c.label} className="p-4 rounded-xl border border-white/8 bg-surface-low hover:border-white/15 transition-colors">
            <h3 className="font-mono font-bold text-sm text-on-surface mb-1">{c.label}</h3>
            <p className="text-xs text-slate-400">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocCAS() {
  return (
    <div className="space-y-10">
      <div>
        <div className="text-xs text-slate-500 font-mono mb-3 flex items-center gap-2">
          <span>Docs</span><span className="text-slate-600">/</span><span className="text-slate-300">CAS Simbólico</span>
        </div>
        <h1 className="text-3xl font-mono font-black text-on-surface mb-4">CAS Simbólico</h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
          El motor de álgebra computacional (CAS) de CalcIng permite la manipulación de expresiones matemáticas en forma simbólica, proporcionando resultados exactos en lugar de aproximaciones numéricas.
        </p>
      </div>

      {/* Intro box */}
      <div className="rounded-xl border-l-4 border-primary-cta bg-primary-cta/5 border border-primary-cta/20 p-5 space-y-3">
        <h3 className="font-mono font-bold text-sm text-on-surface">Introducción al Motor de Cálculo</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Nuestro motor está basado en el estándar de la industria para ingeniería aeroespacial, permitiendo la resolución de derivadas de alto orden, integrales indefinidas y simplificación de polinomios complejos con latencia cero.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {['EXACTITUD: 128-BIT', 'IPRK V4 1.0', 'THREAD: MULTI-CORE'].map(b => (
            <span key={b} className="px-2 py-0.5 rounded bg-white/8 border border-white/12 text-[10px] font-mono text-slate-400 tracking-widest">{b}</span>
          ))}
        </div>
      </div>

      {/* Diferenciación */}
      <div>
        <SectionAnchor id="diferenciacion" />
        <h2 className="text-xl font-mono font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="text-primary-cta">≈</span> Diferenciación Simbólica
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-1">
          Para calcular la derivada de una función respecto a una variable dada, utilice el comando <InlineCode>diff(f, x)</InlineCode>.
        </p>
        <CodeBlock
          label="Entrada del Laboratorio"
          lines={[
            { type: 'in',  idx: '1', code: 'f = sin(x)**2 * exp(2*x)' },
            { type: 'in',  idx: '2', code: 'diff(f, x)' },
            { type: 'out', idx: '2', code: '2*exp(2*x)*sin(x)**2 +' },
            { type: 'out', idx: '',  code: '2*exp(2*x)*sin(x)*cos(x)' },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-surface-low border border-white/8 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1z"/></svg>
            </div>
            <h4 className="font-mono font-bold text-sm text-on-surface">Simplificación Automática</h4>
            <p className="text-xs text-slate-400 leading-relaxed">El motor detecta identidades trigonométricas y las reduce al estado de menor entropía visual.</p>
            <div className="mt-2 px-3 py-2 rounded-lg bg-[#0a0d14] border border-white/8 text-xs font-mono text-emerald-400">
              simplify(sin(x)**2 + cos(x)**2) + 1
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-low border border-white/8 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h4 className="font-mono font-bold text-sm text-on-surface">Cache de Resultados</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Las expresiones recurrentes se almacenan en el registro L3 para cálculos en tiempo real.</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-[68%] bg-emerald-500 rounded-full"/>
              </div>
              <span className="text-[10px] font-mono text-slate-500">PAR HIT RATE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Integración */}
      <div>
        <SectionAnchor id="integracion" />
        <h2 className="text-xl font-mono font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="text-primary-cta">⊞</span> Integración Indefinida
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-1">
          Soporte para integrales de Fresnel, funciones Gamma y racionales complejas mediante el algoritmo de Risch.
        </p>
        <CodeBlock
          label="Integrador Simbólico"
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
          <span className="text-primary-cta">∂</span> Algoritmo de Risch
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Para funciones elementales que no tienen antiderivada cerrada, el motor aplica el algoritmo de Risch extendido y retorna una representación en términos de funciones especiales reconocidas (Ei, Li, Si, Ci).
        </p>
        <CodeBlock
          label="Integrador Simbólico"
          lines={[
            { type: 'in',  idx: '4', code: 'integrate(exp(x)/x, x)' },
            { type: 'out', idx: '4', code: 'Ei(x)' },
          ]}
        />
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-white/8 flex items-center justify-between text-[10px] font-mono text-slate-600 tracking-widest uppercase">
        <span>Última actualización: 12 Oct 2023</span>
        <div className="flex gap-6">
          <a href="#" onClick={e => e.preventDefault()} className="hover:text-slate-400 transition-colors">GitHub</a>
          <a href="#" onClick={e => e.preventDefault()} className="hover:text-slate-400 transition-colors">Comunidad</a>
        </div>
      </div>
    </div>
  );
}

function DocCalculadora() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs text-slate-500 font-mono mb-3 flex items-center gap-2">
          <span>Docs</span><span className="text-slate-600">/</span><span className="text-slate-300">Calculadora</span>
        </div>
        <h1 className="text-3xl font-mono font-black text-on-surface mb-4">Calculadora</h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
          La calculadora principal soporta expresiones aritméticas, funciones trigonométricas, logarítmicas, estadísticas y constantes físicas de precisión extendida.
        </p>
      </div>
      <CodeBlock
        label="Consola de Cálculo"
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

function DocGenerico({ title, section }: { title: string; section: string }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-slate-500 font-mono mb-3 flex items-center gap-2">
          <span>Docs</span><span className="text-slate-600">/</span><span className="text-slate-300">{title}</span>
        </div>
        <h1 className="text-3xl font-mono font-black text-on-surface mb-4">{title}</h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
          Documentación de {title} próximamente disponible. Esta sección está en construcción activa.
        </p>
      </div>
      <div className="p-6 rounded-xl border border-dashed border-white/15 text-center">
        <span className="text-2xl">🚧</span>
        <p className="text-xs font-mono text-slate-500 mt-2 tracking-widest uppercase">{section} — En desarrollo</p>
      </div>
    </div>
  );
}

export function DocumentacionView() {
  const [activeSection, setActiveSection] = useState<DocSection>('cas');
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 px-1 pb-3 border-b border-white/8 shrink-0 overflow-x-auto">
        {DOC_NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
              activeSection === item.id
                ? 'bg-primary-cta/15 text-primary border border-primary-cta/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {activeSection === 'inicio'      && <DocInicio />}
          {activeSection === 'calculadora' && <DocCalculadora />}
          {activeSection === 'cas'         && <DocCAS />}
          {activeSection === 'graficados'  && <DocGenerico title="Graficados"  section="GRAPH_ENGINE" />}
          {activeSection === 'api'         && <DocGenerico title="API Pública" section="REST_API_V2" />}
          {activeSection === 'ejemplos'    && <DocGenerico title="Ejemplos"    section="EXAMPLES_LIB" />}
        </div>
      </div>
    </div>
  );
}
