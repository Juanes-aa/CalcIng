import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Proyecto {
  id:          string;
  nombre:      string;
  descripcion: string;
  creadoEn:    number;
}

interface ProyectosViewProps {
  onInsert?: (value: string) => void;
}

// ─── Persistencia ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'calcIng_proyectos';

function loadProyectos(): Proyecto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Proyecto[];
  } catch {
    return [];
  }
}

function saveProyectos(proyectos: Proyecto[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(proyectos));
}

function genId(): string {
  return `proy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Clases compartidas ───────────────────────────────────────────────────────

const labelCls   = 'text-[10px] font-bold text-(--color-on-surface-dim) uppercase tracking-widest';
const inputCls   = 'w-full bg-(--color-surface) text-(--color-on-surface) font-mono text-sm px-3 py-2.5 rounded-xl border border-(--color-outline)/40 focus:border-(--color-primary-cta) focus:ring-1 focus:ring-(--color-primary-cta)/30 focus:outline-none transition-all placeholder:text-(--color-outline)';
const btnPrimary = 'py-2.5 px-5 bg-(--color-primary-cta) text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_2px_12px_rgba(37,99,235,0.2)]';
const btnGhost   = 'py-2 px-3 text-xs font-bold uppercase tracking-wider text-(--color-on-surface-dim) hover:text-(--color-on-surface) rounded-lg hover:bg-(--color-surface-mid) transition-all';

// ─── Formulario de creación ───────────────────────────────────────────────────

interface CrearFormProps {
  onCrear:    (p: Proyecto) => void;
  onCancelar: () => void;
}

function CrearForm({ onCrear, onCancelar }: CrearFormProps): React.ReactElement {
  const [nombre,      setNombre]      = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error,       setError]       = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed) { setError('El nombre es obligatorio'); return; }
    onCrear({ id: genId(), nombre: trimmed, descripcion: descripcion.trim(), creadoEn: Date.now() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 bg-(--color-surface-low) rounded-xl border border-(--color-primary-cta)/20">
      <h3 className="text-sm font-bold text-(--color-on-surface) font-display uppercase tracking-widest">
        Nuevo proyecto
      </h3>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Nombre *</label>
        <input
          data-testid="proyecto-nombre-input"
          type="text"
          placeholder="ej: Cálculo de vigas"
          value={nombre}
          onChange={e => { setNombre(e.target.value); setError(''); }}
          className={inputCls}
          autoFocus
        />
        {error && <span className="text-xs text-red-400 font-mono px-1">{error}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Descripción (opcional)</label>
        <input
          data-testid="proyecto-descripcion-input"
          type="text"
          placeholder="ej: Proyecto de estructuras metálicas"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          className={inputCls}
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancelar} className={btnGhost}>
          Cancelar
        </button>
        <button type="submit" data-testid="proyecto-crear-btn" className={btnPrimary}>
          Crear proyecto
        </button>
      </div>
    </form>
  );
}

// ─── Tarjeta de proyecto ──────────────────────────────────────────────────────

interface ProyectoCardProps {
  proyecto:   Proyecto;
  onEliminar: (id: string) => void;
}

function ProyectoCard({ proyecto, onEliminar }: ProyectoCardProps): React.ReactElement {
  const [confirmar, setConfirmar] = useState(false);

  return (
    <div
      data-testid="proyecto-card"
      className="flex items-start justify-between gap-4 p-4 bg-(--color-surface-low) rounded-xl border border-(--color-outline)/15 hover:border-(--color-outline)/30 transition-all"
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-sm font-bold text-(--color-on-surface) font-display truncate">
          {proyecto.nombre}
        </span>
        {proyecto.descripcion && (
          <span className="text-xs text-(--color-on-surface-dim) truncate">
            {proyecto.descripcion}
          </span>
        )}
        <span className="text-[10px] text-(--color-on-surface-dim) font-mono mt-1">
          Creado el {formatDate(proyecto.creadoEn)}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {confirmar ? (
          <>
            <button
              onClick={() => onEliminar(proyecto.id)}
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors px-2 py-1"
            >
              Confirmar
            </button>
            <button
              onClick={() => setConfirmar(false)}
              className={btnGhost}
            >
              No
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmar(true)}
            className="p-1.5 rounded-lg text-(--color-on-surface-dim) hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Eliminar proyecto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ProyectosView ────────────────────────────────────────────────────────────

export function ProyectosView({ onInsert: _onInsert }: ProyectosViewProps): React.ReactElement {
  const [proyectos,   setProyectos]   = useState<Proyecto[]>(loadProyectos);
  const [mostrarForm, setMostrarForm] = useState(false);

  function handleCrear(p: Proyecto): void {
    const nuevos = [p, ...proyectos];
    setProyectos(nuevos);
    saveProyectos(nuevos);
    setMostrarForm(false);
  }

  function handleEliminar(id: string): void {
    const nuevos = proyectos.filter(p => p.id !== id);
    setProyectos(nuevos);
    saveProyectos(nuevos);
  }

  return (
    <section
      data-testid="proyectos-view"
      className="flex-1 min-h-0 bg-(--color-surface-low) rounded-xl border border-(--color-outline)/20 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-outline)/15 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-(--color-on-surface) font-display uppercase tracking-widest">
            Proyectos
          </h2>
          <p className="text-[10px] text-(--color-on-surface-dim) mt-0.5">
            {proyectos.length === 0
              ? 'Sin proyectos guardados'
              : `${proyectos.length} proyecto${proyectos.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {!mostrarForm && (
          <button
            data-testid="nuevo-proyecto-btn"
            onClick={() => setMostrarForm(true)}
            className={btnPrimary + ' flex items-center gap-2'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo proyecto
          </button>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {mostrarForm && (
          <CrearForm onCrear={handleCrear} onCancelar={() => setMostrarForm(false)} />
        )}

        {proyectos.length === 0 && !mostrarForm ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-(--color-surface-mid) flex items-center justify-center">
              <svg className="w-7 h-7 text-(--color-on-surface-dim)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-(--color-on-surface) font-display">Sin proyectos aún</p>
              <p className="text-xs text-(--color-on-surface-dim) mt-1">
                Crea un proyecto para organizar tus cálculos
              </p>
            </div>
            <button
              onClick={() => setMostrarForm(true)}
              className={btnPrimary}
            >
              Crear primer proyecto
            </button>
          </div>
        ) : (
          proyectos.map(p => (
            <ProyectoCard key={p.id} proyecto={p} onEliminar={handleEliminar} />
          ))
        )}
      </div>
    </section>
  );
}
