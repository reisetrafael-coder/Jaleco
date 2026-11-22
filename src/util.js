export function novoId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function embaralhar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deixa a questão num formato único, venha da IA ou do caderno de erros.
export function normalizarQuestao(q) {
  return {
    id: q.id || novoId(),
    tema: q.tema || 'Geral',
    enunciado: q.enunciado,
    alternativas: q.alternativas.map((a) => ({ texto: a.texto, correta: !!a.correta, explicacao: a.explicacao || '' })),
    dica: q.dica || '',
  };
}

// Reduz a foto antes de enviar (economiza internet e deixa a IA mais rápida).
export function reduzirImagem(arquivo, max = 1600) {
  return new Promise((ok, falha) => {
    const leitor = new FileReader();
    leitor.onerror = () => falha(new Error('Não consegui abrir essa foto.'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => falha(new Error('Esse arquivo não parece ser uma foto.'));
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * escala);
        c.height = Math.round(img.height * escala);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const url = c.toDataURL('image/jpeg', 0.85);
        ok({ tipo: 'image/jpeg', data: url.split(',')[1], url });
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

// Markdown simples -> HTML seguro (negrito, itálico, listas e títulos).
function escapar(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function emLinha(s) {
  return escapar(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}
export function markdown(texto = '') {
  const linhas = texto.replace(/\r/g, '').split('\n');
  let html = '';
  let lista = null;
  let paragrafo = [];
  const fecharParagrafo = () => {
    if (paragrafo.length) html += `<p>${paragrafo.map(emLinha).join('<br>')}</p>`;
    paragrafo = [];
  };
  const fecharLista = () => {
    if (lista) html += `</${lista}>`;
    lista = null;
  };
  for (const bruta of linhas) {
    const l = bruta.trimEnd();
    const titulo = l.match(/^#{1,4}\s+(.*)/);
    const item = l.match(/^\s*[-*•]\s+(.*)/);
    const num = l.match(/^\s*\d+[.)]\s+(.*)/);
    if (!l.trim()) { fecharParagrafo(); fecharLista(); continue; }
    if (titulo) { fecharParagrafo(); fecharLista(); html += `<h4>${emLinha(titulo[1])}</h4>`; continue; }
    if (item || num) {
      fecharParagrafo();
      const tipo = item ? 'ul' : 'ol';
      if (lista !== tipo) { fecharLista(); html += `<${tipo}>`; lista = tipo; }
      html += `<li>${emLinha((item || num)[1])}</li>`;
      continue;
    }
    fecharLista();
    paragrafo.push(l);
  }
  fecharParagrafo();
  fecharLista();
  return html;
}

export const ehStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
