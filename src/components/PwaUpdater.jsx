// src/components/PwaUpdater.jsx

import { useEffect } from 'react';
// Este é um módulo especial fornecido pelo vite-plugin-pwa para gerir o Service Worker
import { useRegisterSW } from 'virtual:pwa-register/react';

// Intervalo para verificar por atualizações (em milissegundos)
// 40 segundos = 40000 ms
const CHECK_INTERVAL = 40 * 1000;

function PwaUpdater() {
  const {
    // needRefresh: um booleano que se torna 'true' quando uma nova versão está pronta
    needRefresh: [needRefresh],
    // updateServiceWorker: a função para instalar a nova versão
    updateServiceWorker,
  } = useRegisterSW({
    // Esta função é chamada automaticamente quando uma nova versão é detetada
    onRegisteredSW(swUrl, r) {
      console.log(`[PWA Updater] Service Worker registado: ${swUrl}`);
      // Inicia a verificação periódica por atualizações
      setInterval(() => {
        console.log('[PWA Updater] A verificar por atualizações...');
        r.update();
      }, CHECK_INTERVAL);
    },
    onRegisterError(error) {
      console.error('[PWA Updater] Erro no registo do Service Worker:', error);
    },
  });

  useEffect(() => {
    // Este efeito corre sempre que o estado 'needRefresh' muda
    if (needRefresh) {
      console.log('[PWA Updater] Nova versão detetada. A atualizar silenciosamente...');
      // Instala a nova versão, o que irá forçar um recarregamento da página
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  // Este componente não renderiza nada na tela, ele apenas contém a lógica
  return null;
}

export default PwaUpdater;
