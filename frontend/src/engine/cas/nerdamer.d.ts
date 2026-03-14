declare module 'nerdamer/all' {
  interface NerdamerStatic {
    simplify(expr: string): { toString(): string };
    diff(expr: string, variable: string): { toString(): string };
    integrate(expr: string, variable: string): { toString(): string };
    solve(equation: string, variable: string): { toString(): string };
    expand(expr: string): { toString(): string };
    factor(expr: string): { toString(): string };
  }
  const nerdamer: NerdamerStatic;
  export default nerdamer;
}