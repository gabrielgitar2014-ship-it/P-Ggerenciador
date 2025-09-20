// Localização: public/service-worker.js

/**
 * Listener para o evento 'push'. É acionado quando uma notificação chega.
 */
self.addEventListener('push', function(event) {
  // Extrai os dados enviados pela Edge Function (o payload estruturado)
  const data = event.data.json();

  // --- Lógica para formatar a notificação ---

  // Formata o valor como moeda brasileira (BRL) para melhor visualização
  const valorFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(data.valor);

  // Formata a data para o padrão brasileiro (dd/mm/aaaa)
  const dataFormatada = new Date(data.data_compra).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Monta o título e o corpo da notificação usando os dados formatados
  const title = `Nova Despesa: ${data.descricao}`;

  // O caractere '\n' cria uma quebra de linha no corpo da notificação
  const body = `Valor: ${valorFormatado}\n` +
               `Data: ${dataFormatada}\n` +
               `Pagamento: ${data.metodo_pagamento}`;

  // Opções da notificação (ícone, etc.)
  const options = {
    body: body,
    icon: '/icons/icon-192x192.png', // Caminho para o ícone do seu app na pasta 'public'
    badge: '/icons/badge-72x72.png'  // Ícone menor para a barra de status (opcional)
  };

  // Pede ao navegador para exibir a notificação.
  // event.waitUntil garante que o service worker não seja encerrado antes da notificação ser exibida.
  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Listener para o evento 'notificationclick'. É acionado quando o usuário clica na notificação.
 */
self.addEventListener('notificationclick', function(event) {
  // Fecha a notificação
  event.notification.close();

  // Procura por uma janela/aba aberta do seu app e a foca.
  // Se não encontrar, abre uma nova aba na página inicial.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      const hadWindowToFocus = clientsArr.length > 0;
      if (hadWindowToFocus) {
        clientsArr[0].focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});
