import { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { TranslationKey } from '@engine/i18n';

interface Props {
  onClose: () => void;
}

type ModuleType = 'calculo' | 'fisica' | 'algebra' | 'estadistica';

const MODULES: { id: ModuleType; nameKey: TranslationKey; sub: string; color: string; icon: React.ReactNode }[] = [
  {
    id: 'calculo',
    nameKey: 'nuevoProy.mod.calc',
    sub: 'STANDARD ENGINE',
    color: 'blue',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1z" />
      </svg>
    ),
  },
  {
    id: 'fisica',
    nameKey: 'nuevoProy.mod.physics',
    sub: 'KINEMATICS V3.1',
    color: 'green',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'algebra',
    nameKey: 'nuevoProy.mod.algebra',
    sub: 'MATRIX OPS',
    color: 'orange',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5h16M4 9h16M4 13h16M4 17h16" />
      </svg>
    ),
  },
  {
    id: 'estadistica',
    nameKey: 'nuevoProy.mod.stats',
    sub: 'DATA MODELING',
    color: 'teal',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const MODULE_COLORS: Record<string, string> = {
  blue: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
  green: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  orange: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
  teal: 'text-teal-400 bg-teal-500/15 border-teal-500/30',
};

const MODULE_SELECTED: Record<string, string> = {
  blue: 'border-blue-400 ring-1 ring-blue-400/50',
  green: 'border-emerald-400 ring-1 ring-emerald-400/50',
  orange: 'border-orange-400 ring-1 ring-orange-400/50',
  teal: 'border-teal-400 ring-1 ring-teal-400/50',
};

const VISUAL_COLORS = ['#818cf8', '#34d399', '#f87171', '#fb923c', '#a78bfa'];

const ICON_PRESETS = [
  <svg key="pin" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
  <svg key="user" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  <svg key="globe" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  <svg key="rocket" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.82m2.56-5.84a14.98 14.98 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>,
];

export default function NuevoProyecto({ onClose }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [moduleType, setModuleType] = useState<ModuleType>('calculo');
  const [iconPreset, setIconPreset] = useState(0);
  const [visualId, setVisualId] = useState(0);

  function handleSubmit() {
    if (!name.trim()) return;
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-surface-low border border-outline/25 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-5 border-b border-outline/15">
          <div>
            <h2 className="text-xl font-mono font-bold tracking-widest text-on-surface uppercase">
              {t('nuevoProy.title')}
            </h2>
            <p className="text-[10px] text-on-surface-dim tracking-[0.2em] uppercase mt-1 font-mono">
              {t('nuevoProy.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-dim hover:text-on-surface hover:bg-surface-mid transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

          {/* Project Name */}
          <div>
            <label className="block text-[10px] font-mono tracking-[0.2em] text-on-surface-dim uppercase mb-2">
              {t('nuevoProy.projectName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('nuevoProy.projectNamePh')}
              className="w-full bg-surface-mid border border-outline/25 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-dim/60 focus:outline-none focus:border-primary-cta/50 focus:ring-1 focus:ring-primary-cta/30 transition-all font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-mono tracking-[0.2em] text-on-surface-dim uppercase mb-2">
              {t('nuevoProy.description')}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('nuevoProy.descriptionPh')}
              rows={3}
              className="w-full bg-surface-mid border border-outline/25 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-dim/60 focus:outline-none focus:border-primary-cta/50 focus:ring-1 focus:ring-primary-cta/30 transition-all resize-none font-mono"
            />
          </div>

          {/* Module Type */}
          <div>
            <label className="block text-[10px] font-mono tracking-[0.2em] text-on-surface-dim uppercase mb-3">
              {t('nuevoProy.selectModule')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MODULES.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => setModuleType(mod.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                    moduleType === mod.id
                      ? `bg-surface-mid ${MODULE_SELECTED[mod.color]}`
                      : 'bg-surface-mid/40 border-outline/20 hover:bg-surface-mid hover:border-outline/35'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${MODULE_COLORS[mod.color]}`}>
                    {mod.icon}
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold text-on-surface tracking-wider">{t(mod.nameKey)}</p>
                    <p className="text-[10px] text-on-surface-dim tracking-widest uppercase mt-0.5">{mod.sub}</p>
                  </div>
                  {moduleType === mod.id && (
                    <div className={`ml-auto w-2 h-2 rounded-full ${mod.color === 'blue' ? 'bg-blue-400' : mod.color === 'green' ? 'bg-emerald-400' : mod.color === 'orange' ? 'bg-orange-400' : 'bg-teal-400'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom row: Icon Preset + Visual ID */}
          <div className="flex gap-8">
            {/* Icon Preset */}
            <div className="flex-1">
              <label className="block text-[10px] font-mono tracking-[0.2em] text-on-surface-dim uppercase mb-3">
                {t('nuevoProy.iconPreset')}
              </label>
              <div className="flex gap-2">
                {ICON_PRESETS.map((icon, i) => (
                  <button
                    key={i}
                    onClick={() => setIconPreset(i)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${
                      iconPreset === i
                        ? 'bg-primary-cta/20 border-primary-cta/50 text-primary'
                        : 'bg-surface-mid border-outline/25 text-on-surface-dim hover:border-outline/40 hover:text-on-surface'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual ID */}
            <div>
              <label className="block text-[10px] font-mono tracking-[0.2em] text-on-surface-dim uppercase mb-3">
                {t('nuevoProy.visualId')}
              </label>
              <div className="flex gap-2 items-center">
                {VISUAL_COLORS.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => setVisualId(i)}
                    className={`w-8 h-8 rounded-full transition-all ${visualId === i ? 'ring-2 ring-offset-2 ring-offset-(--color-surface-low) scale-110' : 'opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: color, ...(visualId === i ? { ringColor: color } : {}) }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline/15">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm text-on-surface-dim hover:text-on-surface transition-colors font-mono tracking-wider"
          >
            {t('nuevoProy.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-6 py-2.5 bg-primary-cta text-white text-sm font-mono font-bold tracking-wider rounded-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('nuevoProy.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
