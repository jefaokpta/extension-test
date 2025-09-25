// Load JsSIP UMD build and use the global it registers (self.JsSIP) in MV3 service worker modules.
import './libs/jssip.min.js';
const JsSIP = self.JsSIP || globalThis.JsSIP;

import { credentials } from './libs/credentials.js';

let ua;           // JsSIP.UA
let session = null; // JsSIP.RTCSession atual

function startWebphone(){
    if (!JsSIP || !JsSIP.WebSocketInterface) {
        console.error('JsSIP not loaded or WebSocketInterface not available');
        return;
    }
    const socket = new JsSIP.WebSocketInterface(`wss://${credentials.domain}:${credentials.port}/ws`);
    const configuration = {
        sockets: [socket],
        uri: `sip:${credentials.username}@${credentials.domain}`,
        password: credentials.password,
        register: false,
    };
    ua = new JsSIP.UA(configuration);

    // Eventos do UAw
    ua.on('connected', () => log('Socket conectado (WSS).'));
    ua.on('disconnected', () => log('Socket desconectado.'));
    ua.on('registered', () => log('Registrado no servidor SIP.'));
    ua.on('unregistered', () => log('Não registrado.'));
    ua.on('registrationFailed', (e) => log('Falha no registro: ' + (e.cause || 'desconhecida')));

    // Apenas para depuração simples:
    ua.on('newRTCSession', (ev) => {
        session = ev.session;
        console.log('[PHONE] Nova Sessao ', ev.originator)
        if (ev.originator === 'remote') {
            log('Chamada recebida (ignorada neste MVP).');
        } else {
            attachAudioToSession(ev.session)
        }
    });
    ua.start();
}

startWebphone();

function dial(phoneNumber) {
    log('Chamando ' + phoneNumber);
    const sipCall = 'sip:' + phoneNumber + '@' + credentials.domain;
    const options = {
        mediaConstraints: {audio: true, video: false},
        // extraHeaders: ['X-CALL-TOKEN: ' + callToken]
    };
    ua.call(sipCall, options);
}

function hangup() {
    if (!session) {
        log('Nenhuma sessão ativa para finalizar chamada.');
        return;
    }
    session.terminate();
}

function attachAudioToSession(session) {
    session.connection.addEventListener('addstream', (ev) => {
        console.log('SIP: ' + new Date().toLocaleString('pt-BR') + ' remote audio stream adicionado');
        const audio = new Audio();
        audio.srcObject = ev.stream;
        audio.play();
    })
}

chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
        case 'dial':
            dial(message.phoneNumber);
            break;
        case 'hangup':
            hangup();
            break;
        default:
            console.warn('Mensagem desconhecida:', message);
            break;
    }
});

function log(msg) {
    console.log('[PHONE]', msg);
}

