import { useState } from 'react';
import { useCalculator } from './hooks/useCalculator';
import { CalculatorDisplay } from './components/CalculatorDisplay';
import { CalculatorKeypad } from './components/CalculatorKeypad';
import { CASPanel } from './components/CASPanel/CASPanel';
import { GraphViewer } from './components/GraphViewer/GraphViewer';
import styles from './App.module.css';

export default function App() {
  const { expression, result, isError, angleMode, handleKeyPress } = useCalculator();
  const [showCAS, setShowCAS] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

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

        {showCAS && <CASPanel />}
        {showGraph && <GraphViewer />}
      </main>
    </div>
  );
}