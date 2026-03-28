import { useState, useEffect } from 'react';
import { useCalculator } from './hooks/useCalculator';
import { CalculatorDisplay } from './components/CalculatorDisplay';
import { CalculatorKeypad } from './components/CalculatorKeypad';
import { CASPanel } from './components/CASPanel/CASPanel';
import { GraphViewer } from './components/GraphViewer/GraphViewer';
import { AdvancedPanel } from './components/AdvancedPanel';
import styles from './App.module.css';
import { getStoredToken, logout } from './services/authService';
import AuthModal from './components/AuthModal/AuthModal';

export default function App() {
  const { expression, result, isError, angleMode, handleKeyPress } = useCalculator();
  const [showCAS,      setShowCAS]      = useState(false);
  const [showGraph,    setShowGraph]    = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const email = localStorage.getItem('calcing_email');
    if (token && email) setUserEmail(email);
  }, []);

  function handleLoginSuccess(email: string): void {
    localStorage.setItem('calcing_email', email);
    setUserEmail(email);
    setShowAuthModal(false);
  }

  async function handleLogout(): Promise<void> {
    await logout();
    localStorage.removeItem('calcing_email');
    setUserEmail(null);
  }

  return (
    <div className={styles.shell}>
      <main className={showCAS ? `${styles.calculator} ${styles.casVisible}` : styles.calculator}>
        <header className={styles.header}>
          <span className={styles.wordmark}>CalcIng</span>
          <span className={styles.tagline}>motor de cálculo de ingeniería</span>
          <button
            data-testid="cas-toggle"
            onClick={() => setShowCAS(v => !v)}
            aria-pressed={showCAS}
            aria-label="CAS"
            className={styles.casToggle}
          >
            CAS
          </button>
          <button
            data-testid="graph-toggle"
            onClick={() => setShowGraph(v => !v)}
            aria-pressed={showGraph}
            aria-label="Graficar"
            className={styles.casToggle}
          >
            Graficar
          </button>
          <button
            data-testid="advanced-toggle"
            onClick={() => setShowAdvanced(v => !v)}
            aria-pressed={showAdvanced}
            aria-label="Avanzado"
            className={styles.casToggle}
          >
            Avanzado
          </button>
          <div data-testid="auth-section">
            {userEmail ? (
              <>
                <span data-testid="user-email">{userEmail}</span>
                <button onClick={handleLogout}>Cerrar sesión</button>
              </>
            ) : (
              <button onClick={() => setShowAuthModal(true)}>Login</button>
            )}
          </div>
        </header>

        <CalculatorDisplay
          expression={expression}
          result={result}
          isError={isError}
        />

        <CalculatorKeypad
          onKeyPress={handleKeyPress}
          angleMode={angleMode}
        />

        {showCAS      && <CASPanel />}
        {showGraph    && <GraphViewer />}
        {showAdvanced && <AdvancedPanel onInsert={handleKeyPress} />}
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleLoginSuccess}
          />
        )}
      </main>
    </div>
  );
}