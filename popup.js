// popup.js
// Envia comandos de discagem/encerramento para o service worker

const phoneInput = document.querySelector('.input');
const callBtn = document.getElementById('callBtn');
const hangupBtn = document.getElementById('hangupBtn');

callBtn.addEventListener('click', async () => {
  const number = (phoneInput.value || '').trim();
  if (!number) {
    alert('Por favor, insira um número de telefone.');
    return;
  }
  try {
    await chrome.runtime.sendMessage({ type: 'dial', phoneNumber: number });
  } catch (e) {
    console.error('Falha ao enviar comando de discagem:', e);
  }
});

hangupBtn.addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({ type: 'hangup' });
  } catch (e) {
    console.error('Falha ao enviar comando de desligar:', e);
  }
});