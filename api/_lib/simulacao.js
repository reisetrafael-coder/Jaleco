// Respostas simuladas, usadas só em testes locais (MOCK_AI=1). Não são usadas no app real.

const Q = [
  {
    tema: 'Sinais vitais',
    enunciado: 'Qual é a faixa de frequência cardíaca considerada normal para um adulto em repouso?',
    alternativas: [
      { texto: '60 a 100 bpm', correta: true, explicacao: 'É a faixa de referência usual para adultos em repouso.' },
      { texto: '40 a 60 bpm', correta: false, explicacao: 'Abaixo de 60 bpm caracteriza bradicardia.' },
      { texto: '100 a 140 bpm', correta: false, explicacao: 'Acima de 100 bpm em repouso caracteriza taquicardia.' },
      { texto: '12 a 20 bpm', correta: false, explicacao: 'Essa é a faixa usual da frequência respiratória (irpm), não da cardíaca.' },
    ],
    dica: 'Coração "de 60 a 100": nem devagar, nem acelerado.',
  },
  {
    tema: 'Cálculo de gotejamento',
    enunciado: 'Foram prescritos 500 mL de SF 0,9% para correr em 8 horas. Quantas gotas por minuto (macrogotas) devem ser controladas?',
    alternativas: [
      { texto: 'Aproximadamente 21 gotas/min', correta: true, explicacao: 'Macrogotas: V ÷ (T × 3) = 500 ÷ 24 ≈ 20,8 → 21 gotas/min.' },
      { texto: 'Aproximadamente 63 gotas/min', correta: false, explicacao: 'Esse seria o valor em microgotas (V ÷ T = 62,5).' },
      { texto: '42 gotas/min', correta: false, explicacao: 'O resultado foi dobrado por engano; a fórmula é V ÷ (T × 3).' },
      { texto: '10 gotas/min', correta: false, explicacao: 'Valor muito baixo: o soro não terminaria em 8 horas.' },
    ],
    dica: 'Macro divide por 3 vezes o tempo; micro é só volume ÷ tempo.',
  },
  {
    tema: 'Biossegurança',
    enunciado: 'Para um paciente com suspeita de tuberculose pulmonar, qual precaução deve ser adotada além da precaução padrão?',
    alternativas: [
      { texto: 'Precaução para aerossóis, com máscara N95/PFF2', correta: true, explicacao: 'A tuberculose pulmonar é transmitida por aerossóis.' },
      { texto: 'Precaução para gotículas, com máscara cirúrgica', correta: false, explicacao: 'Gotículas valem para doenças como influenza e meningite meningocócica.' },
      { texto: 'Precaução de contato, apenas com luvas e avental', correta: false, explicacao: 'Contato não protege contra partículas suspensas no ar.' },
      { texto: 'Apenas a precaução padrão', correta: false, explicacao: 'Na tuberculose pulmonar é necessária precaução adicional.' },
    ],
    dica: 'TB, sarampo e varicela: "aerossóis = N95".',
  },
  {
    tema: 'Anotação de enfermagem',
    enunciado: 'Qual destes registros é atribuição do técnico de enfermagem?',
    alternativas: [
      { texto: 'Anotação de enfermagem', correta: true, explicacao: 'O técnico registra os cuidados realizados e o que observou: é a anotação.' },
      { texto: 'Evolução de enfermagem', correta: false, explicacao: 'A evolução é privativa do enfermeiro.' },
      { texto: 'Prescrição de enfermagem', correta: false, explicacao: 'A prescrição é privativa do enfermeiro.' },
      { texto: 'Diagnóstico de enfermagem', correta: false, explicacao: 'O diagnóstico é privativo do enfermeiro.' },
    ],
    dica: 'Técnico ANOTA; enfermeiro EVOLUI e PRESCREVE.',
  },
];

export function respostaFalsa(nome) {
  if (nome === 'entregar_questoes') {
    return { questoes: [Q[0], Q[1], Q[2], Q[3], Q[0]].map((q) => structuredClone(q)) };
  }
  if (nome === 'registrar_semana') {
    return {
      temas: [
        { materia: 'Fundamentos', tema: 'Sinais vitais' },
        { materia: 'Farmacologia', tema: 'Cálculo de gotejamento' },
        { materia: 'Biossegurança', tema: 'Precauções padrão e específicas' },
      ],
      enfase: ['Cálculo de gotejamento'],
      avaliacoes: [{ titulo: 'Prova de Farmacologia', tipo: 'prova', data: null, temas: ['Cálculo de gotejamento'] }],
      resposta: 'Semana boa pra treinar cálculo! Vou montar questões de gotejamento e sinais vitais, e misturar uma revisão de biossegurança.',
    };
  }
  if (nome === 'criar_anotacao') {
    return { titulo: 'Sinais vitais', materia: 'Fundamentos', texto: '**Sinais vitais**\n- Temperatura\n- Pulso\n- Respiração\n- Pressão arterial' };
  }
  if (nome === 'entregar_plano') {
    const hoje = new Date();
    const dia = (n) => new Date(hoje.getTime() + n * 86400000).toISOString().slice(0, 10);
    return {
      dias: [
        { data: dia(0), tarefas: ['Quiz de 10 questões sobre o conteúdo da prova', 'Revisar o caderno de erros'] },
        { data: dia(1), tarefas: ['Resumo dos temas principais', 'Quiz de 5 questões'] },
        { data: dia(2), tarefas: ['Revisão leve', 'Simulado de 10 questões'] },
      ],
    };
  }
  return {};
}

export function textoFalso() {
  return 'Boa pergunta! Pensa assim: **macrogotas** usam a fórmula *volume ÷ (tempo × 3)*.\n\n- 500 mL em 8 h → 500 ÷ 24\n- Resultado: cerca de **21 gotas/min**\n\nQuer tentar um exercício parecido?';
}
