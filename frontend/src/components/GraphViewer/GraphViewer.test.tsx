import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GraphViewer } from './GraphViewer';

// canvas no existe en jsdom — mock mínimo
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    font: '',
  });
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,abc123');
});

describe('GraphViewer', () => {
  it('renderiza el contenedor con data-testid="graph-viewer"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-viewer')).toBeInTheDocument();
  });

  it('renderiza un input de texto para la función con data-testid="graph-fn-input-0"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-fn-input-0')).toBeInTheDocument();
  });

  it('renderiza el botón Graficar con data-testid="graph-plot-button"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-plot-button')).toBeInTheDocument();
  });

  it('renderiza el botón Limpiar con data-testid="graph-clear-button"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-clear-button')).toBeInTheDocument();
  });

  it('renderiza botones de zoom: zoom-in, zoom-out, zoom-reset', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-zoom-in')).toBeInTheDocument();
    expect(screen.getByTestId('graph-zoom-out')).toBeInTheDocument();
    expect(screen.getByTestId('graph-zoom-reset')).toBeInTheDocument();
  });

  it('renderiza el canvas con data-testid="graph-canvas"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();
  });

  it('el input acepta texto', () => {
    render(<GraphViewer />);
    const input = screen.getByTestId('graph-fn-input-0') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'x^2' } });
    expect(input.value).toBe('x^2');
  });

  it('el botón Limpiar vacía el input', () => {
    render(<GraphViewer />);
    const input = screen.getByTestId('graph-fn-input-0') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'sin(x)' } });
    fireEvent.click(screen.getByTestId('graph-clear-button'));
    expect(input.value).toBe('');
  });
});

describe('GraphViewer — múltiples funciones', () => {
  it('renderiza botón para agregar función con data-testid="graph-add-fn"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-add-fn')).toBeInTheDocument();
  });

  it('al agregar función aparece un segundo input', () => {
    render(<GraphViewer />);
    fireEvent.click(screen.getByTestId('graph-add-fn'));
    const inputs = screen.getAllByTestId(/^graph-fn-input-/);
    expect(inputs.length).toBe(2);
  });

  it('no permite agregar más de 6 funciones', () => {
    render(<GraphViewer />);
    for (let i = 0; i < 6; i++) {
      const btn = screen.queryByTestId('graph-add-fn');
      if (btn) fireEvent.click(btn);
    }
    expect(screen.queryByTestId('graph-add-fn')).not.toBeInTheDocument();
  });

  it('botón eliminar función tiene data-testid="graph-remove-fn-{i}"', () => {
    render(<GraphViewer />);
    fireEvent.click(screen.getByTestId('graph-add-fn'));
    expect(screen.getByTestId('graph-remove-fn-1')).toBeInTheDocument();
  });

  it('eliminar función reduce el número de inputs', () => {
    render(<GraphViewer />);
    fireEvent.click(screen.getByTestId('graph-add-fn'));
    fireEvent.click(screen.getByTestId('graph-remove-fn-1'));
    const inputs = screen.getAllByTestId(/^graph-fn-input-/);
    expect(inputs.length).toBe(1);
  });
});

describe('GraphViewer — inputs de rango', () => {
  it('renderiza input xMin con data-testid="graph-xmin"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-xmin')).toBeInTheDocument();
  });

  it('renderiza input xMax con data-testid="graph-xmax"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-xmax')).toBeInTheDocument();
  });

  it('renderiza input yMin con data-testid="graph-ymin"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-ymin')).toBeInTheDocument();
  });

  it('renderiza input yMax con data-testid="graph-ymax"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-ymax')).toBeInTheDocument();
  });

  it('valor por defecto de xMin es -10', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-xmin')).toHaveValue(-10);
  });

  it('valor por defecto de xMax es 10', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-xmax')).toHaveValue(10);
  });

  it('cambiar xMin actualiza el input', () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-xmin'), { target: { value: '-5' } });
    expect(screen.getByTestId('graph-xmin')).toHaveValue(-5);
  });

  it('cambiar xMax actualiza el input', () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-xmax'), { target: { value: '5' } });
    expect(screen.getByTestId('graph-xmax')).toHaveValue(5);
  });
});

describe('GraphViewer — zoom con rueda del mouse', () => {
  it('el canvas tiene data-testid="graph-canvas"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();
  });

  it('wheel deltaY negativo hace zoom in — xMin sube, xMax baja', async () => {
    render(<GraphViewer />);
    const canvas = screen.getByTestId('graph-canvas');
    const xMinBefore = (screen.getByTestId('graph-xmin') as HTMLInputElement).valueAsNumber;
    const xMaxBefore = (screen.getByTestId('graph-xmax') as HTMLInputElement).valueAsNumber;
    fireEvent.wheel(canvas, { deltaY: -100 });
    await waitFor(() => {
      const xMinAfter = (screen.getByTestId('graph-xmin') as HTMLInputElement).valueAsNumber;
      const xMaxAfter = (screen.getByTestId('graph-xmax') as HTMLInputElement).valueAsNumber;
      expect(xMinAfter).toBeGreaterThan(xMinBefore);
      expect(xMaxAfter).toBeLessThan(xMaxBefore);
    });
  });

  it('wheel deltaY positivo hace zoom out — xMin baja, xMax sube', async () => {
    render(<GraphViewer />);
    const canvas = screen.getByTestId('graph-canvas');
    const xMinBefore = (screen.getByTestId('graph-xmin') as HTMLInputElement).valueAsNumber;
    const xMaxBefore = (screen.getByTestId('graph-xmax') as HTMLInputElement).valueAsNumber;
    fireEvent.wheel(canvas, { deltaY: 100 });
    await waitFor(() => {
      const xMinAfter = (screen.getByTestId('graph-xmin') as HTMLInputElement).valueAsNumber;
      const xMaxAfter = (screen.getByTestId('graph-xmax') as HTMLInputElement).valueAsNumber;
      expect(xMinAfter).toBeLessThan(xMinBefore);
      expect(xMaxAfter).toBeGreaterThan(xMaxBefore);
    });
  });
});

describe('GraphViewer — pan con arrastrar', () => {
  it('mousedown + mousemove desplaza la vista — xMin cambia', async () => {
    render(<GraphViewer />);
    const canvas = screen.getByTestId('graph-canvas');
    const xMinBefore = (screen.getByTestId('graph-xmin') as HTMLInputElement).valueAsNumber;
    fireEvent.mouseDown(canvas, { clientX: 200, clientY: 150 });
    fireEvent.mouseMove(canvas, { clientX: 250, clientY: 150 });
    fireEvent.mouseUp(canvas);
    await waitFor(() => {
      const xMinAfter = (screen.getByTestId('graph-xmin') as HTMLInputElement).valueAsNumber;
      expect(xMinAfter).not.toBe(xMinBefore);
    });
  });

  it('mouseup detiene el pan — mousemove posterior no cambia la vista', async () => {
    render(<GraphViewer />);
    const canvas = screen.getByTestId('graph-canvas');
    fireEvent.mouseDown(canvas, { clientX: 200, clientY: 150 });
    fireEvent.mouseUp(canvas);
    const xMinAfterUp = (screen.getByTestId('graph-xmin') as HTMLInputElement).valueAsNumber;
    fireEvent.mouseMove(canvas, { clientX: 300, clientY: 150 });
    await waitFor(() => {
      const xMinAfterMove = (screen.getByTestId('graph-xmin') as HTMLInputElement).valueAsNumber;
      expect(xMinAfterMove).toBe(xMinAfterUp);
    });
  });
});

describe('GraphViewer — tooltip', () => {
  it('renderiza el tooltip con data-testid="graph-tooltip"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-tooltip')).toBeInTheDocument();
  });

  it('el tooltip está oculto por defecto (no visible)', () => {
    render(<GraphViewer />);
    const tooltip = screen.getByTestId('graph-tooltip');
    expect(tooltip).not.toBeVisible();
  });

  it('mousemove sobre el canvas hace el tooltip visible', async () => {
    render(<GraphViewer />);
    const canvas = screen.getByTestId('graph-canvas');
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 150 });
    await waitFor(() => {
      expect(screen.getByTestId('graph-tooltip')).toBeVisible();
    });
  });

  it('mouseleave sobre el canvas oculta el tooltip', async () => {
    render(<GraphViewer />);
    const canvas = screen.getByTestId('graph-canvas');
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 150 });
    fireEvent.mouseLeave(canvas);
    await waitFor(() => {
      expect(screen.getByTestId('graph-tooltip')).not.toBeVisible();
    });
  });
});

describe('GraphViewer — exportación PNG y reset', () => {
  it('renderiza botón de exportación con data-testid="graph-export-button"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-export-button')).toBeInTheDocument();
  });

  it('click en export llama a canvas.toDataURL', () => {
    render(<GraphViewer />);
    fireEvent.click(screen.getByTestId('graph-export-button'));
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalled();
  });

  it('doble click en canvas resetea zoom a DEFAULT — xMin vuelve a -10', async () => {
    render(<GraphViewer />);
    const canvas = screen.getByTestId('graph-canvas');
    fireEvent.wheel(canvas, { deltaY: -100 });
    await waitFor(() => {
      const xMin = (screen.getByTestId('graph-xmin') as HTMLInputElement).valueAsNumber;
      expect(xMin).not.toBe(-10);
    });
    fireEvent.dblClick(canvas);
    await waitFor(() => {
      const xMin = (screen.getByTestId('graph-xmin') as HTMLInputElement).valueAsNumber;
      expect(xMin).toBe(-10);
    });
  });
});

describe('GraphViewer — selector de modo', () => {
  it('renderiza selector de modo con data-testid="graph-mode-select"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-mode-select')).toBeInTheDocument();
  });

  it('modo por defecto es "cartesian"', () => {
    render(<GraphViewer />);
    const sel = screen.getByTestId('graph-mode-select') as HTMLSelectElement;
    expect(sel.value).toBe('cartesian');
  });

  it('cambiar a modo paramétrico muestra input x(t)', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'parametric' } });
    await waitFor(() => {
      expect(screen.getByTestId('graph-param-x-0')).toBeInTheDocument();
    });
  });

  it('cambiar a modo paramétrico muestra input y(t)', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'parametric' } });
    await waitFor(() => {
      expect(screen.getByTestId('graph-param-y-0')).toBeInTheDocument();
    });
  });

  it('modo paramétrico oculta graph-fn-input-0', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'parametric' } });
    await waitFor(() => {
      expect(screen.queryByTestId('graph-fn-input-0')).not.toBeInTheDocument();
    });
  });

  it('cambiar a modo polar muestra input r(θ)', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'polar' } });
    await waitFor(() => {
      expect(screen.getByTestId('graph-polar-r-0')).toBeInTheDocument();
    });
  });

  it('modo polar oculta graph-fn-input-0', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'polar' } });
    await waitFor(() => {
      expect(screen.queryByTestId('graph-fn-input-0')).not.toBeInTheDocument();
    });
  });
});

describe('GraphViewer — modo paramétrico', () => {
  it('modo paramétrico muestra inputs tMin y tMax', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'parametric' } });
    await waitFor(() => {
      expect(screen.getByTestId('graph-tmin')).toBeInTheDocument();
      expect(screen.getByTestId('graph-tmax')).toBeInTheDocument();
    });
  });

  it('tMin por defecto es 0', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'parametric' } });
    await waitFor(() => {
      expect(screen.getByTestId('graph-tmin')).toHaveValue(0);
    });
  });

  it('tMax por defecto es 6.283 (2π aprox)', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'parametric' } });
    await waitFor(() => {
      const tmax = screen.getByTestId('graph-tmax') as HTMLInputElement;
      expect(Number(tmax.value)).toBeCloseTo(2 * Math.PI, 2);
    });
  });

  it('acepta texto en input x(t)', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'parametric' } });
    await waitFor(() => screen.getByTestId('graph-param-x-0'));
    const input = screen.getByTestId('graph-param-x-0') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'cos(t)' } });
    expect(input.value).toBe('cos(t)');
  });
});

describe('GraphViewer — toggle derivada', () => {
  it('renderiza toggle de derivada con data-testid="graph-deriv-toggle"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-deriv-toggle')).toBeInTheDocument();
  });

  it('toggle de derivada está desactivado por defecto', () => {
    render(<GraphViewer />);
    const toggle = screen.getByTestId('graph-deriv-toggle') as HTMLInputElement;
    expect(toggle.checked).toBe(false);
  });

  it('click en toggle activa la derivada', () => {
    render(<GraphViewer />);
    const toggle = screen.getByTestId('graph-deriv-toggle') as HTMLInputElement;
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(true);
  });

  it('toggle de derivada no visible en modo paramétrico', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'parametric' } });
    await waitFor(() => {
      expect(screen.queryByTestId('graph-deriv-toggle')).not.toBeInTheDocument();
    });
  });

  it('toggle de derivada no visible en modo polar', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'polar' } });
    await waitFor(() => {
      expect(screen.queryByTestId('graph-deriv-toggle')).not.toBeInTheDocument();
    });
  });
});

// ── NUEVO BLOQUE ────────────────────────────────────────────────────────────
describe('GraphViewer — área bajo la curva', () => {
  it('renderiza toggle de área con data-testid="graph-area-toggle"', () => {
    render(<GraphViewer />);
    expect(screen.getByTestId('graph-area-toggle')).toBeInTheDocument();
  });

  it('toggle de área está desactivado por defecto', () => {
    render(<GraphViewer />);
    const toggle = screen.getByTestId('graph-area-toggle') as HTMLInputElement;
    expect(toggle.checked).toBe(false);
  });

  it('inputs graph-area-a y graph-area-b no visibles cuando toggle está inactivo', () => {
    render(<GraphViewer />);
    expect(screen.queryByTestId('graph-area-a')).not.toBeInTheDocument();
    expect(screen.queryByTestId('graph-area-b')).not.toBeInTheDocument();
  });

  it('inputs graph-area-a y graph-area-b visibles cuando toggle está activo', async () => {
    render(<GraphViewer />);
    fireEvent.click(screen.getByTestId('graph-area-toggle'));
    await waitFor(() => {
      expect(screen.getByTestId('graph-area-a')).toBeInTheDocument();
      expect(screen.getByTestId('graph-area-b')).toBeInTheDocument();
    });
  });

  it('graph-area-a tiene valor por defecto -1', async () => {
    render(<GraphViewer />);
    fireEvent.click(screen.getByTestId('graph-area-toggle'));
    await waitFor(() => {
      expect(screen.getByTestId('graph-area-a')).toHaveValue(-1);
    });
  });

  it('graph-area-b tiene valor por defecto 1', async () => {
    render(<GraphViewer />);
    fireEvent.click(screen.getByTestId('graph-area-toggle'));
    await waitFor(() => {
      expect(screen.getByTestId('graph-area-b')).toHaveValue(1);
    });
  });

  it('graph-area-value no visible cuando toggle está inactivo', () => {
    render(<GraphViewer />);
    expect(screen.queryByTestId('graph-area-value')).not.toBeInTheDocument();
  });

  it('graph-area-value visible cuando toggle está activo', async () => {
    render(<GraphViewer />);
    fireEvent.click(screen.getByTestId('graph-area-toggle'));
    await waitFor(() => {
      expect(screen.getByTestId('graph-area-value')).toBeInTheDocument();
    });
  });

  it('toggle de área no visible en modo paramétrico', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'parametric' } });
    await waitFor(() => {
      expect(screen.queryByTestId('graph-area-toggle')).not.toBeInTheDocument();
    });
  });

  it('toggle de área no visible en modo polar', async () => {
    render(<GraphViewer />);
    fireEvent.change(screen.getByTestId('graph-mode-select'), { target: { value: 'polar' } });
    await waitFor(() => {
      expect(screen.queryByTestId('graph-area-toggle')).not.toBeInTheDocument();
    });
  });

  it('acepta cambio de valor en graph-area-a', async () => {
    render(<GraphViewer />);
    fireEvent.click(screen.getByTestId('graph-area-toggle'));
    await waitFor(() => screen.getByTestId('graph-area-a'));
    fireEvent.change(screen.getByTestId('graph-area-a'), { target: { value: '-2' } });
    expect((screen.getByTestId('graph-area-a') as HTMLInputElement).value).toBe('-2');
  });

  it('acepta cambio de valor en graph-area-b', async () => {
    render(<GraphViewer />);
    fireEvent.click(screen.getByTestId('graph-area-toggle'));
    await waitFor(() => screen.getByTestId('graph-area-b'));
    fireEvent.change(screen.getByTestId('graph-area-b'), { target: { value: '3' } });
    expect((screen.getByTestId('graph-area-b') as HTMLInputElement).value).toBe('3');
  });
});