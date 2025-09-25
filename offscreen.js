// offscreen.js - Persistent hidden page hosting JsSIP UA and remote audio

// JsSIP and credentials are loaded globally via script tags in offscreen.html
const JsSIP = self.JsSIP || globalThis.JsSIP;
const BACKEND_URL = credentials.pabxUrl;

let ua = null;           // JsSIP.UA
let session = null;      // Current JsSIP.RTCSession
let ready = false;       // UA ready flag

function log(...args) {
  console.log('[OFFSCREEN PHONE]', ...args);
}

async function ensureMicPermission() {
  try {
    // Try to get microphone permission silently (will succeed if granted before)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch (e) {
    log('Microphone permission missing. Opening permission tab...');
    try {
      await chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') });
    } catch (_) {}
    return false;
  }
}

function startUA() {
  if (ready) return;
  if (!JsSIP || !JsSIP.WebSocketInterface) {
    console.error('JsSIP not loaded or WebSocketInterface not available');
    return;
  }
  const socket = new JsSIP.WebSocketInterface(`wss://${credentials.domain}:${credentials.port}/ws`);
  const configuration = {
    sockets: [socket],
    uri: `sip:${credentials.username}@${credentials.domain}`,
    password: credentials.password,
    register: true,
  };
  ua = new JsSIP.UA(configuration);

  ua.on('connected', () => log('Socket conectado (WSS).'));
  ua.on('disconnected', () => log('Socket desconectado.'));
  ua.on('registered', () => log('Registrado no servidor SIP.'));
  ua.on('unregistered', () => log('Não registrado.'));
  ua.on('registrationFailed', (e) => log('Falha no registro: ' + (e?.cause || 'desconhecida')));

  ua.on('newRTCSession', (ev) => {
    session = ev.session;
    log('Nova sessão', ev.originator);

    // Attach remote audio for both outgoing and incoming
    tryAttachAudio(session);

    session.on('ended', () => {
      log('Sessão finalizada.');
      session = null;
    });
    session.on('failed', (e) => {
      log('Sessão falhou:', e?.cause);
      session = null;
    });
    session.on('accepted', () => log('Sessão aceita.'));
    session.on('confirmed', () => log('Sessão confirmada.'));
  });

  ua.start();
  ready = true;
}

function tryAttachAudio(sess) {
  const audioEl = document.getElementById('remoteAudio');
  if (!audioEl) return;
  // In newer browsers, 'track' is used; JsSIP still fires 'addstream' for compat
  const conn = sess.connection;
  if (!conn) return;

  const attach = (stream) => {
    log('Anexando stream remoto ao <audio>');
    try {
      audioEl.srcObject = stream;
      // Ensure autoplay without user gesture in extension context
      audioEl.muted = false;
      audioEl.play().catch(err => log('Falha ao reproduzir áudio remoto:', err?.message || err));
    } catch (e) {
      log('Erro ao anexar áudio:', e);
    }
  };

  // Legacy event
  conn.addEventListener('addstream', (ev) => {
    log('Evento addstream');
    attach(ev.stream);
  });
  // Modern event
  conn.addEventListener('track', (ev) => {
    if (ev.streams && ev.streams[0]) {
      log('Evento track');
      attach(ev.streams[0]);
    }
  });
}

async function getCallToken(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/call-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Erro ao obter o token:', error?.message || error);
    return undefined;
  }
}

async function dial(phoneNumber) {
  // Ensure UA exists
  startUA();

  const hasMic = await ensureMicPermission();
  if (!hasMic) {
    log('Sem permissão de microfone. Interrompendo discagem.');
    return;
  }

  const callToken = await getCallToken(credentials.token);
  const sipCall = `sip:${phoneNumber}@${credentials.domain}`;
  log(`Chamando ${sipCall}`);
  const options = {
    mediaConstraints: { audio: true, video: false },
    extraHeaders: callToken ? [ 'X-CALL-TOKEN: ' + callToken ] : []
  };
  try {
    ua.call(sipCall, options);
  } catch (e) {
    log('Erro ao iniciar chamada:', e?.message || e);
  }
}

function hangup() {
  if (!session) {
    log('Nenhuma sessão ativa para finalizar chamada.');
    return;
  }
  try {
    session.terminate();
  } catch (e) {
    log('Erro ao finalizar chamada:', e?.message || e);
  }
}

function answer(){
    if (!session) {
        log('Nenhuma sessão ativa para atender chamada.');
        return;
    }
    try {
        session.answer();
    } catch (e) {
        log('Erro ao atender chamada:', e?.message || e);
    }
}

// Message handling from service worker or popup
chrome.runtime.onMessage.addListener((message) => {
  switch (message?.type) {
    case 'dial':
      if (message.phoneNumber) dial(String(message.phoneNumber));
      break;
    case 'hangup':
      hangup();
      break;
    case 'answer':
      answer();
      break;
    default:
      // ignore
      break;
  }
});

// Initialize UA early so socket connects in background
startUA();
