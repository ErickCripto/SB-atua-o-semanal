# Guia: login, senha e banco da equipe (Supabase)

Tudo no plano gratuito. Leva uns 15 minutos, uma vez só.

## 1. Criar o projeto
1. Entre em https://supabase.com e crie uma conta (pode usar o GitHub).
2. **New project** → nome `mesa-carteiras`, crie uma senha do banco (guarde) e escolha a região **South America (São Paulo)**.
3. Espere o projeto ficar pronto (1 a 2 minutos).

## 2. Criar as tabelas e as regras
1. Menu da esquerda → **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/setup.sql` deste repositório, copie tudo e cole.
3. Na última parte, troque `seu.email@exemplo.com` pelo **seu e-mail** (você vira o administrador).
4. Clique em **Run**. Deve aparecer "Success".

## 3. Quem cria os acessos é o administrador
1. **Authentication → Sign In / Providers → Email**: **desligue "Confirm email"** e salve. (O acesso é criado por você dentro do site, então não precisa confirmar e-mail.)
2. **Authentication → Hooks → Before User Created** → **Add hook** → tipo **Postgres** → schema `public` → função `hook_antes_de_criar_usuario` → salve. Com isso, o Supabase recusa qualquer cadastro de e-mail que não esteja na lista da equipe.
3. **Authentication → Email Templates → Reset Password**: assunto `Código para trocar a senha – Mesa de Carteiras`; no corpo, cole o conteúdo de `supabase/emails/recuperar-senha.html` (ou do arquivo `recuperar-senha.html`). Salve.

> Para os colegas receberem o código de "Esqueci a senha", ligue um SMTP próprio em **Authentication → Emails → SMTP Settings** (o envio que vem pronto só entrega para quem é da sua organização no Supabase). Com Gmail: host `smtp.gmail.com`, porta `465`, usuário = o Gmail, senha = uma "senha de app" (Conta Google → Segurança → Verificação em duas etapas → Senhas de app).

## 4. Ligar o site ao banco
1. **Project Settings → API**: copie o **Project URL** e a **publishable key** (começa com `sb_publishable_`; nos projetos antigos aparece como anon public).
2. No GitHub, abra `config.js`, clique no lápis e preencha:
   ```js
   window.MESA_SB = {
     url: "https://SEU-PROJETO.supabase.co",
     key: "COLE-A-ANON-KEY-AQUI"
   };
   ```
3. **Commit changes**. O Render publica de novo sozinho em 1 ou 2 minutos.

A anon key pode ficar no site: ela é pública por natureza. Quem protege os dados são as regras do `setup.sql`: só e-mails liberados em **Ajustes → Equipe** veem ou alteram qualquer coisa.

## 5. Seu primeiro acesso (administrador)
Como você é o primeiro, crie o seu usuário pelo painel do Supabase:
1. **Authentication → Users → Add user → Create new user**: o mesmo e-mail que você pôs no SQL, uma senha, e marque **Auto Confirm User**.
2. Abra o site e entre com esse e-mail e senha.
3. Para trazer o que já existe na versão do Claude: lá, em **Ajustes → Backup**, **Baixar backup**; aqui, em **Ajustes → Backup**, **Restaurar backup**.

## 6. Criar o acesso dos colegas (só administrador)
1. No site: **Ajustes → Equipe** (só aparece para administradores) → nome, e-mail, senha provisória (o site já sugere uma) → **Criar acesso**.
2. Copie os dados que aparecem e mande para a pessoa por mensagem direta.
3. Ela entra com o e-mail e a senha provisória, e o site pede para ela criar a senha dela.
4. Para tirar o acesso de alguém: **Remover** na mesma lista. Os dados ficam bloqueados para ela na hora.

## Esqueci a senha
Tela de entrada → **Esqueci a senha** → e-mail → chega um código → digite o código e a senha nova duas vezes → **Alterar senha**. Logado, também dá para trocar em **alterar senha**, no topo.

## O que fica guardado
- Tudo da equipe fica no banco: posições de cada dia, bases título a título, anotações, chamados, pareceres, parâmetros.
- Toda alteração ou exclusão guarda a versão anterior, com quem alterou e quando: **Ajustes → Histórico de alterações**, com botão **Restaurar**.
- O plano gratuito tem 500 MB, o que dá para mais de um ano de bases diárias.
- Projeto gratuito sem uso por 7 dias é pausado pelo Supabase; basta entrar no painel e clicar em **Restore**. Usando o site toda semana, isso não acontece.
