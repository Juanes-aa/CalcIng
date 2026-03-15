import { useState } from 'react';
import { CONSTANTS } from '@engine/constants';
import * as estadistica from '@engine/estadistica';
import * as complejos from '@engine/complejos';
import {
  parseMatrixString, matAdd, matSub, matMul,
  matDet, matInverse, matTranspose,
} from '@engine/matrix';
import { convert, UNITS } from '@engine/units';
import {
  convertDecimalToBinary,
  convertDecimalToHex,
  convertDecimalToOctal,
} from '@engine/bases';
import styles from './AdvancedPanel.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdvancedPanelProps {
  onInsert?: (value: string) => void;
}

type ActiveTab = 'constants' | 'stats' | 'complex' | 'matrix' | 'convert' | 'bases';

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

// ─── TabConstants ─────────────────────────────────────────────────────────────

function TabConstants({ onInsert }: { onInsert?: (v: string) => void }) {
  return (
    <div className={styles.content}>
      {Object.entries(CONSTANTS).map(([key, c]) => (
        <div key={key} data-testid={`constant-item-${key}`} className={styles.constantItem}>
          <span className={styles.constantSymbol}>{c.symbol}</span>
          <span className={styles.constantLabel}>{c.label}</span>
          <span className={styles.constantValue}>{c.value}</span>
          <span className={styles.constantUnit}>{c.unit}</span>
          <button
            data-testid={`constant-insert-${key}`}
            onClick={() => onInsert?.(String(c.value))}
            className={styles.insertBtn}
          >↵</button>
        </div>
      ))}
    </div>
  );
}

// ─── TabStats ─────────────────────────────────────────────────────────────────

function TabStats() {
  const [statsInput,  setStatsInput]  = useState('');
  const [statsOp,     setStatsOp]     = useState('mean');
  const [statsResult, setStatsResult] = useState('');

  function handleStatsCalc() {
    try {
      const datos = statsInput.split(',').map(v => parseFloat(v.trim()));
      const fn = estadistica[statsOp as keyof typeof estadistica] as
        ((d: number[]) => number) | undefined;
      if (!fn) { setStatsResult('Operación no soportada'); return; }
      const result = fn(datos);
      setStatsResult(Number(result.toFixed(10)).toString());
    } catch {
      setStatsResult('Error');
    }
  }

  return (
    <div className={styles.content}>
      <select
        data-testid="stats-op-select"
        value={statsOp}
        onChange={e => setStatsOp(e.target.value)}
      >
        <option value="mean">Media (mean)</option>
        <option value="median">Mediana (median)</option>
        <option value="mode">Moda (mode)</option>
        <option value="variance">Varianza (variance)</option>
        <option value="stdDev">Desv. estándar (stdDev)</option>
        <option value="range">Rango (range)</option>
        <option value="percentile">Percentil (percentile)</option>
      </select>
      <input
        data-testid="stats-input"
        type="text"
        placeholder="ej: 1, 2, 3, 4, 5"
        value={statsInput}
        onChange={e => setStatsInput(e.target.value)}
      />
      <button data-testid="stats-calc-button" onClick={handleStatsCalc}>
        Calcular
      </button>
      {statsResult !== '' && (
        <div data-testid="stats-result">{statsResult}</div>
      )}
    </div>
  );
}

// ─── TabComplex ───────────────────────────────────────────────────────────────

function TabComplex() {
  const [z1Real,        setZ1Real]        = useState('0');
  const [z1Imag,        setZ1Imag]        = useState('0');
  const [z2Real,        setZ2Real]        = useState('0');
  const [z2Imag,        setZ2Imag]        = useState('0');
  const [complexOp,     setComplexOp]     = useState('cAdd');
  const [complexResult, setComplexResult] = useState('');

  function handleComplexCalc() {
    const z1 = { real: parseFloat(z1Real), imag: parseFloat(z1Imag) };
    const z2 = { real: parseFloat(z2Real), imag: parseFloat(z2Imag) };
    try {
      let result: string;
      if      (complexOp === 'cAdd')       result = complejos.formatComplex(complejos.add(z1, z2));
      else if (complexOp === 'cSub')       result = complejos.formatComplex(complejos.subtract(z1, z2));
      else if (complexOp === 'cMul')       result = complejos.formatComplex(complejos.multiply(z1, z2));
      else if (complexOp === 'cDiv')       result = complejos.formatComplex(complejos.divide(z1, z2));
      else if (complexOp === 'cModulus')   result = String(complejos.modulus(z1));
      else if (complexOp === 'cArgument')  result = String(complejos.argument(z1));
      else if (complexOp === 'cConjugate') result = complejos.formatComplex(complejos.conjugate(z1));
      else if (complexOp === 'cPower')     result = complejos.formatComplex(complejos.power(z1, parseFloat(z2Real)));
      else if (complexOp === 'cSqrt')      result = complejos.formatComplex(complejos.sqrt(z1));
      else result = 'Operación no soportada';
      setComplexResult(result);
    } catch {
      setComplexResult('Error');
    }
  }

  return (
    <div className={styles.content}>
      <select
        data-testid="complex-op-select"
        value={complexOp}
        onChange={e => setComplexOp(e.target.value)}
      >
        <option value="cAdd">Suma (cAdd)</option>
        <option value="cSub">Resta (cSub)</option>
        <option value="cMul">Multiplicación (cMul)</option>
        <option value="cDiv">División (cDiv)</option>
        <option value="cModulus">Módulo (cModulus)</option>
        <option value="cArgument">Argumento (cArgument)</option>
        <option value="cConjugate">Conjugado (cConjugate)</option>
        <option value="cPower">Potencia (cPower)</option>
        <option value="cSqrt">Raíz cuadrada (cSqrt)</option>
      </select>

      <div className={styles.complexRow}>
        <label>z1 real: <input data-testid="complex-z1-real" type="number" value={z1Real} onChange={e => setZ1Real(e.target.value)} /></label>
        <label>z1 imag: <input data-testid="complex-z1-imag" type="number" value={z1Imag} onChange={e => setZ1Imag(e.target.value)} /></label>
      </div>
      <div className={styles.complexRow}>
        <label>z2 real: <input data-testid="complex-z2-real" type="number" value={z2Real} onChange={e => setZ2Real(e.target.value)} /></label>
        <label>z2 imag: <input data-testid="complex-z2-imag" type="number" value={z2Imag} onChange={e => setZ2Imag(e.target.value)} /></label>
      </div>

      <button data-testid="complex-calc-button" onClick={handleComplexCalc}>Calcular</button>
      {complexResult !== '' && (
        <div data-testid="complex-result">{complexResult}</div>
      )}
    </div>
  );
}

// ─── TabMatrix ────────────────────────────────────────────────────────────────

function TabMatrix() {
  const [matrixA,      setMatrixA]      = useState('');
  const [matrixB,      setMatrixB]      = useState('');
  const [matrixOp,     setMatrixOp]     = useState('matDet');
  const [matrixResult, setMatrixResult] = useState('');

  function handleMatrixCalc() {
    try {
      const A = parseMatrixString(matrixA);
      let res: string;
      if      (matrixOp === 'matDet')       res = String(matDet(A));
      else if (matrixOp === 'matTranspose') res = JSON.stringify(matTranspose(A));
      else if (matrixOp === 'matInverse')   res = JSON.stringify(matInverse(A));
      else {
        const B = parseMatrixString(matrixB);
        if      (matrixOp === 'matAdd') res = JSON.stringify(matAdd(A, B));
        else if (matrixOp === 'matSub') res = JSON.stringify(matSub(A, B));
        else if (matrixOp === 'matMul') res = JSON.stringify(matMul(A, B));
        else res = 'Operación no soportada';
      }
      setMatrixResult(res);
    } catch (e) {
      setMatrixResult('Error: ' + (e as Error).message);
    }
  }

  return (
    <div className={styles.content}>
      <select
        data-testid="matrix-op-select"
        value={matrixOp}
        onChange={e => setMatrixOp(e.target.value)}
      >
        <option value="matDet">Determinante</option>
        <option value="matTranspose">Transpuesta</option>
        <option value="matInverse">Inversa</option>
        <option value="matAdd">Suma (A+B)</option>
        <option value="matSub">Resta (A-B)</option>
        <option value="matMul">Multiplicación (A×B)</option>
      </select>
      <textarea
        data-testid="matrix-a-input"
        placeholder="ej: 1,2;3,4"
        value={matrixA}
        onChange={e => setMatrixA(e.target.value)}
        rows={3}
      />
      <textarea
        data-testid="matrix-b-input"
        placeholder="ej: 1,0;0,1"
        value={matrixB}
        onChange={e => setMatrixB(e.target.value)}
        rows={3}
      />
      <button data-testid="matrix-calc-button" onClick={handleMatrixCalc}>Calcular</button>
      {matrixResult !== '' && (
        <div data-testid="matrix-result">{matrixResult}</div>
      )}
    </div>
  );
}

// ─── TabConvert ───────────────────────────────────────────────────────────────

function calcConvert(value: string, from: string, to: string, cat: string): string {
  try {
    const result = convert(parseFloat(value), from, to, cat);
    return String(parseFloat(result.toPrecision(10)));
  } catch {
    return 'Error';
  }
}

function TabConvert() {
  const defaultCat  = 'longitud';
  const defaultFrom = firstKey(UNITS[defaultCat]!.units as Record<string, unknown>);
  const defaultTo   = secondKey(UNITS[defaultCat]!.units as Record<string, unknown>);

  const [category,      setCategory]      = useState(defaultCat);
  const [fromUnit,      setFromUnit]      = useState(defaultFrom);
  const [toUnit,        setToUnit]        = useState(defaultTo);
  const [convertValue,  setConvertValue]  = useState('1');
  const [convertResult, setConvertResult] = useState(
    () => initialConvertResult()
  );

  function recalc(val: string, from: string, to: string, cat: string) {
    setConvertResult(calcConvert(val, from, to, cat));
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const cat  = e.target.value;
    const from = firstKey(UNITS[cat]!.units as Record<string, unknown>);
    const to   = secondKey(UNITS[cat]!.units as Record<string, unknown>);
    setCategory(cat);
    setFromUnit(from);
    setToUnit(to);
    recalc(convertValue, from, to, cat);
  }

  function handleFromChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setFromUnit(e.target.value);
    recalc(convertValue, e.target.value, toUnit, category);
  }

  function handleToChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setToUnit(e.target.value);
    recalc(convertValue, fromUnit, e.target.value, category);
  }

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    setConvertValue(e.target.value);
    recalc(e.target.value, fromUnit, toUnit, category);
  }

  const catUnits = UNITS[category]!.units;

  return (
    <div className={styles.content}>
      <select
        data-testid="convert-category"
        value={category}
        onChange={handleCategoryChange}
      >
        {Object.entries(UNITS).map(([key, cat]) => (
          <option key={key} value={key}>{cat.label}</option>
        ))}
      </select>

      <select data-testid="convert-from" value={fromUnit} onChange={handleFromChange}>
        {Object.keys(catUnits).map(u => (
          <option key={u} value={u}>{catUnits[u]!.label}</option>
        ))}
      </select>

      <input
        data-testid="convert-value"
        type="number"
        value={convertValue}
        onChange={handleValueChange}
      />

      <select data-testid="convert-to" value={toUnit} onChange={handleToChange}>
        {Object.keys(catUnits).map(u => (
          <option key={u} value={u}>{catUnits[u]!.label}</option>
        ))}
      </select>

      <div data-testid="convert-result">{convertResult}</div>
    </div>
  );
}

// ─── TabBases ─────────────────────────────────────────────────────────────────

function TabBases() {
  const [basesInput, setBasesInput] = useState('');
  const [binResult,  setBinResult]  = useState('');
  const [hexResult,  setHexResult]  = useState('');
  const [octResult,  setOctResult]  = useState('');

  function handleBasesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setBasesInput(value);
    const n = parseInt(value);
    if (!isNaN(n)) {
      setBinResult(convertDecimalToBinary(n));
      setHexResult(convertDecimalToHex(n));
      setOctResult(convertDecimalToOctal(n));
    } else {
      setBinResult('');
      setHexResult('');
      setOctResult('');
    }
  }

  return (
    <div className={styles.content}>
      <input
        data-testid="bases-input"
        type="number"
        placeholder="ej: 255"
        value={basesInput}
        onChange={handleBasesChange}
      />
      <div data-testid="bases-result-bin">BIN: {binResult}</div>
      <div data-testid="bases-result-hex">HEX: {hexResult}</div>
      <div data-testid="bases-result-oct">OCT: {octResult}</div>
    </div>
  );
}

// ─── AdvancedPanel ────────────────────────────────────────────────────────────

export function AdvancedPanel({ onInsert }: AdvancedPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('constants');

  function tabClass(tab: ActiveTab) {
    return activeTab === tab
      ? `${styles.tab} ${styles.tabActive}`
      : styles.tab;
  }

  return (
    <section data-testid="advanced-panel" className={styles.panel}>
      <div className={styles.tabs} role="tablist">
        <button
          data-testid="tab-constants" role="tab"
          aria-selected={activeTab === 'constants'}
          onClick={() => setActiveTab('constants')}
          className={tabClass('constants')}
        >Constantes</button>
        <button
          data-testid="tab-stats" role="tab"
          aria-selected={activeTab === 'stats'}
          onClick={() => setActiveTab('stats')}
          className={tabClass('stats')}
        >Estadística</button>
        <button
          data-testid="tab-complex" role="tab"
          aria-selected={activeTab === 'complex'}
          onClick={() => setActiveTab('complex')}
          className={tabClass('complex')}
        >Complejos</button>
        <button
          data-testid="tab-matrix" role="tab"
          aria-selected={activeTab === 'matrix'}
          onClick={() => setActiveTab('matrix')}
          className={tabClass('matrix')}
        >Matrices</button>
        <button
          data-testid="tab-convert" role="tab"
          aria-selected={activeTab === 'convert'}
          onClick={() => setActiveTab('convert')}
          className={tabClass('convert')}
        >Conversiones</button>
        <button
          data-testid="tab-bases" role="tab"
          aria-selected={activeTab === 'bases'}
          onClick={() => setActiveTab('bases')}
          className={tabClass('bases')}
        >Bases</button>
      </div>

      <div className={styles.content}>
        {activeTab === 'constants' && <TabConstants onInsert={onInsert} />}
        {activeTab === 'stats'     && <TabStats />}
        {activeTab === 'complex'   && <TabComplex />}
        {activeTab === 'matrix'    && <TabMatrix />}
        {activeTab === 'convert'   && <TabConvert />}
        {activeTab === 'bases'     && <TabBases />}
      </div>
    </section>
  );
}