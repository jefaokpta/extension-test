
let ua;           // JsSIP.UA
let session = null; // JsSIP.RTCSession atual
const statusEl = document.getElementById('status');
const BACKEND_URL = credentials.pabxUrl

async function startWebphone() {
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

    // Eventos do UA
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

document.addEventListener("DOMContentLoaded", checkPermissions);

async function checkPermissions() {
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) {
        chrome.tabs.create({ url: "permission.html" });
        return;
    }
    startWebphone();
}

async function checkMicrophonePermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
    } catch (error) {
        return false;
    }
}

async function dial(phoneNumber) {
    const callToken = await getCallToken(credentials.token)
    const sipCall = 'sip:' + phoneNumber + '@' + credentials.domain;
    log(`Chamando ${sipCall}`);
    const options = {
        mediaConstraints: {audio: true, video: false},
        extraHeaders: ['X-CALL-TOKEN: ' + callToken]
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

// chrome.runtime.onMessage.addListener((message) => {
//     switch (message.type) {
//         case 'dial':
//             dial(message.phoneNumber);
//             break;
//         case 'hangup':
//             hangup();
//             break;
//         default:
//             console.warn('Mensagem desconhecida:', message);
//             break;
//     }
// });

function log(msg) {
    console.log('[PHONE]', msg);
    statusEl.textContent = String(msg);
}

async function getCallToken(token) {
    try{
        const response = await fetch(`${BACKEND_URL}/auth/call-token`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Erro ao obter o token:', error.message);
    }

}

