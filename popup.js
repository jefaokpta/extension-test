// popup.js
// Atualiza o input "Telefone" com mensagens recebidas do background (WebSocket)

const phoneInput = document.querySelector('.input');
const callBtn = document.querySelector('.button');

callBtn.addEventListener('click', (e) => {
    if (!phoneInput.value) {
        alert('Por favor, insira um número de telefone.');
        return;
    }
    chrome.runtime.sendMessage({ type: 'dial', phoneNumber: phoneInput.value });
})

// function getAudioPermission() {
//     navigator.mediaDevices.getUserMedia({ audio: true })
//         .then(() => {
//             console.log('Permissão de áudio concedida.');
//         })
//         .catch((error) => {
//             console.error('Erro ao obter permissão de áudio:', error);
//         });
// }