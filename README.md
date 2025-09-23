# Extensão Chrome: Realce de Telefones

Uma extensão simples que detecta números de telefone em páginas web e os destaca visualmente.

## Como instalar (modo desenvolvedor)
1. Baixe/clonar este repositório para seu computador.
2. Abra o Google Chrome e acesse: chrome://extensions/
3. Ative o "Modo do desenvolvedor" (canto superior direito).
4. Clique em "Carregar sem compactação" (ou "Load unpacked").
5. Selecione a pasta deste projeto (a pasta que contém `manifest.json`).

Pronto! A extensão será injetada nas páginas que você abrir.

## Como funciona
- Um script de conteúdo (content.js) percorre o DOM das páginas e procura por padrões de números de telefone.
- Quando encontra um número que parece um telefone (por exemplo: 0800-123-4567, (11) 91234-5678, +55 11 2345-6789), ele envolve o texto com um `<span class="phone-highlight">`.
- Um MutationObserver mantém o destaque em conteúdos carregados dinamicamente.

## Ajustes e limitações
- O detector usa regras simples com regex e um limite de dígitos (8 a 15) para reduzir falsos positivos.
- Campos como `<input>`, `<textarea>`, `<script>`, `<style>` e semelhantes são ignorados para evitar interferências.
- Você pode personalizar o visual do destaque editando `styles.css` (classe `.phone-highlight`).

## Estrutura dos arquivos
- `manifest.json`: Manifesto da extensão (Manifest V3)
- `content.js`: Script de conteúdo que detecta e destaca números
- `styles.css`: Estilos do destaque

## Teste rápido
Abra qualquer página com números de telefone (ex.: uma página de contato). Os números devem aparecer com um fundo amarelo claro. Passe o mouse para ver uma variação de cor.
