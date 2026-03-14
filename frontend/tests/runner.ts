/**
 * runner.ts - Lightweight vitest-compatible test runner using tsx
 * Shims describe/it/expect so math.test.ts runs without npm install
 */

let passed = 0, failed = 0;
const suites: { name: string; tests: { name: string; fn: () => void }[] }[] = [];
let currentSuite: { name: string; tests: { name: string; fn: () => void }[] } | null = null;

(globalThis as unknown as Record<string, unknown>).describe = function(name: string, fn: () => void) {
  currentSuite = { name, tests: [] };
  suites.push(currentSuite);
  fn();
};

(globalThis as unknown as Record<string, unknown>).it = function(name: string, fn: () => void) {
  currentSuite!.tests.push({ name, fn });
};

function makeExpect(val: unknown) {
  return {
    toBe(expected: unknown) {
      if (val !== expected)
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`);
    },
    toBeNull() {
      if (val !== null) throw new Error(`Expected null, got ${JSON.stringify(val)}`);
    },
    toBeLessThanOrEqual(n: number) {
      if ((val as number) > n) throw new Error(`Expected ${val} <= ${n}`);
    },
    toContain(s: string) {
      if (!String(val).includes(s)) throw new Error(`Expected "${val}" to contain "${s}"`);
    },
    toThrow() {
      if (typeof val !== 'function') throw new Error('Expected a function');
      let threw = false;
      try { (val as () => void)(); } catch { threw = true; }
      if (!threw) throw new Error('Expected function to throw');
    },
  };
}
(globalThis as unknown as Record<string, unknown>).expect = makeExpect;

// Import and run tests
await import('./engine/math.test.ts');

// Run all suites
console.log('\n\x1b[33m=== CalcIng — Test Suite (tsx runner) ===\x1b[0m');

for (const suite of suites) {
  console.log(`\n\x1b[36m▶ ${suite.name}\x1b[0m`);
  for (const test of suite.tests) {
    try {
      await Promise.resolve(test.fn());
      console.log(`  \x1b[32m✓\x1b[0m ${test.name}`);
      passed++;
    } catch (e) {
      console.log(`  \x1b[31m✗\x1b[0m ${test.name}`);
      console.log(`    \x1b[31m${(e as Error).message}\x1b[0m`);
      failed++;
    }
  }
}

console.log(`\n${'═'.repeat(45)}`);
console.log(`Total: ${passed + failed} pruebas`);
console.log(`\x1b[32m✓ Aprobadas: ${passed}\x1b[0m`);
if (failed > 0) {
  console.log(`\x1b[31m✗ Falladas:  ${failed}\x1b[0m`);
  process.exit(1);
} else {
  console.log('\x1b[32m¡Todas las pruebas pasaron!\x1b[0m');
}
