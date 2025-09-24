// Load JsSIP UMD build and use the global it registers (self.JsSIP) in MV3 service worker modules.
import './libs/jssip.min.js';
const JsSIP = self.JsSIP || globalThis.JsSIP;

import { credentials } from './libs/credentials.js';

function startWebphone(){
    if (!JsSIP || !JsSIP.WebSocketInterface) {
        console.error('JsSIP not loaded or WebSocketInterface not available');
        return;
    }

    const socket = new JsSIP.WebSocketInterface(`wss://${credentials.domain}:${credentials.port}/ws`);
    const configuration = {
        sockets: [socket],
        uri: `sip:${credentials.username}@${credentials.domain}`,
        password: credentials.password
    };

    const ua = new JsSIP.UA(configuration);
    ua.start();

    ua.on('connected', () => {
        console.log('[PHONE] Connected to IASMIN PABX');
    })
}

startWebphone();