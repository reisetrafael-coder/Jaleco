import { useRef, useState } from 'react';
import { getCodigo, setCodigo } from '../api.js';
import { atualizar, baixar, enviar, getEstado, substituirTudo, useEstado, useStatusSync } from '../estado.js';
import { APP_NOME, ASSINATURA } from '../config.js';
import { hojeBR } from '../shared/datas.js';
import { Aviso, Cabecalho } from '../components/base.jsx';
import { ativarNotificacoes, permissaoAtual, testarNotificacao } from '../notificacoes.js';
import { useInstalacao } from '../instalar.js';

const SITUACAO = {
  parado: 'Ainda não sincronizado.',
  enviando: 'Salvando na nuvem…',
  ok: 'Tudo salvo na nuvem.',
  erro: 'Sem conexão agora. Os dados estão salvos no celular e vão pra nuvem quando a internet voltar.',
  desativado: 'Cópia na nuvem desligada (o banco de dados não foi configurado). Os dados ficam só neste celular.',
  codigo: 'O código de acesso mudou. Atualize abaixo.',
};

export function Ajustes() {
  const e = useEstado();
  const sync = useStatusSync();
  const [nome, setNome] = useState(e.perfil.nome);
  const [codigo, setCod] = useState(getCodigo());
  const [msg, setMsg] = useState({ texto: '', tipo: 'ok' });
  const [permissao, setPermissao] = useState(permissaoAtual());
  const arquivo = useRef(null);
  const { podeInstalar, instalar } = useInstalacao();

  const avisar = (texto, tipo = 'ok') => setMsg({ texto, tipo });

  const ligar = async () => {
    try {
      await ativarNotificacoes();
      setPermissao(permissaoAtual());
      avisar('Notificações ativadas. Os lembretes chegam uma vez por dia, no fim da tarde.');
    } catch (err) {
      setPermissao(permissaoAtual());
      avisar(err.message, 'erro');
    }
  };

  const testar = async () => {
    try {
      await testarNotificacao();
      avisar('Notificação de teste enviada. Deve aparecer em alguns segundos.');
    } catch (err) {
      avisar(err.message, 'erro');
    }
  };

  const baixarCopia = () => {
    const { cache, ...dados } = getEstado();
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${APP_NOME.toLowerCase()}-copia-${hojeBR()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const restaurar = async (ev) => {
    const arq = ev.target.files?.[0];
    ev.target.value = '';
    if (!arq) return;
    try {
      const dados = JSON.parse(await arq.text());
      if (!dados || typeof dados !== 'object' || !('semanas' in dados)) throw new Error();
      if (!window.confirm('Isso troca todos os dados atuais pelos da cópia. Continuar?')) return;
      substituirTudo(dados);
      avisar('Cópia restaurada.');
    } catch {
      avisar('Esse arquivo não é uma cópia do app.', 'erro');
    }
  };

  return (
    <main className="tela">
      <Cabecalho titulo="Ajustes" />
      <section className="pilha">
        <Aviso tipo={msg.tipo} aoFechar={() => setMsg({ texto: '' })}>{msg.texto}</Aviso>

        {podeInstalar && <button className="btn btn-principal largo" onClick={instalar}>Instalar no celular</button>}

        <div className="cartao pilha">
          <h2 className="cartao-titulo">Você</h2>
          <label className="campo"><span>Como você quer ser chamada</span>
            <input value={nome} onChange={(ev) => setNome(ev.target.value)} onBlur={() => atualizar((x) => { x.perfil.nome = nome.trim(); })} />
          </label>
        </div>

        <div className="cartao pilha">
          <h2 className="cartao-titulo">Lembretes</h2>
          <p className="texto-pequeno">Uma notificação por dia, no fim da tarde, com provas chegando, revisões do caderno de erros e o check-in da semana. Nos dias em que você já estudou e não há nada pendente, o app não incomoda.</p>
          {permissao === 'granted' ? (
            <div className="linha-botoes">
              <span className="selo-ok">Notificações ligadas</span>
              <button className="btn btn-secundario" onClick={testar}>Enviar uma de teste</button>
              <button className="link" onClick={ligar}>Reconectar</button>
            </div>
          ) : permissao === 'indisponivel' ? (
            <p className="texto-pequeno">Pra receber lembretes, instale o app pelo Chrome e abra pelo ícone da tela inicial.</p>
          ) : (
            <button className="btn btn-principal" onClick={ligar}>Ativar notificações</button>
          )}
        </div>

        <div className="cartao pilha">
          <h2 className="cartao-titulo">Seus dados</h2>
          <p className="texto-pequeno">{SITUACAO[sync.situacao] || SITUACAO.parado}</p>
          <div className="linha-botoes">
            <button className="btn btn-secundario" onClick={async () => { await enviar(); await baixar(); }}>Sincronizar agora</button>
            <button className="btn btn-secundario" onClick={baixarCopia}>Baixar uma cópia</button>
            <button className="btn btn-secundario" onClick={() => arquivo.current.click()}>Restaurar cópia</button>
            <input ref={arquivo} type="file" accept="application/json,.json" hidden onChange={restaurar} />
          </div>
          <label className="campo"><span>Código de acesso</span>
            <input value={codigo} onChange={(ev) => setCod(ev.target.value)} onBlur={() => { setCodigo(codigo); baixar(); }} autoComplete="off" />
          </label>
        </div>

        <div className="cartao pilha">
          <h2 className="cartao-titulo">Sobre o {APP_NOME}</h2>
          <p className="texto-pequeno">Feito pelo {ASSINATURA} pra te ajudar a estudar. A tutora usa inteligência artificial e pode errar: em doses, diluições e protocolos, confira sempre a prescrição, a bula e o protocolo da instituição. O app é pra estudo, não pra decidir condutas com pacientes.</p>
        </div>
      </section>
    </main>
  );
}
