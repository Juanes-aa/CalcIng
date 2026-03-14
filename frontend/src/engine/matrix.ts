/**
 * matrix.ts
 * Operaciones matriciales en JavaScript puro para la calculadora de ingeniería.
 */

type Matrix = number[][];

// ─── Validación ───────────────────────────────────────────────────────────────

export function isValidMatrix(M: unknown): M is Matrix {
  if (!Array.isArray(M) || M.length === 0) return false;
  const cols = (M[0] as unknown[]).length;
  return (M as unknown[][]).every(fila =>
    Array.isArray(fila) && fila.length === cols &&
    fila.every(v => typeof v === 'number' && isFinite(v as number))
  );
}

// ─── Operaciones Básicas ──────────────────────────────────────────────────────

export function matAdd(A: Matrix, B: Matrix): Matrix {
  if (A.length !== B.length || A[0]!.length !== B[0]!.length)
    throw new Error('Las dimensiones de las matrices deben coincidir para la suma.');
  return A.map((fila, i) => fila.map((val, j) => val + B[i]![j]!));
}

export function matSub(A: Matrix, B: Matrix): Matrix {
  if (A.length !== B.length || A[0]!.length !== B[0]!.length)
    throw new Error('Las dimensiones de las matrices deben coincidir para la resta.');
  return A.map((fila, i) => fila.map((val, j) => val - B[i]![j]!));
}

export function matMul(A: Matrix, B: Matrix): Matrix {
  const filasA = A.length, colsA = A[0]!.length;
  const filasB = B.length, colsB = B[0]!.length;
  if (colsA !== filasB)
    throw new Error(`No se puede multiplicar: ${filasA}×${colsA} por ${filasB}×${colsB}.`);

  return Array.from({ length: filasA }, (_, i) =>
    Array.from({ length: colsB }, (_, j) =>
      A[i]!.reduce((suma, _, k) => suma + A[i]![k]! * B[k]![j]!, 0)
    )
  );
}

export function matScale(k: number, A: Matrix): Matrix {
  return A.map(fila => fila.map(v => k * v));
}

export function matTranspose(A: Matrix): Matrix {
  return A[0]!.map((_, j) => A.map(fila => fila[j]!));
}

// ─── Determinante ────────────────────────────────────────────────────────────

export function matDet(M: Matrix): number {
  const n = M.length;
  if (M.some(fila => fila.length !== n))
    throw new Error('El determinante requiere una matriz cuadrada.');

  const mat = M.map(fila => [...fila]);
  let det = 1;
  let signo = 1;

  for (let col = 0; col < n; col++) {
    let filaPivote = -1;
    for (let fila = col; fila < n; fila++) {
      if (Math.abs(mat[fila]![col]!) > 1e-12) { filaPivote = fila; break; }
    }
    if (filaPivote === -1) return 0;

    if (filaPivote !== col) {
      [mat[col], mat[filaPivote]] = [mat[filaPivote]!, mat[col]!];
      signo *= -1;
    }

    det *= mat[col]![col]!;

    for (let fila = col + 1; fila < n; fila++) {
      const factor = mat[fila]![col]! / mat[col]![col]!;
      for (let k = col; k < n; k++) {
        mat[fila]![k]! -= factor * mat[col]![k]!;
      }
    }
  }

  return signo * det;
}

// ─── Inversa ─────────────────────────────────────────────────────────────────

export function matInverse(M: Matrix): Matrix {
  const n = M.length;
  if (M.some(fila => fila.length !== n))
    throw new Error('La inversa requiere una matriz cuadrada.');

  const aug: Matrix = M.map((fila, i) => [
    ...fila,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col++) {
    let maxFila = col;
    for (let fila = col + 1; fila < n; fila++) {
      if (Math.abs(aug[fila]![col]!) > Math.abs(aug[maxFila]![col]!)) maxFila = fila;
    }
    [aug[col], aug[maxFila]] = [aug[maxFila]!, aug[col]!];

    const pivote = aug[col]![col]!;
    if (Math.abs(pivote) < 1e-12)
      throw new Error('La matriz es singular y no puede invertirse.');

    for (let k = 0; k < 2 * n; k++) aug[col]![k]! /= pivote;

    for (let fila = 0; fila < n; fila++) {
      if (fila === col) continue;
      const factor = aug[fila]![col]!;
      for (let k = 0; k < 2 * n; k++) {
        aug[fila]![k]! -= factor * aug[col]![k]!;
      }
    }
  }

  return aug.map(fila => fila.slice(n));
}

// ─── Utilidades de Presentación ──────────────────────────────────────────────

export function parseMatrixString(cadena: string): Matrix {
  return cadena.trim().split(';').map(fila =>
    fila.trim().split(',').map(v => {
      const n = parseFloat(v.trim());
      if (isNaN(n)) throw new Error(`Valor de matriz inválido: "${v}"`);
      return n;
    })
  );
}

export function formatMatrix(M: Matrix, decimales = 4): string {
  return M.map(fila =>
    '[ ' + fila.map(v => Number(v.toFixed(decimales)).toString().padStart(10)).join('  ') + ' ]'
  ).join('\n');
}
