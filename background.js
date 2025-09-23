// background.js
function connect() {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        console.log('Conectado ao servidor WebSocket!');
    };

    ws.onmessage = (event) => {
        console.log('Mensagem recebida do servidor:', event.data);
    };

    ws.onclose = () => {
        console.log('Desconectado do servidor. Tentando reconectar em 5 segundos...');
        setTimeout(connect, 5000); // Tenta reconectar após 5s
    };

    ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        ws.close(); // Isso vai acionar o onclose para tentar reconectar
    };
}

connect();