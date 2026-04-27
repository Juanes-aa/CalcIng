<div align="center">

# CalcIng

**Calculadora de ingeniería con CAS simbólico, motor pedagógico y graficador interactivo.**

Diseñada para estudiantes e ingenieros hispanohablantes que necesitan algo más que respuestas: explicaciones paso a paso, en su idioma y sin pagar.

[![Tests](https://img.shields.io/badge/tests-849%20passing-brightgreen?style=flat-square)](https://github.com/Juanes-aa/CalcIng)
[![Cost](https://img.shields.io/badge/infra-%240%2Fmes-22c55e?style=flat-square)](https://github.com/Juanes-aa/CalcIng)

[**CalcIng → calc-ing.vercel.app**](https://calc-ing.vercel.app/)

</div>

---

## Qué hace

CalcIng resuelve expresiones matemáticas y **explica cada paso** con el nivel de detalle que el usuario necesita — desde secundaria hasta posgrado. A diferencia de Wolfram Alpha (pasos bloqueados tras paywall) o Symbolab (publicidad agresiva), CalcIng ofrece pasos gratuitos con interfaz en español nativo.

**Operaciones disponibles:** simplificar · derivar · integrar · resolver ecuaciones · expandir · factorizar

**Graficador 2D:** funciones cartesianas, paramétricas y polares — hasta 6 superpuestas, con zoom, pan y exportación PNG.

**Panel avanzado:** estadística descriptiva, números complejos, matrices, conversiones de unidades y cambio de bases numéricas.

**PWA:** instalable en Android e iOS, funciona offline para operaciones básicas.

---

## Cómo funciona

Las operaciones simples se resuelven directamente en el navegador con `nerdamer.js` (< 10ms, sin red). Las operaciones avanzadas van al backend en Python con `SymPy`, que devuelve el resultado completo con pasos pedagógicos en 200–800ms. Los resultados frecuentes se cachean en Redis, reduciendo el tiempo de respuesta 4× en hits.

Los pasos se presentan en tres niveles: `beginner` con analogías y lenguaje simple, `intermediate` con justificación matemática directa, y `advanced` con notación precisa y referencias al teorema.

---

## Stack

**Frontend** — React 18, TypeScript strict, Vite, Vitest, nerdamer.js, KaTeX, TailwindCSS  
**Backend** — FastAPI, Python 3.13, SymPy 1.14, SQLAlchemy async, JWT RS256, bcrypt  
**Infra** — Vercel + Render.com + Supabase + Upstash Redis + GitHub Actions CI/CD

Infraestructura 100% gratuita hasta que los ingresos lo justifiquen.

---

## Correr localmente

```bash
# Frontend
npm install
npm run dev      # http://localhost:5173

# Backend
pip install -r requirements.txt
uvicorn main:app --reload    # http://localhost:8000
```

Copiar `.env.example` a `.env` en cada directorio y completar las variables antes de correr.

---

<div align="center">

Desarrollado por **[Juanes](https://github.com/Juanes-aa)** — SENA, Tecnología en Desarrollo de Software · Colombia

</div>
