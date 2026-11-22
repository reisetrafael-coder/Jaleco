import { createRoot } from 'react-dom/client';
import '@fontsource/figtree/latin-400.css';
import '@fontsource/figtree/latin-600.css';
import '@fontsource/figtree/latin-800.css';
import '@fontsource/kalam/latin-400.css';
import './estilo.css';
import './instalar.js';
import { App } from './App.jsx';
import { baixar } from './estado.js';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

baixar();
createRoot(document.getElementById('app')).render(<App />);
