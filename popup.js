// popup.js
// Atualiza o input "Telefone" com mensagens recebidas do background (WebSocket)

document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('.input');
  if (!input) return;

  // Preenche com a última mensagem disponível ao abrir o popup
  try {
    chrome.runtime.sendMessage({ type: 'get_latest_message' }, (response) => {
      if (chrome.runtime.lastError) {
        // Sem problema se o service worker não estiver disponível
        return;
      }
      if (response && response.data != null) {
        input.value = String(response.data);
      }
    });
  } catch (_) {}

  // Atualiza em tempo real quando novas mensagens chegarem
  try {
    chrome.runtime.onMessage.addListener((message) => {
      if (message && message.type === 'ws_message') {
        input.value = String(message.payload ?? '');
      }
    });
  } catch (_) {}
});
