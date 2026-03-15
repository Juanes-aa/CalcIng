import { useState, useRef, useEffect, useCallback } from 'react';
import {
  adaptiveSample,
  evaluatePoint,
  sampleParametric,
  samplePolar,
  numericalIntegral,
} from '@engine/graphEngine/evaluator';
import type { Point } from '@engine/graphEngine/evaluator';
import styles from './GraphViewer.module.css';

interface ZoomWindow {
  xMin: number; xMax: number;
  yMin: number; yMax: number;
}

const DEFAULT_ZOOM: ZoomWindow = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
const ZOOM_FACTOR  = 0.7;
const MAX_FNS      = 6;
const COLORS       = ['#00e5ff', '#ff4081', '#76ff03', '#ffab40', '#e040fb', '#ff6d00'];
const DERIV_COLOR  = '#ff6b6b';

export function GraphViewer() {
  const [mode, setMode] = useState<'cartesian' | 'parametric' | 'polar'>('cartesian');
  const [exprs,       setExprs]       = useState<string[]>(['']);
  const [paramExprs,  setParamExprs]  = useState<{ x: string; y: string }[]>([{ x: '', y: '' }]);
  const [polarExprs,  setPolarExprs]  = useState<string[]>(['']);
  const [tMin,        setTMin]        = useState(0);
  const [tMax,        setTMax]        = useState(Math.PI * 2);
  const [showDeriv,   setShowDeriv]   = useState(false);
  const [showArea,    setShowArea]    = useState(false);
  const [areaA,       setAreaA]       = useState(-1);
  const [areaB,       setAreaB]       = useState(1);
  const [zoom,        setZoom]        = useState<ZoomWindow>(DEFAULT_ZOOM);
  const [xMin,        setXMin]        = useState<number>(DEFAULT_ZOOM.xMin);
  const [xMax,        setXMax]        = useState<number>(DEFAULT_ZOOM.xMax);
  const [yMin,        setYMin]        = useState<number>(DEFAULT_ZOOM.yMin);
  const [yMax,        setYMax]        = useState<number>(DEFAULT_ZOOM.yMax);
  const [tooltip,     setTooltip]     = useState<{
    x: number; y: number; fx: number | null; visible: boolean;
  }>({ x: 0, y: 0, fx: null, visible: false });
  const [isPanning,   setIsPanning]   = useState(false);
  const panStart = useRef<{ x: number; y: number; zoom: ZoomWindow } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Valor numérico del área bajo la curva
  const areaValue = (showArea && mode === 'cartesian' && exprs[0]?.trim())
    ? numericalIntegral(exprs[0], areaA, areaB)
    : null;

  // ── Dibujo ────────────────────────────────────────────────────────────────
  const drawCurve = useCallback((
    ctx: CanvasRenderingContext2D,
    pts: Point[],
    color: string,
    W: number,
    H: number,
    z: ZoomWindow
  ) => {
    if (pts.length === 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    pts.forEach(({ x, y }) => {
      if (y < z.yMin - (z.yMax - z.yMin) || y > z.yMax + (z.yMax - z.yMin)) {
        started = false; return;
      }
      const px = ((x - z.xMin) / (z.xMax - z.xMin)) * W;
      const py = H - ((y - z.yMin) / (z.yMax - z.yMin)) * H;
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width  = canvas.offsetWidth  || 400;
    const H = canvas.height = canvas.offsetHeight || 300;
    const z = zoom;

    const toCanvasX = (x: number) => ((x - z.xMin) / (z.xMax - z.xMin)) * W;
    const toCanvasY = (y: number) => H - ((y - z.yMin) / (z.yMax - z.yMin)) * H;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(z.xMin); x <= z.xMax; x++) {
      const px = toCanvasX(x);
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    }
    for (let y = Math.ceil(z.yMin); y <= z.yMax; y++) {
      const py = toCanvasY(y);
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    }

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    const axisY = toCanvasY(0);
    ctx.beginPath(); ctx.moveTo(0, axisY); ctx.lineTo(W, axisY); ctx.stroke();
    const axisX = toCanvasX(0);
    ctx.beginPath(); ctx.moveTo(axisX, 0); ctx.lineTo(axisX, H); ctx.stroke();

    if (showArea && mode === 'cartesian' && exprs[0]?.trim()) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.beginPath();
      const xStart = toCanvasX(areaA);
      const xEnd   = toCanvasX(areaB);
      const yZero  = toCanvasY(0);
      ctx.moveTo(xStart, yZero);
      const ptsArea = adaptiveSample(exprs[0], areaA, areaB);
      ptsArea.forEach(pt => {
        ctx.lineTo(toCanvasX(pt.x), toCanvasY(pt.y));
      });
      ctx.lineTo(xEnd, yZero);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (mode === 'cartesian') {
      exprs.forEach((expr, idx) => {
        if (expr.trim() === '') return;
        const pts = adaptiveSample(expr, z.xMin, z.xMax);
        drawCurve(ctx, pts, COLORS[idx % COLORS.length], W, H, z);
      });

      if (showDeriv && exprs[0].trim() !== '') {
        const expr = exprs[0];
        const derivPts = adaptiveSample(expr, z.xMin, z.xMax).map(({ x }) => {
          const h = 0.001;
          const yp = evaluatePoint(expr, x + h);
          const ym = evaluatePoint(expr, x - h);
          if (yp === null || ym === null) return null;
          return { x, y: (yp - ym) / (2 * h) };
        }).filter((p): p is Point => p !== null);
        drawCurve(ctx, derivPts, DERIV_COLOR, W, H, z);
      }
    } else if (mode === 'parametric') {
      paramExprs.forEach((pe, idx) => {
        const pts = sampleParametric(pe.x, pe.y, tMin, tMax);
        drawCurve(ctx, pts, COLORS[idx % COLORS.length], W, H, z);
      });
    } else {
      polarExprs.forEach((re, idx) => {
        const pts = samplePolar(re, tMin, tMax);
        drawCurve(ctx, pts, COLORS[idx % COLORS.length], W, H, z);
      });
    }
  }, [exprs, paramExprs, polarExprs, zoom, mode, tMin, tMax, showDeriv, showArea, areaA, areaB, drawCurve]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    setXMin(zoom.xMin);
    setXMax(zoom.xMax);
    setYMin(zoom.yMin);
    setYMax(zoom.yMax);
  }, [zoom]);

  // ── Zoom con rueda ────────────────────────────────────────────────────────
  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    setZoom(z => {
      const cx = (z.xMin + z.xMax) / 2;
      const cy = (z.yMin + z.yMax) / 2;
      const hw = (z.xMax - z.xMin) / 2 * factor;
      const hh = (z.yMax - z.yMin) / 2 * factor;
      return { xMin: cx - hw, xMax: cx + hw, yMin: cy - hh, yMax: cy + hh };
    });
  }

  // ── Pan con arrastrar ─────────────────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, zoom };
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth  || 400;
    const H = canvas.offsetHeight || 300;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const mathX = zoom.xMin + (px / W) * (zoom.xMax - zoom.xMin);
    const mathY = mode === 'cartesian' && exprs[0].trim() !== ''
      ? evaluatePoint(exprs[0], mathX)
      : null;
    setTooltip({ x: px, y: py, fx: mathY, visible: true });

    if (!isPanning || !panStart.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    const z  = panStart.current.zoom;
    const rangeX = z.xMax - z.xMin;
    const rangeY = z.yMax - z.yMin;
    const shiftX = -(dx / W) * rangeX;
    const shiftY =  (dy / H) * rangeY;
    setZoom({
      xMin: z.xMin + shiftX,
      xMax: z.xMax + shiftX,
      yMin: z.yMin + shiftY,
      yMax: z.yMax + shiftY,
    });
  }

  function handleMouseUp() {
    setIsPanning(false);
    panStart.current = null;
  }

  function handleMouseLeave() {
    setIsPanning(false);
    panStart.current = null;
    setTooltip(t => ({ ...t, visible: false }));
  }

  function handleDblClick() {
    setZoom(DEFAULT_ZOOM);
  }

  function handleExport() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grafica.png';
    a.click();
  }

  function applyRange() {
    setZoom({ xMin, xMax, yMin, yMax });
  }

  function handleClear() {
    setExprs(['']);
    setParamExprs([{ x: '', y: '' }]);
    setPolarExprs(['']);
    setZoom(DEFAULT_ZOOM);
  }

  // ── Gestión de funciones ──────────────────────────────────────────────────
  function addFn() {
    if (exprs.length < MAX_FNS) {
      setExprs(e => [...e, '']);
      setParamExprs(p => [...p, { x: '', y: '' }]);
      setPolarExprs(p => [...p, '']);
    }
  }

  function removeFn(i: number) {
    setExprs(e => e.filter((_, idx) => idx !== i));
    setParamExprs(p => p.filter((_, idx) => idx !== i));
    setPolarExprs(p => p.filter((_, idx) => idx !== i));
  }

  function updateExpr(i: number, val: string) {
    setExprs(e => e.map((ex, idx) => idx === i ? val : ex));
  }

  function updateParamX(i: number, val: string) {
    setParamExprs(p => p.map((pe, idx) => idx === i ? { ...pe, x: val } : pe));
  }

  function updateParamY(i: number, val: string) {
    setParamExprs(p => p.map((pe, idx) => idx === i ? { ...pe, y: val } : pe));
  }

  function updatePolar(i: number, val: string) {
    setPolarExprs(p => p.map((re, idx) => idx === i ? val : re));
  }

  function zoomIn() {
    setZoom(z => {
      const cx = (z.xMin + z.xMax) / 2, cy = (z.yMin + z.yMax) / 2;
      const hw = (z.xMax - z.xMin) / 2 * ZOOM_FACTOR;
      const hh = (z.yMax - z.yMin) / 2 * ZOOM_FACTOR;
      return { xMin: cx - hw, xMax: cx + hw, yMin: cy - hh, yMax: cy + hh };
    });
  }

  function zoomOut() {
    setZoom(z => {
      const cx = (z.xMin + z.xMax) / 2, cy = (z.yMin + z.yMax) / 2;
      const hw = (z.xMax - z.xMin) / 2 / ZOOM_FACTOR;
      const hh = (z.yMax - z.yMin) / 2 / ZOOM_FACTOR;
      return { xMin: cx - hw, xMax: cx + hw, yMin: cy - hh, yMax: cy + hh };
    });
  }

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <section data-testid="graph-viewer" className={styles.viewer}>

      {/* Selector de modo */}
      <select
        data-testid="graph-mode-select"
        value={mode}
        onChange={e => setMode(e.target.value as 'cartesian' | 'parametric' | 'polar')}
        className={styles.modeSelect}
      >
        <option value="cartesian">Cartesiano</option>
        <option value="parametric">Paramétrico</option>
        <option value="polar">Polar</option>
      </select>

      {/* Inputs condicionales por modo */}
      {mode === 'cartesian' && exprs.map((expr, i) => (
        <div key={i} className={styles.fnRow}>
          <input
            data-testid={`graph-fn-input-${i}`}
            type="text"
            value={expr}
            onChange={e => updateExpr(i, e.target.value)}
            placeholder={`f${i + 1}(x) = ...`}
            className={styles.fnInput}
          />
          {exprs.length > 1 && (
            <button
              data-testid={`graph-remove-fn-${i}`}
              onClick={() => removeFn(i)}
              className={styles.btnIcon}
            >✕</button>
          )}
        </div>
      ))}

      {mode === 'parametric' && paramExprs.map((pe, i) => (
        <div key={i} className={styles.fnRow}>
          <input
            data-testid={`graph-param-x-${i}`}
            type="text"
            value={pe.x}
            onChange={e => updateParamX(i, e.target.value)}
            placeholder={`x${i + 1}(t) = ...`}
            className={styles.fnInput}
          />
          <input
            data-testid={`graph-param-y-${i}`}
            type="text"
            value={pe.y}
            onChange={e => updateParamY(i, e.target.value)}
            placeholder={`y${i + 1}(t) = ...`}
            className={styles.fnInput}
          />
          {paramExprs.length > 1 && (
            <button
              data-testid={`graph-remove-fn-${i}`}
              onClick={() => removeFn(i)}
              className={styles.btnIcon}
            >✕</button>
          )}
        </div>
      ))}

      {mode === 'polar' && polarExprs.map((re, i) => (
        <div key={i} className={styles.fnRow}>
          <input
            data-testid={`graph-polar-r-${i}`}
            type="text"
            value={re}
            onChange={e => updatePolar(i, e.target.value)}
            placeholder={`r${i + 1}(θ) = ...`}
            className={styles.fnInput}
          />
          {polarExprs.length > 1 && (
            <button
              data-testid={`graph-remove-fn-${i}`}
              onClick={() => removeFn(i)}
              className={styles.btnIcon}
            >✕</button>
          )}
        </div>
      ))}

      {/* tMin / tMax — solo en paramétrico y polar */}
      {(mode === 'parametric' || mode === 'polar') && (
        <div className={styles.rangeRow}>
          <span className={styles.rangeLabel}>t:</span>
          <input
            data-testid="graph-tmin"
            type="number"
            value={tMin}
            onChange={e => setTMin(Number(e.target.value))}
            className={styles.numInput}
          />
          <span className={styles.rangeLabel}>→</span>
          <input
            data-testid="graph-tmax"
            type="number"
            value={tMax}
            onChange={e => setTMax(Number(e.target.value))}
            className={styles.numInput}
          />
        </div>
      )}

      {/* Toggle derivada y área — solo cartesiano */}
      {mode === 'cartesian' && (
        <>
          <label className={styles.toggleLabel}>
            <input
              data-testid="graph-deriv-toggle"
              type="checkbox"
              checked={showDeriv}
              onChange={e => setShowDeriv(e.target.checked)}
            />
            Mostrar f'(x)
          </label>

          <label className={styles.toggleLabel}>
            <input
              data-testid="graph-area-toggle"
              type="checkbox"
              checked={showArea}
              onChange={e => setShowArea(e.target.checked)}
            />
            Mostrar área
          </label>

          {showArea && (
            <div className={styles.rangeRow}>
              <span className={styles.rangeLabel}>a:</span>
              <input
                data-testid="graph-area-a"
                type="number"
                value={areaA}
                onChange={e => setAreaA(Number(e.target.value))}
                className={styles.numInput}
              />
              <span className={styles.rangeLabel}>b:</span>
              <input
                data-testid="graph-area-b"
                type="number"
                value={areaB}
                onChange={e => setAreaB(Number(e.target.value))}
                className={styles.numInput}
              />
              <span data-testid="graph-area-value" className={styles.areaValue}>
                {areaValue !== null ? areaValue.toFixed(6) : '—'}
              </span>
            </div>
          )}
        </>
      )}

      {/* Botones de acción */}
      <div className={styles.actions}>
        {exprs.length < MAX_FNS && (
          <button
            data-testid="graph-add-fn"
            onClick={addFn}
            className={styles.btnSecondary}
          >+ función</button>
        )}
        <button
          data-testid="graph-plot-button"
          onClick={draw}
          className={styles.btnPrimary}
        >Graficar</button>
        <button
          data-testid="graph-clear-button"
          onClick={handleClear}
          className={styles.btnSecondary}
        >Limpiar</button>
        <button
          data-testid="graph-export-button"
          onClick={handleExport}
          className={styles.btnSecondary}
        >Exportar PNG</button>
      </div>

      {/* Controles de zoom */}
      <div className={styles.zoomRow}>
        <button data-testid="graph-zoom-in"    onClick={zoomIn}                    className={styles.btnIcon}>+</button>
        <button data-testid="graph-zoom-out"   onClick={zoomOut}                   className={styles.btnIcon}>-</button>
        <button data-testid="graph-zoom-reset" onClick={() => setZoom(DEFAULT_ZOOM)} className={styles.btnIcon}>⌂</button>
      </div>

      {/* Rango manual */}
      <div className={styles.rangeRow}>
        <span className={styles.rangeLabel}>x:</span>
        <input data-testid="graph-xmin" type="number" value={xMin}
          onChange={e => setXMin(Number(e.target.value))} onBlur={applyRange}
          className={styles.numInput} />
        <input data-testid="graph-xmax" type="number" value={xMax}
          onChange={e => setXMax(Number(e.target.value))} onBlur={applyRange}
          className={styles.numInput} />
        <span className={styles.rangeLabel}>y:</span>
        <input data-testid="graph-ymin" type="number" value={yMin}
          onChange={e => setYMin(Number(e.target.value))} onBlur={applyRange}
          className={styles.numInput} />
        <input data-testid="graph-ymax" type="number" value={yMax}
          onChange={e => setYMax(Number(e.target.value))} onBlur={applyRange}
          className={styles.numInput} />
      </div>

      {/* Tooltip HTML overlay */}
      <div
        data-testid="graph-tooltip"
        style={{
          position:      'absolute',
          left:          tooltip.x + 12,
          top:           tooltip.y + 12,
          background:    'rgba(0,0,0,0.75)',
          color:         '#fff',
          padding:       '4px 8px',
          borderRadius:  4,
          fontSize:      12,
          pointerEvents: 'none',
          visibility:    tooltip.visible ? 'visible' : 'hidden',
        }}
      >
        {tooltip.fx !== null
          ? `x: ${(zoom.xMin + (tooltip.x / (canvasRef.current?.offsetWidth || 400)) * (zoom.xMax - zoom.xMin)).toFixed(3)}, f(x): ${tooltip.fx?.toFixed(3)}`
          : `x: ${(zoom.xMin + (tooltip.x / (canvasRef.current?.offsetWidth || 400)) * (zoom.xMax - zoom.xMin)).toFixed(3)}`
        }
      </div>

      <canvas
        data-testid="graph-canvas"
        ref={canvasRef}
        className={styles.canvas}
        style={{ cursor: isPanning ? 'grabbing' : 'crosshair' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDblClick}
      />
    </section>
  );
}