// Global stylesheets are side-effect imports only; CSS Modules (*.module.css)
// are already typed by Next.js (next/types/global.d.ts).
declare module '*.css' {
  const content: Record<string, never>;
  export default content;
}
