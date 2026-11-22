// Botão "Instalar no celular" (Chrome no Android).
import { useSyncExternalStore } from 'react';
import { ehStandalone } from './util.js';

let pedido = null;
const ouvintes = new Set();
const avisar = () => ouvintes.forEach((f) => f());

window.addEventListener('beforeinstallprompt', (ev) => {
  ev.preventDefault();
  pedido = ev;
  avisar();
});
window.addEventListener('appinstalled', () => { pedido = null; avisar(); });

export function useInstalacao() {
  const p = useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => pedido);
  return {
    podeInstalar: !!p && !ehStandalone(),
    instalar: async () => {
      if (!pedido) return;
      pedido.prompt();
      await pedido.userChoice;
      pedido = null;
      avisar();
    },
  };
}
