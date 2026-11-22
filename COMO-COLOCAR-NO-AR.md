# Jaleco: como colocar o app no ar

Guia passo a passo pra colocar o app no ar e instalar no celular da sua namorada. Leva uns 30 a 40 minutos, sem precisar programar.

**O que você precisa:**
- Um computador com o Chrome
- Um cartão de crédito (só pra comprar os créditos da IA)
- Esta pasta do projeto, descompactada
- O arquivo **CHAVES-SECRETAS-JALECO.txt**, que veio junto (guarde ele com cuidado e nunca suba pro GitHub)

**Como as peças se encaixam:**
- **GitHub** guarda o código.
- **Vercel** coloca o app no ar e dá o link.
- **Supabase** é o banco onde ficam as anotações, os erros e o progresso dela.
- **Claude (Anthropic)** é a IA tutora.

---

## Passo 1: GitHub (guardar o código)

1. Crie uma conta em **github.com** (é grátis).
2. Clique no **+** no canto superior direito e depois em **New repository**.
3. Em *Repository name*, escreva `jaleco`. Marque **Private** e clique em **Create repository**.
4. Na página que abrir, clique no link **uploading an existing file**.
5. Abra a pasta `jaleco` no seu computador, selecione **tudo o que está dentro dela** (as pastas `api`, `public`, `src`, `scripts` e os arquivos) e arraste para a página do GitHub.
   - Arraste o **conteúdo** da pasta, não a pasta `jaleco` em si.
   - **Não** arraste o arquivo CHAVES-SECRETAS-JALECO.txt.
6. Espere carregar e clique em **Commit changes**.

## Passo 2: Supabase (o banco de dados)

1. Crie uma conta em **supabase.com** (dá pra entrar com o GitHub) e clique em **New project**.
2. Dê o nome `jaleco`, crie uma senha do banco (guarde, mas o app não vai usar) e escolha a região **South America (São Paulo)**. Clique em **Create new project** e espere uns 2 minutos.
3. No menu da esquerda, abra o **SQL Editor**.
4. Abra o arquivo `supabase.sql` desta pasta, copie tudo, cole no editor e clique em **Run**. Deve aparecer "Success".
5. Pegue as duas informações do banco:
   - **SUPABASE_URL:** o endereço do projeto, no formato `https://xxxx.supabase.co`. Fica em **Project Settings > Data API** (ou no botão **Connect**, no topo do projeto).
   - **SUPABASE_SECRET_KEY:** em **Project Settings > API Keys**, na parte **Secret keys**, copie a chave que começa com `sb_secret_`. Se o seu painel só mostrar as chaves antigas, use a **service_role**.
6. Cole as duas no seu arquivo CHAVES-SECRETAS-JALECO.txt pra não perder.

> A chave secreta do Supabase dá acesso total ao banco. Ela só vai pra Vercel, nunca pra outro lugar.

## Passo 3: Claude (a IA tutora)

1. Entre em **platform.claude.com** e crie uma conta. Essa conta é separada da assinatura do Claude que você usa no chat.
2. Vá em **Settings > Billing** e clique em **Buy credits**. Coloque o valor que quiser (o mínimo costuma ser US$ 5) e pague com o cartão.
   - Recomendado: deixe a **recarga automática desligada**. Assim o gasto nunca passa do que você colocou.
3. Vá em **API Keys** e clique em **Create key**. Dê o nome `jaleco`, crie e **copie a chave na hora** (começa com `sk-ant-`). Ela só aparece uma vez.
4. Cole no arquivo CHAVES-SECRETAS-JALECO.txt como `ANTHROPIC_API_KEY`.

## Passo 4: Vercel (colocar no ar)

1. Crie uma conta em **vercel.com** escolhendo **Continue with GitHub**. No plano, escolha **Hobby** (grátis, para uso pessoal).
2. Clique em **Add New… > Project**. Vai aparecer o repositório `jaleco`: clique em **Import**.
   - Se não aparecer, clique em **Adjust GitHub App Permissions** e libere o repositório.
3. A Vercel reconhece sozinha que o app usa **Vite**. Não mude nada nas configurações de build.
4. Abra **Environment Variables** e adicione uma por uma (nome em *Key*, valor em *Value*), copiando do arquivo de chaves:

| Key | De onde vem |
|---|---|
| `APP_PIN` | do arquivo de chaves (é o código de acesso dela) |
| `ANTHROPIC_API_KEY` | do passo 3 |
| `SUPABASE_URL` | do passo 2 |
| `SUPABASE_SECRET_KEY` | do passo 2 |
| `VAPID_PUBLIC_KEY` | do arquivo de chaves |
| `VAPID_PRIVATE_KEY` | do arquivo de chaves |
| `VAPID_SUBJECT` | `mailto:` + seu e-mail (ex.: `mailto:rafael@gmail.com`) |
| `CRON_SECRET` | do arquivo de chaves |

   Dica: dá pra copiar todas as linhas `NOME=valor` de uma vez e colar no primeiro campo. A Vercel separa sozinha.
5. Clique em **Deploy** e espere 1 ou 2 minutos.
6. Vai aparecer um link do tipo `jaleco-xxxx.vercel.app`. **Esse é o endereço do app.**

> Se você adicionar ou mudar alguma variável depois, vá em **Deployments**, clique nos **⋯** da versão mais recente e depois em **Redeploy**. As variáveis só valem depois de republicar.

## Passo 5: Testar antes de entregar

1. Abra o link no seu celular ou computador.
2. Coloque um nome e o código de acesso (`APP_PIN`).
3. Faça um **check-in da semana** de teste ("essa semana é sinais vitais") e depois um **quiz da semana**.
4. Abra a **Tutora** e faça uma pergunta.
5. Em **Ajustes** (a engrenagem na tela inicial), confira se aparece "Tudo salvo na nuvem".

Se tudo funcionou, abra **Ajustes > Seus dados > Baixar uma cópia** só pra ver que funciona. Depois apague os dados de teste: no Supabase, abra **Table Editor > app_state** e apague as linhas. Assim ela começa do zero.

## Passo 6: Instalar no celular dela (Android)

1. No celular dela, abra o link no **Chrome**.
2. Ela coloca o nome dela e o código de acesso.
3. Na tela inicial do app aparece **Instalar no celular**. Se não aparecer, toque nos **⋮** do Chrome e depois em **Instalar app** (ou **Adicionar à tela inicial**).
4. Pronto: o ícone do Jaleco aparece junto dos outros apps. A partir de agora, ela abre sempre por ele.
5. Dentro do app, vá em **Ajustes > Ativar notificações**, aceite e toque em **Enviar uma de teste**.

**Sobre os lembretes:** chega uma notificação por dia, entre 18h e 19h (horário de Brasília), com provas chegando, revisões pendentes e o check-in da semana. Nos dias em que ela já estudou e não tem nada pendente, o app não manda nada. Pra mudar o horário, edite o arquivo `vercel.json`: o horário está em UTC (Brasília + 3h), então `0 21 * * *` = 18h.

## Personalizar (os recados são seus)

Abra o arquivo **`src/config.js`** no GitHub e clique no **lápis** pra editar. Ali você muda:
- o nome do app (`APP_NOME`)
- quem assina os recados (`ASSINATURA`)
- os **recados** que aparecem pra ela todo dia e quando ela vai bem no quiz

Escreva do seu jeito e clique em **Commit changes**. A Vercel publica a versão nova sozinha em cerca de 1 minuto, e o app no celular dela se atualiza na próxima vez que ela abrir.

## Quanto custa

- **GitHub, Vercel e Supabase:** grátis nesse tamanho.
- **IA (Claude):** paga pelo uso, descontado dos créditos que você comprou. Você acompanha em **platform.claude.com > Usage**.
- **Pra gastar menos:** na Vercel, adicione a variável `ANTHROPIC_MODEL=claude-haiku-5-5` e faça um Redeploy. Fica bem mais barato, mas as explicações ficam um pouco mais simples. Por padrão o app usa o `claude-sonnet-5-5`.

## Se algo der errado

| O que aparece | O que fazer |
|---|---|
| "Esse código não confere" | O código digitado é diferente do `APP_PIN` da Vercel. Confira maiúsculas, minúsculas e espaços. |
| "O código de acesso (APP_PIN) não foi configurado" | Falta a variável `APP_PIN` na Vercel, ou você não fez o Redeploy depois de adicionar. |
| "A chave da API do Claude está errada" | Confira `ANTHROPIC_API_KEY` e faça Redeploy. |
| "Acabaram os créditos da API" | Compre mais créditos em platform.claude.com > Billing. |
| "Cópia na nuvem desligada" | Faltam `SUPABASE_URL` ou `SUPABASE_SECRET_KEY` na Vercel. |
| "Banco respondeu 401" ou "403" | A chave do Supabase está errada, ou o `supabase.sql` não foi rodado. |
| A notificação não chega | Confira se as 4 variáveis `VAPID_...` e `CRON_SECRET` estão na Vercel. No celular, veja se as notificações do app não estão bloqueadas em Configurações > Apps. |

## Segurança, em resumo

- As chaves secretas ficam só na Vercel, nunca no código nem no GitHub.
- O app só responde pra quem tem o código de acesso (`APP_PIN`).
- A tabela do banco fica trancada: só o servidor do app acessa.
- A IA pode errar. O app avisa que, em doses e protocolos, vale sempre a prescrição e o protocolo da instituição.

---

## Pra quem for mexer no código (você com o Claude Code, por exemplo)

- `src/`: o app (React + Vite). As telas estão em `src/screens/` e os textos personalizáveis em `src/config.js`.
- `api/`: as funções do servidor na Vercel.
  - `ai.js`: a IA (quiz, check-in, chat, resumo, foto e plano de revisão)
  - `sync.js`: salva e carrega os dados
  - `push.js`: notificações
  - `lembrete-diario.js`: o lembrete diário
- `api/_lib/instrucoes.js`: **as instruções da tutora**. É aqui que se ajusta o jeito dela de ensinar.
- `src/shared/`: datas e lógica dos lembretes, usadas pelo app e pelo servidor.
- Os dados ficam no celular (localStorage) e são copiados para o Supabase (tabela `app_state`, linha `main`).

**Rodar no computador pra testar, com a IA simulada:**
```
npm install
MOCK_AI=1 APP_PIN=1234 DEV_STORE_FILE=dev-store.json npm run dev:api
npm run dev
```
Depois abra http://localhost:5173 e use o código 1234.
