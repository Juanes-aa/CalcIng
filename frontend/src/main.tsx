import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';  // ← agregar esta línea
import App from './App';
import { applyTheme, loadSettings } from './engine/ajustes';

applyTheme(loadSettings().theme);

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el elemento #root en el DOM.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);