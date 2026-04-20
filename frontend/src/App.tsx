import { useState, useEffect } from 'react';
import { useCalculator } from './hooks/useCalculator';
import { CalculatorDisplay } from './components/CalculatorDisplay';
import { CalculatorKeypad } from './components/CalculatorKeypad';
import { CASPanel } from './components/CASPanel/CASPanel';
import { GraphViewer } from './components/GraphViewer/GraphViewer';
import { AdvancedPanel } from './components/AdvancedPanel';
import { ConstantesView } from './components/ConstantesView/ConstantesView';
import { VariablesView } from './components/VariablesView/VariablesView';
import { HistorialView } from './components/HistorialView/HistorialView';
import { AjustesView } from './components/AjustesView/AjustesView';
import { ProyectosView } from './components/ProyectosView/ProyectosView';
import { SoporteView } from './components/SoporteView/SoporteView';
import { DocumentacionView } from './components/DocumentacionView/DocumentacionView';
import { PreciosView } from './components/PreciosView/PreciosView';
import { getStoredToken, getStoredName, getStoredPlan, logout } from './services/authService';
import AuthModal from './components/AuthModal/AuthModal';
import NuevoProyecto from './components/NuevoProyecto/NuevoProyecto';

type ActiveView = 'calculadora' | 'graficos' | 'avanzado' | 'constantes' | 'variables' | 'historial' | 'ajustes' | 'proyectos' | 'soporte' | 'documentacion' | 'precios';

export default function App() {
  const { expression, result, isError, angleMode, history, setHistory, handleKeyPress } = useCalculator();
  const [activeView,    setActiveView]    = useState<ActiveView>('calculadora');
  const [userEmail,     setUserEmail]     = useState<string | null>(null);
  const [userName,      setUserName]      = useState<string>('');
  const [userPlan,      setUserPlan]      = useState<string>('free');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNuevoProyecto, setShowNuevoProyecto] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const email = localStorage.getItem('calcing_email');
    if (token && email) {
      setUserEmail(email);
      setUserName(getStoredName());
      setUserPlan(getStoredPlan());
    }
  }, []);

  function handleLoginSuccess(email: string): void {
    localStorage.setItem('calcing_email', email);
    setUserEmail(email);
    setUserName(getStoredName());
    setUserPlan(getStoredPlan());
    setShowAuthModal(false);
  }

  async function handleLogout(): Promise<void> {
    await logout();
    localStorage.removeItem('calcing_email');
    setUserEmail(null);
    setUserName('');
    setUserPlan('free');
    setActiveView('calculadora');
  }

  const RESTRICTED_VIEWS: ActiveView[] = ['graficos', 'avanzado', 'constantes', 'variables', 'ajustes', 'proyectos'];

  useEffect(() => {
    if (!userEmail && RESTRICTED_VIEWS.includes(activeView)) {
      setActiveView('calculadora');
    }
  }, [userEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const navLinkBase = 'px-4 py-3 flex items-center gap-3 font-display text-sm uppercase tracking-widest transition-all';
  const navLinkActive = `${navLinkBase} bg-blue-900/20 text-primary border-r-4 border-primary-cta font-bold`;
  const navLinkIdle   = `${navLinkBase} text-slate-500 hover:bg-slate-800/50`;

  return (
    <div className="h-dvh overflow-hidden bg-surface font-body text-on-surface selection:bg-primary/30">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 flex justify-between items-center w-full px-6 h-16 bg-surface border-b border-blue-900/15">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-xl font-mono font-bold text-primary uppercase tracking-tighter">CalcIng</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-[0.2em] uppercase -mt-1">
              Motor de cálculo de ingeniería
            </span>
          </div>

        </div>

        {/* Auth section */}
        <div className="flex items-center gap-3" data-testid="auth-section">
          {userEmail ? (
            <>
              {/* User pill */}
              <button
                onClick={() => setActiveView('precios')}
                className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-low border border-white/10 hover:border-primary-cta/40 hover:bg-primary-cta/5 transition-all active:scale-95"
              >
                <div className="w-7 h-7 rounded-full bg-primary-cta/25 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-black text-primary uppercase">
                    {(userName || userEmail).charAt(0)}
                  </span>
                </div>
                <div className="flex flex-col leading-none">
                  <span data-testid="user-email" className="text-xs font-mono font-bold text-on-surface truncate max-w-[140px]">
                    {userName || userEmail}
                  </span>
                  <span className={`text-[10px] font-mono uppercase tracking-widest mt-0.5 ${
                    userPlan === 'pro' ? 'text-amber-400' :
                    userPlan === 'enterprise' ? 'text-violet-400' :
                    'text-slate-500'
                  }`}>
                    {userPlan}
                  </span>
                </div>
              </button>
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-red-500/25 text-red-400 text-xs font-mono font-bold uppercase tracking-wider hover:bg-red-500/10 hover:border-red-500/50 transition-all active:scale-95"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-primary-cta text-white px-5 py-2 rounded-lg text-sm font-medium hover:brightness-110 transition-all active:scale-95"
            >
              Acceso
            </button>
          )}
        </div>
      </header>

      {/* ── SIDEBAR (desktop) ──────────────────────────────────────────────── */}
      {/* Usa <a> elements — evita conflictos con getByRole('button') en tests */}
      <aside className="fixed left-0 top-16 bottom-0 w-[220px] hidden md:flex flex-col py-4 bg-surface border-r border-blue-900/15 z-40">
        {/* Project card */}
        <div className="px-5 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-low border border-outline/10">
            <div className="w-10 h-10 rounded-lg bg-primary-cta/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface font-display">Cálculo Simbólico</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Ingeniería de Precisión</p>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView('calculadora'); }}
            className={activeView === 'calculadora' ? navLinkActive : navLinkIdle}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1z"/>
            </svg>
            Cálculo
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); userEmail ? setActiveView('graficos') : setShowAuthModal(true); }}
            className={activeView === 'graficos' ? navLinkActive : navLinkIdle}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
            </svg>
            Gráficos
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView('historial'); }}
            className={activeView === 'historial' ? navLinkActive : navLinkIdle}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Historial
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); userEmail ? setActiveView('variables') : setShowAuthModal(true); }}
            className={activeView === 'variables' ? navLinkActive : navLinkIdle}
          >
            <span className="w-5 h-5 shrink-0 flex items-center justify-center text-base font-bold leading-none">Σ</span>
            Variables
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); userEmail ? setActiveView('constantes') : setShowAuthModal(true); }}
            className={activeView === 'constantes' ? navLinkActive : navLinkIdle}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Constantes
          </a>
          <a
            href="#"
            data-testid="sidebar-avanzado"
            onClick={(e) => { e.preventDefault(); userEmail ? setActiveView('avanzado') : setShowAuthModal(true); }}
            className={activeView === 'avanzado' ? navLinkActive : navLinkIdle}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
            Avanzado
          </a>
          {userEmail && (
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveView('ajustes'); }}
              className={activeView === 'ajustes' ? navLinkActive : navLinkIdle}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Ajustes
            </a>
          )}
        </nav>

        {/* Bottom section */}
        <div className="px-4 pt-4 border-t border-blue-900/10 flex flex-col gap-1">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView('precios'); }}
            className={`flex items-center gap-2 px-2 py-2 text-[11px] hover:text-slate-300 transition-colors uppercase tracking-widest font-display ${activeView === 'precios' ? 'text-primary' : 'text-slate-500'}`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Precios
          </a>
          <button
            onClick={() => userEmail ? setShowNuevoProyecto(true) : setShowAuthModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 mb-2 rounded-lg border border-primary-cta/40 text-primary-cta text-xs font-mono font-bold tracking-widest uppercase hover:bg-primary-cta/10 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo Proyecto
          </button>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView('documentacion'); }}
            className={`flex items-center gap-2 px-2 py-2 text-[11px] hover:text-slate-300 transition-colors uppercase tracking-widest font-display ${activeView === 'documentacion' ? 'text-primary' : 'text-slate-500'}`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Documentación
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView('soporte'); }}
            className={`flex items-center gap-2 px-2 py-2 text-[11px] hover:text-slate-300 transition-colors uppercase tracking-widest font-display ${activeView === 'soporte' ? 'text-primary' : 'text-slate-500'}`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Soporte
          </a>
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <main className="ml-0 md:ml-[220px] mt-16 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100dvh-64px)] overflow-hidden pb-20 md:pb-4">

        {/* Centro: vista activa */}
        <section className={`${activeView === 'calculadora' ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col gap-4 lg:overflow-hidden`}>
          {activeView === 'calculadora' && (
            <>
              <CalculatorDisplay expression={expression} result={result} isError={isError} />
              <CalculatorKeypad onKeyPress={handleKeyPress} angleMode={angleMode} />
            </>
          )}
          {activeView === 'graficos' && <GraphViewer />}
          {activeView === 'avanzado' && <AdvancedPanel onInsert={handleKeyPress} />}
          {activeView === 'constantes' && <ConstantesView onInsert={handleKeyPress} />}
          {activeView === 'variables' && <VariablesView onInsert={handleKeyPress} />}
          {activeView === 'proyectos' && <ProyectosView />}
          {activeView === 'historial' && <HistorialView history={history} setHistory={setHistory} onInsert={handleKeyPress} />}
          {activeView === 'soporte' && <SoporteView />}
          {activeView === 'documentacion' && <DocumentacionView />}
          {activeView === 'precios' && <PreciosView currentPlan={userPlan} />}
          {activeView === 'ajustes' && (
            <AjustesView
              angleMode={angleMode}
              onAngleModeChange={mode => handleKeyPress(`MODE_${mode}`)}
              userEmail={userEmail}
              onLogout={handleLogout}
            />
          )}
        </section>

        {/* Derecha: CASPanel solo en vista Cálculo */}
        {activeView === 'calculadora' && (
          <aside className="lg:col-span-4 flex flex-col gap-4 lg:overflow-hidden">
            <CASPanel />
          </aside>
        )}
      </main>

      {/* ── BOTTOM NAV (mobile) ────────────────────────────────────────────── */}
      {/* Usa <a> elements — evita conflictos con getByRole('button') en tests */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 md:hidden bg-surface/90 backdrop-blur-xl border-t border-blue-900/30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setActiveView('calculadora'); }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${activeView === 'calculadora' ? 'bg-primary-cta text-white scale-110 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-500'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1z"/>
          </svg>
          <span className="font-display text-[10px] font-bold uppercase mt-1">Calc</span>
        </a>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); userEmail ? setActiveView('graficos') : setShowAuthModal(true); }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${activeView === 'graficos' ? 'bg-primary-cta text-white scale-110 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-500'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
          </svg>
          <span className="font-display text-[10px] font-bold uppercase mt-1">Graph</span>
        </a>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); userEmail ? setActiveView('avanzado') : setShowAuthModal(true); }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${activeView === 'avanzado' ? 'bg-primary-cta text-white scale-110 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-500'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
          </svg>
          <span className="font-display text-[10px] font-bold uppercase mt-1">Avanz.</span>
        </a>
        {userEmail && (
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView('proyectos'); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${activeView === 'proyectos' ? 'bg-primary-cta text-white scale-110 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-500'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
            </svg>
            <span className="font-display text-[10px] font-bold uppercase mt-1">Proyec.</span>
          </a>
        )}
      </nav>

      {/* ── AUTH MODAL ─────────────────────────────────────────────────────── */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {/* ── NUEVO PROYECTO MODAL ───────────────────────────────────────────── */}
      {showNuevoProyecto && (
        <NuevoProyecto
          onClose={() => setShowNuevoProyecto(false)}
        />
      )}
    </div>
  );
}