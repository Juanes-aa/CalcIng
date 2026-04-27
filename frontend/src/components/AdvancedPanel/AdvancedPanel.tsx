import { useState } from 'react';
import * as estadistica from '@engine/estadistica';
import * as complejos from '@engine/complejos';
import { useI18n } from '../../hooks/useI18n';
import {
  parseMatrixString, matAdd, matSub, matMul, matScale,
  matDet, matInverse, matTranspose, formatMatrix,
} from '@engine/matrix';
import { convert, UNITS } from '@engine/units';
import type { UnitEntry, UnitCategory } from '@engine/units';
import type { Locale } from '@engine/ajustes';
import {
  convertDecimalToBinary, convertDecimalToHex, convertDecimalToOctal,
  convertBinaryToDecimal, convertHexToDecimal, convertOctalToDecimal,
} from '@engine/bases';

// ── Clases compartidas ────────────────────────────────────────────────────────

const selectCls   = 'w-full bg-(--color-surface-high) text-(--color-on-surface) text-sm px-3 py-2.5 rounded-xl border border-(--color-outline)/20 focus:outline-none focus:border-(--color-primary-cta) transition-colors cursor-pointer';
const inputCls    = 'w-full bg-(--color-surface) text-(--color-on-surface) font-mono text-sm px-3 py-2.5 rounded-xl border border-(--color-outline)/40 focus:border-(--color-primary-cta) focus:ring-1 focus:ring-(--color-primary-cta)/30 focus:outline-none transition-all placeholder:text-(--color-outline)';
const numInCls    = 'w-full bg-(--color-surface) text-(--color-on-surface) font-mono text-sm px-2 py-1.5 rounded-lg border border-(--color-outline)/40 focus:border-(--color-primary-cta) focus:outline-none transition-colors';
const textAreaCls = 'w-full bg-(--color-surface) text-(--color-on-surface) font-mono text-xs px-3 py-2 border border-(--color-outline)/20 rounded-xl focus:border-(--color-primary-cta) focus:outline-none transition-colors placeholder:text-(--color-outline) resize-none';
const btnCls      = 'w-full py-2.5 bg-(--color-primary-cta) text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_2px_12px_rgba(37,99,235,0.2)]';
const resultCls   = 'p-3 bg-(--color-surface) border border-(--color-success)/20 rounded-xl font-mono text-(--color-success) text-sm break-all leading-relaxed';
const labelCls    = 'text-[10px] font-bold text-(--color-on-surface-dim) uppercase tracking-widest';
const cardCls     = 'p-3 bg-(--color-surface-mid) rounded-xl border border-(--color-outline)/10';
const rowCls      = 'flex items-center justify-between font-mono text-sm';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdvancedPanelProps {
  onInsert?: (value: string) => void;
  // onInsert se mantiene por compatibilidad con App.tsx aunque ya no se usa en este panel
}

type ActiveTab = 'stats' | 'complex' | 'matrix' | 'convert' | 'bases';

type StatsOp = 'mean' | 'median' | 'variance' | 'stdDev' | 'sampleVariance' | 'sampleStdDev' | 'range';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstKey(obj: Record<string, unknown>): string {
  return Object.keys(obj)[0] ?? '';
}

function secondKey(obj: Record<string, unknown>): string {
  return Object.keys(obj)[1] ?? Object.keys(obj)[0] ?? '';
}

function initialConvertResult(): string {
  try {
    const defaultCat = 'longitud';
    const from = firstKey(UNITS[defaultCat]!.units as Record<string, unknown>);
    const to   = secondKey(UNITS[defaultCat]!.units as Record<string, unknown>);
    const result = convert(1, from, to, defaultCat);
    return String(parseFloat(result.toPrecision(10)));
  } catch {
    return '';
  }
}

// ─── TabStats ─────────────────────────────────────────────────────────────────

function TabStats() {
  const { t } = useI18n();
  const [input,  setInput]  = useState('');
  const [op,     setOp]     = useState<StatsOp>('mean');
  const [result, setResult] = useState<string>('');
  const [error,  setError]  = useState('');

  function parseData(raw: string): number[] {
    return raw.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  }

  function runOp(): void {
    setError('');
    try {
      const datos = parseData(input);
      if (datos.length === 0) { setError(t('advanced.stats.needNumber')); setResult(''); return; }
      let value: number;
      switch (op) {
        case 'mean':           value = estadistica.mean(datos); break;
        case 'median':         value = estadistica.median(datos); break;
        case 'variance':       value = estadistica.variance(datos); break;
        case 'stdDev':         value = estadistica.stdDev(datos); break;
        case 'sampleVariance': value = estadistica.sampleVariance(datos); break;
        case 'sampleStdDev':   value = estadistica.sampleStdDev(datos); break;
        case 'range':          value = estadistica.range(datos); break;
      }
      const rounded = Number(value.toFixed(10));
      setResult(String(rounded));
    } catch (e) {
      setError((e as Error).message);
      setResult('');
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{t('advanced.stats.data')}</label>
          <input
            data-testid="stats-input"
            type="text"
            placeholder={t('advanced.stats.placeholder')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runOp()}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{t('advanced.common.operation')}</label>
          <select
            data-testid="stats-op-select"
            value={op}
            onChange={e => setOp(e.target.value as StatsOp)}
            className={selectCls}
          >
            <option value="mean">{t('advanced.stats.op.mean')}</option>
            <option value="median">{t('advanced.stats.op.median')}</option>
            <option value="variance">{t('advanced.stats.op.variance')}</option>
            <option value="stdDev">{t('advanced.stats.op.stdDev')}</option>
            <option value="sampleVariance">{t('advanced.stats.op.sampleVar')}</option>
            <option value="sampleStdDev">{t('advanced.stats.op.sampleStd')}</option>
            <option value="range">{t('advanced.stats.op.range')}</option>
          </select>
        </div>
        <button data-testid="stats-calc-button" onClick={runOp} className={btnCls}>
          {t('advanced.common.calculate')}
        </button>
        {error && <div className="font-mono text-xs text-red-400 px-1">{error}</div>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>{t('advanced.common.result')}</label>
        <div data-testid="stats-result" className={resultCls + ' text-base'}>{result}</div>
      </div>
    </div>
  );
}

// ─── TabComplex ───────────────────────────────────────────────────────────────

function TabComplex() {
  const { t } = useI18n();
  const [z1Real, setZ1Real] = useState('0');
  const [z1Imag, setZ1Imag] = useState('0');
  const [z2Real, setZ2Real] = useState('0');
  const [z2Imag, setZ2Imag] = useState('0');
  const [complexOp,     setComplexOp]     = useState('cAdd');
  const [complexResult, setComplexResult] = useState('');
  const [polarStr,      setPolarStr]      = useState('');

  const needsZ2 = ['cAdd', 'cSub', 'cMul', 'cDiv', 'cPower'].includes(complexOp);

  function handleCalc() {
    const z1 = { real: parseFloat(z1Real), imag: parseFloat(z1Imag) };
    const z2 = { real: parseFloat(z2Real), imag: parseFloat(z2Imag) };
    try {
      let res: complejos.Complejo | null = null;
      let scalar: string | null = null;
      if      (complexOp === 'cAdd')       res = complejos.add(z1, z2);
      else if (complexOp === 'cSub')       res = complejos.subtract(z1, z2);
      else if (complexOp === 'cMul')       res = complejos.multiply(z1, z2);
      else if (complexOp === 'cDiv')       res = complejos.divide(z1, z2);
      else if (complexOp === 'cConjugate') res = complejos.conjugate(z1);
      else if (complexOp === 'cSqrt')      res = complejos.sqrt(z1);
      else if (complexOp === 'cPower')     res = complejos.power(z1, parseInt(z2Real));
      else if (complexOp === 'cModulus')   scalar = complejos.modulus(z1).toFixed(8);
      else if (complexOp === 'cArgument')  scalar = `${complejos.argument(z1).toFixed(8)} rad`;
      if (res !== null) {
        setComplexResult(complejos.formatComplex(res));
        const p = complejos.toPolar(res);
        setPolarStr(`|z| = ${p.modulo.toFixed(6)},  θ = ${p.argumento.toFixed(6)} rad`);
      } else if (scalar !== null) {
        setComplexResult(scalar);
        setPolarStr('');
      }
    } catch (e) {
      setComplexResult('Error: ' + (e as Error).message);
      setPolarStr('');
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{t('advanced.common.operation')}</label>
          <select data-testid="complex-op-select" value={complexOp}
            onChange={e => setComplexOp(e.target.value)} className={selectCls}>
            <option value="cAdd">{t('advanced.complex.op.add')}</option>
            <option value="cSub">{t('advanced.complex.op.sub')}</option>
            <option value="cMul">{t('advanced.complex.op.mul')}</option>
            <option value="cDiv">{t('advanced.complex.op.div')}</option>
            <option value="cModulus">{t('advanced.complex.op.mod')}</option>
            <option value="cArgument">{t('advanced.complex.op.arg')}</option>
            <option value="cConjugate">{t('advanced.complex.op.conj')}</option>
            <option value="cPower">{t('advanced.complex.op.pow')}</option>
            <option value="cSqrt">{t('advanced.complex.op.sqrt')}</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t('advanced.complex.z1real')}</label>
            <input data-testid="complex-z1-real" type="number" value={z1Real}
              onChange={e => setZ1Real(e.target.value)} className={numInCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t('advanced.complex.z1imag')}</label>
            <input data-testid="complex-z1-imag" type="number" value={z1Imag}
              onChange={e => setZ1Imag(e.target.value)} className={numInCls} />
          </div>
          {needsZ2 && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{t('advanced.complex.z2real')}</label>
                <input data-testid="complex-z2-real" type="number" value={z2Real}
                  onChange={e => setZ2Real(e.target.value)} className={numInCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{t('advanced.complex.z2imag')}</label>
                <input data-testid="complex-z2-imag" type="number" value={z2Imag}
                  onChange={e => setZ2Imag(e.target.value)} className={numInCls} />
              </div>
            </>
          )}
        </div>
        <button data-testid="complex-calc-button" onClick={handleCalc} className={btnCls}>
          {t('advanced.common.calculate')}
        </button>
      </div>
      <div className="flex flex-col gap-3 justify-start">
        {complexResult !== '' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>{t('advanced.complex.resultRect')}</label>
              <div data-testid="complex-result" className={resultCls + ' text-base'}>{complexResult}</div>
            </div>
            {polarStr !== '' && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{t('advanced.complex.polar')}</label>
                <div className={cardCls + ' font-mono text-sm text-(--color-on-surface-dim)'}>{polarStr}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── TabMatrix ────────────────────────────────────────────────────────────────

function TabMatrix() {
  const { t } = useI18n();
  const [matrixA,  setMatrixA]  = useState('');
  const [matrixB,  setMatrixB]  = useState('');
  const [scalar,   setScalar]   = useState('2');
  const [matrixOp, setMatrixOp] = useState('matDet');
  const [result,   setResult]   = useState('');

  const needsB      = ['matAdd', 'matSub', 'matMul'].includes(matrixOp);
  const needsScalar = matrixOp === 'matScale';

  function handleCalc() {
    try {
      const A = parseMatrixString(matrixA);
      let res: string;
      if      (matrixOp === 'matDet')       res = `det(A) = ${matDet(A)}`;
      else if (matrixOp === 'matTranspose') res = formatMatrix(matTranspose(A));
      else if (matrixOp === 'matInverse')   res = formatMatrix(matInverse(A));
      else if (matrixOp === 'matScale')     res = formatMatrix(matScale(parseFloat(scalar), A));
      else {
        const B = parseMatrixString(matrixB);
        if      (matrixOp === 'matAdd') res = formatMatrix(matAdd(A, B));
        else if (matrixOp === 'matSub') res = formatMatrix(matSub(A, B));
        else if (matrixOp === 'matMul') res = formatMatrix(matMul(A, B));
        else res = t('advanced.matrix.opNotSupp');
      }
      setResult(res);
    } catch (e) {
      setResult('Error: ' + (e as Error).message);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{t('advanced.common.operation')}</label>
          <select data-testid="matrix-op-select" value={matrixOp}
            onChange={e => setMatrixOp(e.target.value)} className={selectCls}>
            <option value="matDet">{t('advanced.matrix.op.det')}</option>
            <option value="matTranspose">{t('advanced.matrix.op.trans')}</option>
            <option value="matInverse">{t('advanced.matrix.op.inv')}</option>
            <option value="matScale">{t('advanced.matrix.op.scale')}</option>
            <option value="matAdd">{t('advanced.matrix.op.add')}</option>
            <option value="matSub">{t('advanced.matrix.op.sub')}</option>
            <option value="matMul">{t('advanced.matrix.op.mul')}</option>
          </select>
        </div>
        {needsScalar && (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t('advanced.matrix.scalar')}</label>
            <input type="number" value={scalar} onChange={e => setScalar(e.target.value)} className={numInCls} />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{t('advanced.matrix.aLabel')}</label>
          <textarea data-testid="matrix-a-input" placeholder="ej: 1,2,3;4,5,6;7,8,9"
            value={matrixA} onChange={e => setMatrixA(e.target.value)}
            rows={5} className={textAreaCls} />
        </div>
        {needsB && (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t('advanced.matrix.bLabel')}</label>
            <textarea data-testid="matrix-b-input" placeholder="ej: 1,0,0;0,1,0;0,0,1"
              value={matrixB} onChange={e => setMatrixB(e.target.value)}
              rows={5} className={textAreaCls} />
          </div>
        )}
        <button data-testid="matrix-calc-button" onClick={handleCalc} className={btnCls}>
          {t('advanced.common.calculate')}
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {result !== '' && (
          <>
            <label className={labelCls}>{t('advanced.common.result')}</label>
            <pre data-testid="matrix-result" className={resultCls + ' whitespace-pre text-xs overflow-x-auto'}>{result}</pre>
          </>
        )}
      </div>
    </div>
  );
}

// ─── TabConvert ───────────────────────────────────────────────────────────────

function unitLabel(entry: UnitEntry, locale: Locale): string {
  return locale === 'en' ? entry.labelEn : entry.label;
}
function catLabel(cat: UnitCategory, locale: Locale): string {
  return locale === 'en' ? cat.labelEn : cat.label;
}

function calcConvert(value: string, from: string, to: string, cat: string): string {
  try {
    return String(parseFloat(convert(parseFloat(value), from, to, cat).toPrecision(10)));
  } catch {
    return '';
  }
}

function TabConvert() {
  const { t, locale } = useI18n();
  const defaultCat  = 'longitud';
  const defaultFrom = firstKey(UNITS[defaultCat]!.units as Record<string, unknown>);
  const defaultTo   = secondKey(UNITS[defaultCat]!.units as Record<string, unknown>);

  const [category,      setCategory]      = useState(defaultCat);
  const [fromUnit,      setFromUnit]      = useState(defaultFrom);
  const [toUnit,        setToUnit]        = useState(defaultTo);
  const [convertValue,  setConvertValue]  = useState('1');
  const [convertResult, setConvertResult] = useState(() => initialConvertResult());

  function recalc(val: string, from: string, to: string, cat: string) {
    setConvertResult(calcConvert(val, from, to, cat));
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const cat  = e.target.value;
    const from = firstKey(UNITS[cat]!.units as Record<string, unknown>);
    const to   = secondKey(UNITS[cat]!.units as Record<string, unknown>);
    setCategory(cat); setFromUnit(from); setToUnit(to);
    recalc(convertValue, from, to, cat);
  }

  const catUnits = UNITS[category]!.units;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{t('advanced.convert.category')}</label>
          <select data-testid="convert-category" value={category}
            onChange={handleCategoryChange} className={selectCls}>
            {Object.entries(UNITS).map(([key, cat]) => (
              <option key={key} value={key}>{catLabel(cat, locale)}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t('advanced.convert.from')}</label>
            <select data-testid="convert-from" value={fromUnit}
              onChange={e => { setFromUnit(e.target.value); recalc(convertValue, e.target.value, toUnit, category); }}
              className={selectCls}>
              {Object.keys(catUnits).map(u => (
                <option key={u} value={u}>{unitLabel(catUnits[u]!, locale)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t('advanced.convert.to')}</label>
            <select data-testid="convert-to" value={toUnit}
              onChange={e => { setToUnit(e.target.value); recalc(convertValue, fromUnit, e.target.value, category); }}
              className={selectCls}>
              {Object.keys(catUnits).map(u => (
                <option key={u} value={u}>{unitLabel(catUnits[u]!, locale)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{t('advanced.convert.value')}</label>
          <input data-testid="convert-value" type="number" value={convertValue}
            onChange={e => { setConvertValue(e.target.value); recalc(e.target.value, fromUnit, toUnit, category); }}
            className={inputCls} />
        </div>
      </div>
      <div className="flex flex-col gap-3 justify-center">
        <label className={labelCls}>{t('advanced.common.result')}</label>
        <div data-testid="convert-result" className={resultCls + ' text-2xl font-bold tracking-tight'}>{convertResult}</div>
        <div className="text-xs text-(--color-on-surface-dim) font-mono px-1">
          {catUnits[fromUnit] ? unitLabel(catUnits[fromUnit]!, locale) : ''} → {catUnits[toUnit] ? unitLabel(catUnits[toUnit]!, locale) : ''}
        </div>
      </div>
    </div>
  );
}

// ─── TabBases ─────────────────────────────────────────────────────────────────

type BaseMode = 'dec' | 'bin' | 'hex' | 'oct';

const BASE_LABELS: Record<BaseMode, string> = { dec: 'DEC', bin: 'BIN', hex: 'HEX', oct: 'OCT' };
const BASE_PLACEHOLDERS: Record<BaseMode, string> = { dec: 'ej: 255', bin: 'ej: 11111111', hex: 'ej: FF', oct: 'ej: 377' };

function TabBases() {
  const { t } = useI18n();
  const [mode,    setMode]    = useState<BaseMode>('dec');
  const [input,   setInput]   = useState('');
  const [results, setResults] = useState<Partial<Record<BaseMode, string>>>({});
  const [error,   setError]   = useState('');

  function compute(value: string, base: BaseMode) {
    setError('');
    if (!value.trim()) { setResults({}); return; }
    try {
      let dec: string;
      if      (base === 'dec') { const n = parseInt(value); if (isNaN(n)) throw new Error(t('advanced.bases.invalidInt')); dec = String(n); }
      else if (base === 'bin') dec = convertBinaryToDecimal(value);
      else if (base === 'hex') dec = convertHexToDecimal(value);
      else                     dec = convertOctalToDecimal(value);
      const n = parseInt(dec);
      setResults({ dec, bin: convertDecimalToBinary(n), hex: convertDecimalToHex(n), oct: convertDecimalToOctal(n) });
    } catch (e) {
      setError((e as Error).message);
      setResults({});
    }
  }

  function handleModeChange(b: BaseMode) {
    setMode(b); setInput(''); setResults({}); setError('');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{t('advanced.bases.inputBase')}</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['dec', 'bin', 'hex', 'oct'] as BaseMode[]).map(b => (
              <button key={b} onClick={() => handleModeChange(b)}
                className={`py-2.5 text-xs font-bold uppercase rounded-xl transition-all ${
                  mode === b
                    ? 'bg-(--color-primary-cta) text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]'
                    : 'bg-(--color-surface-mid) text-(--color-on-surface-dim) hover:text-(--color-on-surface)'
                }`}
              >
                {BASE_LABELS[b]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{t('advanced.bases.inputLabel', { base: BASE_LABELS[mode] })}</label>
          <input
            data-testid="bases-input"
            type="text"
            placeholder={BASE_PLACEHOLDERS[mode]}
            value={input}
            onChange={e => { setInput(e.target.value); compute(e.target.value, mode); }}
            className={inputCls}
          />
        </div>
        {error && <div className="font-mono text-xs text-red-400 px-1">{error}</div>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>{t('advanced.bases.conversions')}</label>
        <div className="flex flex-col gap-px p-3 bg-(--color-surface) rounded-xl border border-(--color-outline)/10">
          {(['dec', 'bin', 'hex', 'oct'] as BaseMode[]).map((b, i) => (
            <div key={b}>
              {i > 0 && <div className="h-px bg-(--color-outline)/10 my-2" />}
              <div
                data-testid={`bases-result-${b}`}
                className={`${rowCls} gap-4 ${b === mode ? 'opacity-40' : ''}`}
              >
                <span className="text-[10px] uppercase tracking-widest text-(--color-on-surface-dim) w-8 shrink-0">{BASE_LABELS[b]}</span>
                <span className="text-(--color-primary) text-right break-all flex-1">{results[b] ?? '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AdvancedPanel ────────────────────────────────────────────────────────────

export function AdvancedPanel({ onInsert: _onInsert }: AdvancedPanelProps) {
  void _onInsert;
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ActiveTab>('stats');

  const tabCls = (tab: ActiveTab) =>
    activeTab === tab
      ? 'px-4 py-3 text-[11px] font-bold font-display uppercase tracking-widest whitespace-nowrap text-(--color-primary) border-b-2 border-(--color-primary-cta) -mb-px transition-colors'
      : 'px-4 py-3 text-[11px] font-bold font-display uppercase tracking-widest whitespace-nowrap text-(--color-on-surface-dim) hover:text-(--color-on-surface) transition-colors';

  return (
    <section
      data-testid="advanced-panel"
      className="flex-1 min-h-0 bg-(--color-surface-low) rounded-xl border border-(--color-outline)/20 flex flex-col overflow-hidden"
    >
      <div className="flex overflow-x-auto border-b border-(--color-outline)/15 shrink-0" role="tablist">
        <button data-testid="tab-stats"     role="tab" aria-selected={activeTab === 'stats'}     onClick={() => setActiveTab('stats')}     className={tabCls('stats')}>{t('advanced.tab.stats')}</button>
        <button data-testid="tab-complex"   role="tab" aria-selected={activeTab === 'complex'}   onClick={() => setActiveTab('complex')}   className={tabCls('complex')}>{t('advanced.tab.complex')}</button>
        <button data-testid="tab-matrix"    role="tab" aria-selected={activeTab === 'matrix'}    onClick={() => setActiveTab('matrix')}    className={tabCls('matrix')}>{t('advanced.tab.matrix')}</button>
        <button data-testid="tab-convert"   role="tab" aria-selected={activeTab === 'convert'}   onClick={() => setActiveTab('convert')}   className={tabCls('convert')}>{t('advanced.tab.convert')}</button>
        <button data-testid="tab-bases"     role="tab" aria-selected={activeTab === 'bases'}     onClick={() => setActiveTab('bases')}     className={tabCls('bases')}>{t('advanced.tab.bases')}</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'stats'     && <TabStats />}
        {activeTab === 'complex'   && <TabComplex />}
        {activeTab === 'matrix'    && <TabMatrix />}
        {activeTab === 'convert'   && <TabConvert />}
        {activeTab === 'bases'     && <TabBases />}
      </div>
    </section>
  );
}