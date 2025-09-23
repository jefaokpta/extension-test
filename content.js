// Conteúdo da extensão: destaca números de telefone na página
// Estratégia:
// - Percorre nós de texto do DOM e envolve sequências que parecem telefones com <span class="phone-highlight">.
// - Observa mudanças no DOM para destacar conteúdos carregados dinamicamente.

(function () {
  const EXCLUDED_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CODE', 'PRE'
  ]);

  // Combina formatos comuns (BR e internacionais):
  // - 0800-123-4567
  // - +55 11 91234-5678
  // - (11) 91234-5678
  // - 11 91234 5678, 112345-6789, 1234-5678, etc.
  const PHONE_PATTERN =
    '(?:0800[\\s.-]?\\d{3}[\\s.-]?\\d{4}' +
    '|(?:\\+?\\d{1,3}[\\s.-]?)?(?:\\(?\\d{2,3}\\)?[\\s.-]?)?\\d{4,5}[\\s.-]?\\d{4})';
  const PHONE_REGEX = new RegExp(PHONE_PATTERN, 'g');

  // Limites para reduzir falsos positivos
  const MIN_DIGITS = 8;
  const MAX_DIGITS = 15; // suficiente para formatos internacionais comuns

  function isSkippableElement(el) {
    return el && EXCLUDED_TAGS.has(el.tagName);
  }

  function isInsideHighlight(node) {
    let p = node.parentNode;
    while (p && p.nodeType === Node.ELEMENT_NODE) {
      if (p.classList && p.classList.contains('phone-highlight')) return true;
      if (isSkippableElement(p)) return true;
      p = p.parentNode;
    }
    return false;
  }

  function boundaryOK(text, start, end) {
    const before = start > 0 ? text[start - 1] : '';
    const after = end < text.length ? text[end] : '';
    const isAlphaNum = c => /[\p{L}\p{N}]/u.test(c);
    // Evita juntar com letras/dígitos adjacentes
    if (before && isAlphaNum(before)) return false;
    if (after && isAlphaNum(after)) return false;
    return true;
  }

  function looksLikePhone(str) {
    const digits = str.replace(/\D/g, '');
    const n = digits.length;
    if (n < MIN_DIGITS || n > MAX_DIGITS) return false;
    // Evita sequências monotônicas muito simples (ex.: 12345678) — ainda permitimos algumas
    // mas aqui só um filtro leve: não deixa se todos dígitos iguais
    if (/^(\d)\1+$/.test(digits)) return false;
    return true;
  }

  function highlightInTextNode(textNode) {
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
    if (!textNode.nodeValue || !/\d/.test(textNode.nodeValue)) return; // rápido
    if (isInsideHighlight(textNode)) return;

    const text = textNode.nodeValue;
    let match;
    let lastIndex = 0;
    const parts = [];

    PHONE_REGEX.lastIndex = 0;
    while ((match = PHONE_REGEX.exec(text)) !== null) {
      const matchText = match[0];
      const start = match.index;
      const end = start + matchText.length;

      if (!boundaryOK(text, start, end)) continue;
      if (!looksLikePhone(matchText)) continue;

      if (start > lastIndex) {
        parts.push(document.createTextNode(text.slice(lastIndex, start)));
      }

      const span = document.createElement('span');
      span.className = 'phone-highlight';
      span.textContent = matchText;
      span.setAttribute('data-phone-highlight', '1');
      span.title = 'Número de telefone detectado';
      parts.push(span);

      lastIndex = end;
    }

    if (parts.length > 0) {
      if (lastIndex < text.length) {
        parts.push(document.createTextNode(text.slice(lastIndex)));
      }
      const frag = document.createDocumentFragment();
      for (const p of parts) frag.appendChild(p);
      try {
        textNode.replaceWith(frag);
      } catch (_) {
        // Em alguns ambientes, replaceWith pode não existir
        const parent = textNode.parentNode;
        if (!parent) return;
        parent.insertBefore(frag, textNode);
        parent.removeChild(textNode);
      }
    }
  }

  function walkAndHighlight(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      highlightInTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (isSkippableElement(root)) return;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          // Ignora nós vazios e nós dentro de áreas excluídas
          if (!node.nodeValue || !/\d/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
          if (isInsideHighlight(node)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const batch = [];
    let current;
    while ((current = walker.nextNode())) {
      batch.push(current);
      if (batch.length >= 500) break; // segurança em páginas enormes
    }
    for (const n of batch) highlightInTextNode(n);
  }

  function init() {
    const root = document.body || document.documentElement;
    if (!root) return;
    walkAndHighlight(root);

    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes && m.addedNodes.forEach(node => {
            // Evita processar a própria marcação de destaque
            if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('phone-highlight')) {
              return;
            }
            walkAndHighlight(node);
          });
        } else if (m.type === 'characterData' && m.target) {
          highlightInTextNode(m.target);
        }
      }
    });

    observer.observe(root, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
