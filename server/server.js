// servidor.js
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

console.log('Servidor WebSocket iniciado na porta 8080.');

wss.on('connection', function connection(ws) {
    console.log('Um cliente se conectou!');

    // Envia uma mensagem a cada 5 segundos
    const interval = setInterval(() => {
        const message = `Mensagem do servidor: ${new Date().toLocaleTimeString()}`;
        console.log(`Enviando: "${message}"`);
        ws.send(message);
    }, 5000);

    ws.on('close', () => {
        console.log('O cliente se desconectou.');
        clearInterval(interval); // Para o envio de mensagens
    });
});