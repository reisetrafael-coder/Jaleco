import { useState } from 'react';
import { get, setCodigo } from '../api.js';
import { atualizar, baixar } from '../estado.js';
import { APP_NOME, ASSINATURA } from '../config.js';
import { Aviso, Fita } from '../components/base.jsx';
import { Logo } from '../components/Logo.jsx';

export function Entrada({ aoEntrar }) {
  const [nome, setNome] = useState('');
  const [codigo, setCod] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const entrar = async (ev) => {
    ev.preventDefault();
    setErro('');
    setEnviando(true);
    setCodigo(codigo);
    try {
      await get('/api/sync');
      await baixar();
      atualizar((e) => { if (nome.trim()) e.perfil.nome = nome.trim(); });
      aoEntrar();
    } catch (e) {
      setErro(e.status === 401 ? `Esse código não confere. Pede o código certo pro ${ASSINATURA}.` : e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="entrada">
      <Logo tamanho={88} />
      <h1 className="entrada-titulo">{APP_NOME}</h1>
      <p className="entrada-sub">Seu plantão de estudos de enfermagem: quizzes, tutora, anotações e lembretes, tudo ligado ao que você está vendo no curso.</p>
      <form className="cartao entrada-form" onSubmit={entrar}>
        <Fita>Antes de começar</Fita>
        <label className="campo">
          <span>Como você quer ser chamada?</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome ou apelido" autoComplete="given-name" />
        </label>
        <label className="campo">
          <span>Código de acesso</span>
          <input value={codigo} onChange={(e) => setCod(e.target.value)} placeholder={`O ${ASSINATURA} te passa esse código`} required
            autoComplete="off" />
        </label>
        <Aviso>{erro}</Aviso>
        <button className="btn btn-principal largo" disabled={enviando || !codigo.trim()}>
          {enviando ? 'Conferindo…' : 'Começar a estudar'}
        </button>
      </form>
    </main>
  );
}
