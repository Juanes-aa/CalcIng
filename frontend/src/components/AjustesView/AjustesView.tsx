import { useState } from 'react';
import { loadSettings, saveSettings, type AppSettings } from '@engine/ajustes';
import type { AngleMode } from '@engine/mathEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'preferencias' | 'cuenta' | 'atajos' | 'motor' | 'exportacion';

interface AjustesViewProps {
  angleMode:          AngleMode;
  onAngleModeChange:  (mode: AngleMode) => void;
  userEmail:          string | null;
  onLogout:           () => void;
}

// ─── Atajos de teclado ───────────────────────────────────────────────────────

const SHORTCUTS: { action: string; command: string }[] = [
  { action: 'Evaluar expresión',     command: '=' },
  { action: 'Limpiar display',       command: 'ESC' },
  { action: 'Borrar último carácter', command: 'Backspace' },
  { action: 'Insertar paréntesis',   command: '( / )' },
  { action: 'Operador potencia',     command: '^' },
  { action: 'Raíz cuadrada',         command: 'sqrt(' },
  { action: 'Logaritmo natural',     command: 'ln(' },
  { action: 'Logaritmo base 10',     command: 'log(' },
  { action: 'Seno',                  command: 'sin(' },
  { action: 'Coseno',                command: 'cos(' },
  { action: 'Tangente',              command: 'tan(' },
  { action: 'Número Pi',             command: 'pi' },
  { action: 'Número Euler (e)',       command: 'e' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AjustesView({ angleMode, onAngleModeChange, userEmail, onLogout }: AjustesViewProps) {
  const [section,  setSection]  = useState<Section>('preferencias');
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(updated);
  }

  const sideNavCls = (s: Section) =>
    section === s
      ? 'flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-(--color-primary) bg-(--color-primary-cta)/10 border-r-2 border-(--color-primary-cta) transition-all'
      : 'flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-(--color-on-surface-dim) hover:text-(--color-on-surface) hover:bg-(--color-surface-mid) transition-all';

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">

      {/* ── Sidebar interno ─────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-r border-(--color-outline)/15 flex flex-col overflow-hidden bg-(--color-surface-low)">
        <div className="px-5 pt-7 pb-5 shrink-0">
          <h1 className="text-2xl font-black text-(--color-on-surface) uppercase tracking-widest">Ajustes</h1>
        </div>

        <nav className="flex-1 flex flex-col">
          <button onClick={() => setSection('preferencias')} className={sideNavCls('preferencias')}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>
            Preferencias
          </button>
          <button onClick={() => setSection('cuenta')} className={sideNavCls('cuenta')}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Cuenta
          </button>
          <button onClick={() => setSection('atajos')} className={sideNavCls('atajos')}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
            Atajos de Teclado
          </button>
          <button onClick={() => setSection('motor')} className={sideNavCls('motor')}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Motor CAS
          </button>
          <button onClick={() => setSection('exportacion')} className={sideNavCls('exportacion')}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Exportación
          </button>
        </nav>

        {/* Status motor */}
        <div className="p-4 m-3 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/10 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-(--color-success) animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-on-surface)">Motor • Online</span>
          </div>
          <div className="text-[10px] text-(--color-on-surface-dim) font-mono">Node: calc-primary-01</div>
          <div className="text-[10px] text-(--color-on-surface-dim) font-mono">Latency: &lt;1ms</div>
        </div>
      </aside>

      {/* ── Contenido principal ──────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto px-10 py-8 flex flex-col gap-10">

        {/* ── PREFERENCIAS ────────────────────────────────────────────────────── */}
        {section === 'preferencias' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-widest text-(--color-on-surface)">Preferencias</h2>
              <span className="px-2 py-1 bg-(--color-surface-mid) border border-(--color-outline)/20 font-mono text-[10px] text-(--color-on-surface-dim) rounded-lg">CONFIG_GRP_01</span>
            </div>

            {/* Tema + Idioma */}
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">Interfaz de Tema</label>
                <div className="flex rounded-xl overflow-hidden border border-(--color-outline)/20 bg-(--color-surface-mid)">
                  <button
                    onClick={() => updateSetting('theme', 'dark')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all ${settings.theme === 'dark' ? 'bg-(--color-surface-high) text-(--color-on-surface)' : 'text-(--color-on-surface-dim) hover:text-(--color-on-surface)'}`}
                  >
                    <span>🌙</span> Oscuro
                  </button>
                  <button
                    onClick={() => updateSetting('theme', 'light')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all ${settings.theme === 'light' ? 'bg-(--color-surface-high) text-(--color-on-surface)' : 'text-(--color-on-surface-dim) hover:text-(--color-on-surface)'}`}
                  >
                    <span>☀️</span> Claro
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">Idioma del Sistema</label>
                <select
                  value={settings.language}
                  onChange={e => updateSetting('language', e.target.value)}
                  className="w-full bg-(--color-surface-high) text-(--color-on-surface) text-sm px-4 py-2.5 rounded-xl border border-(--color-outline)/20 focus:outline-none focus:border-(--color-primary-cta) transition-colors cursor-pointer"
                >
                  <option value="es">Español (ES)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>
            </div>

            {/* Precisión decimal */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">Precisión Decimal</label>
                <span className="font-mono font-bold text-(--color-primary) text-lg">{settings.precision} Digits</span>
              </div>
              <input
                type="range" min={2} max={15} step={1}
                value={settings.precision}
                onChange={e => updateSetting('precision', parseInt(e.target.value))}
                className="w-full accent-(--color-primary-cta) cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[10px] text-(--color-on-surface-dim) px-0.5">
                {[2,4,6,8,10,12,14,15].map(n => <span key={n}>{String(n).padStart(2,'0')}</span>)}
              </div>
            </div>

            {/* Modo angular + Notación científica */}
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">Modo Angular</label>
                <div className="flex rounded-xl overflow-hidden border border-(--color-outline)/20 bg-(--color-surface-mid)">
                  <button
                    onClick={() => onAngleModeChange('RAD')}
                    className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-widest transition-all ${angleMode === 'RAD' ? 'bg-(--color-primary-cta) text-white' : 'text-(--color-on-surface-dim) hover:text-(--color-on-surface)'}`}
                  >
                    Radianes
                  </button>
                  <button
                    onClick={() => onAngleModeChange('DEG')}
                    className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-widest transition-all ${angleMode === 'DEG' ? 'bg-(--color-primary-cta) text-white' : 'text-(--color-on-surface-dim) hover:text-(--color-on-surface)'}`}
                  >
                    Grados
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">Notación Científica</label>
                <div className="flex items-center justify-between p-3.5 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/15">
                  <span className="text-sm text-(--color-on-surface-dim)">Auto-formato para n &gt; 10⁹</span>
                  <button
                    onClick={() => updateSetting('sciNotation', !settings.sciNotation)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${settings.sciNotation ? 'bg-(--color-primary-cta)' : 'bg-(--color-surface-high)'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.sciNotation ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CUENTA ──────────────────────────────────────────────────────────── */}
        {section === 'cuenta' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-widest text-(--color-on-surface)">Cuenta</h2>
              <span className="px-3 py-1 bg-(--color-primary-cta)/20 text-(--color-primary) font-mono text-[10px] font-bold rounded-full border border-(--color-primary-cta)/30">
                PLAN FREE
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">Email Principal</label>
              <div className="flex gap-3">
                <div className="flex-1 px-4 py-3 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/20 font-mono text-sm text-(--color-on-surface)">
                  {userEmail ?? 'No has iniciado sesión'}
                </div>
                {userEmail && (
                  <button
                    onClick={onLogout}
                    className="px-6 py-3 bg-(--color-surface-high) border border-(--color-outline)/30 text-(--color-on-surface) text-xs font-bold uppercase tracking-widest rounded-xl hover:border-red-500/40 hover:text-red-400 transition-all"
                  >
                    Cerrar Sesión
                  </button>
                )}
              </div>
            </div>

            {/* Suscripción */}
            <div className="p-5 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/15 flex items-center justify-between">
              <div>
                <div className="font-bold text-(--color-on-surface) mb-1">Gestiona tu suscripción</div>
                <div className="text-xs text-(--color-on-surface-dim)">Desbloquea el historial ilimitado y funciones avanzadas del motor CAS.</div>
              </div>
              <button className="ml-4 px-5 py-2.5 bg-(--color-surface-high) border border-(--color-outline)/30 text-(--color-on-surface) text-xs font-bold rounded-xl hover:border-(--color-primary-cta)/40 hover:text-(--color-primary) transition-all shrink-0">
                Ver planes
              </button>
            </div>

            {/* Zona de peligro */}
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-red-400">Zona de Peligro</div>
              <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/15 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-(--color-on-surface) mb-0.5">Eliminar historial completo</div>
                  <div className="text-xs text-(--color-on-surface-dim)">Esta acción no se puede deshacer.</div>
                </div>
                <button
                  onClick={() => { localStorage.removeItem('calcIng_history'); }}
                  className="ml-4 px-4 py-2 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/10 transition-all shrink-0"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ATAJOS ──────────────────────────────────────────────────────────── */}
        {section === 'atajos' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-(--color-on-surface)">Atajos de Teclado</h2>
            <div className="rounded-xl overflow-hidden border border-(--color-outline)/15">
              <table className="w-full">
                <thead>
                  <tr className="bg-(--color-surface-mid)">
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">Acción</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-(--color-on-surface-dim)">Comando</th>
                  </tr>
                </thead>
                <tbody>
                  {SHORTCUTS.map((s, i) => (
                    <tr key={s.action} className={`border-t border-(--color-outline)/10 ${i % 2 === 0 ? 'bg-(--color-surface-low)' : 'bg-(--color-surface-mid)'}`}>
                      <td className="px-5 py-3.5 text-sm text-(--color-on-surface)">{s.action}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs px-2.5 py-1 bg-(--color-surface-high) border border-(--color-outline)/20 rounded-lg text-(--color-primary)">
                          {s.command}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MOTOR CAS ───────────────────────────────────────────────────────── */}
        {section === 'motor' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-(--color-on-surface)">Motor CAS</h2>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Estado',      value: 'Online',                     color: 'text-(--color-success)' },
                { label: 'Nodo',        value: 'calc-primary-01',            color: 'text-(--color-on-surface)' },
                { label: 'Latencia',    value: '< 1 ms',                     color: 'text-(--color-on-surface)' },
                { label: 'Motor',       value: 'mathEngine v4',              color: 'text-(--color-on-surface)' },
                { label: 'CAS',         value: 'nerdamer (local)',            color: 'text-(--color-on-surface)' },
                { label: 'Graficador',  value: 'graphEngine v2 (evaluator)', color: 'text-(--color-on-surface)' },
              ].map(item => (
                <div key={item.label} className="p-4 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/10">
                  <div className="text-[10px] uppercase tracking-widest text-(--color-on-surface-dim) mb-1">{item.label}</div>
                  <div className={`font-mono text-sm font-bold ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/10">
              <div className="text-[10px] uppercase tracking-widest text-(--color-on-surface-dim) mb-3">Módulos activos</div>
              <div className="flex flex-wrap gap-2">
                {['mathEngine', 'parser', 'bases', 'estadistica', 'complejos', 'matrix', 'units', 'constants', 'variables', 'historial', 'stepEngine', 'graphEngine', 'casEngine'].map(m => (
                  <span key={m} className="px-2.5 py-1 bg-(--color-surface-high) border border-(--color-success)/20 text-(--color-success) font-mono text-[11px] rounded-lg">
                    ✓ {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── EXPORTACIÓN ─────────────────────────────────────────────────────── */}
        {section === 'exportacion' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-(--color-on-surface)">Exportación</h2>

            <div className="flex flex-col gap-3">
              {[
                {
                  title:       'Historial de cálculos',
                  description: 'Exporta todos los cálculos guardados en formato JSON.',
                  action: () => {
                    const data = localStorage.getItem('calcIng_history') ?? '[]';
                    const blob = new Blob([data], { type: 'application/json' });
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement('a');
                    a.href = url; a.download = 'calcIng_historial.json'; a.click();
                    URL.revokeObjectURL(url);
                  },
                  format: 'JSON',
                },
                {
                  title:       'Variables',
                  description: 'Exporta todas las variables (preset + personalizadas).',
                  action: () => {
                    const data = localStorage.getItem('calcIng_variables') ?? '[]';
                    const blob = new Blob([data], { type: 'application/json' });
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement('a');
                    a.href = url; a.download = 'calcIng_variables.json'; a.click();
                    URL.revokeObjectURL(url);
                  },
                  format: 'JSON',
                },
                {
                  title:       'Configuración',
                  description: 'Exporta los ajustes actuales de la aplicación.',
                  action: () => {
                    const data = localStorage.getItem('calcIng_settings') ?? '{}';
                    const blob = new Blob([data], { type: 'application/json' });
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement('a');
                    a.href = url; a.download = 'calcIng_settings.json'; a.click();
                    URL.revokeObjectURL(url);
                  },
                  format: 'JSON',
                },
              ].map(item => (
                <div key={item.title} className="flex items-center justify-between p-4 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/15">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-(--color-on-surface) text-sm mb-0.5">{item.title}</div>
                    <div className="text-xs text-(--color-on-surface-dim)">{item.description}</div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="px-2 py-0.5 bg-(--color-surface-high) font-mono text-[10px] text-(--color-on-surface-dim) rounded">{item.format}</span>
                    <button
                      onClick={item.action}
                      className="flex items-center gap-1.5 px-4 py-2 bg-(--color-surface-high) border border-(--color-outline)/30 text-(--color-on-surface) text-xs font-bold rounded-xl hover:border-(--color-primary-cta)/40 hover:text-(--color-primary) transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                      Exportar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
