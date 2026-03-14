// src/vite-env.d.ts  (o src/declarations.d.ts si ya existe vite-env.d.ts)
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}