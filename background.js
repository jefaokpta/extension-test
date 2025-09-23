// background.js
let latestMessage = '';

function connect() {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        console.log('Conectado ao servidor WebSocket!');
    };

    ws.onmessage = (event) => {
        console.log('Mensagem recebida do servidor:', event.data);
        latestMessage = String(event.data ?? '');
        // Envia para qualquer parte da extensão ouvindo (ex.: popup)
        try {
            chrome.runtime.sendMessage({ type: 'ws_message', payload: latestMessage });
        } catch (e) {
            // Ignora erros se não houver listeners
        }
    };

    ws.onclose = () => {
        console.log('Desconectado do servidor. Tentando reconectar em 5 segundos...');
        setTimeout(connect, 5000); // Tenta reconectar após 5s
    };

    ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        // Fechamos para acionar onclose e reconectar
        try { ws.close(); } catch (_) {}
    };
}

// Responde a pedidos do popup para obter a última mensagem
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === 'get_latest_message') {
        sendResponse({ data: latestMessage });
        return true;
    }
    return false;
});

connect();