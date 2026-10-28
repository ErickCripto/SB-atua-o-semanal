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

## 3. E-mails com código
1. **Authentication → Email Templates**.
2. Em **Confirm signup**: assunto `Seu código de acesso – Mesa de Carteiras`; no corpo, cole o conteúdo de `supabase/emails/confirmar-cadastro.html`. Salve.
3. Em **Reset Password**: assunto `Código para trocar a senha – Mesa de Carteiras`; no corpo, cole `supabase/emails/recuperar-senha.html`. Salve.
4. **Authentication → Sign In / Providers → Email**: deixe **Confirm email** ligado.

> **Importante para a equipe:** o envio de e-mail que vem pronto no Supabase só entrega para os e-mails de quem faz parte da organização do Supabase e manda poucos por hora. Para os colegas receberem os códigos, ligue um SMTP próprio em **Authentication → Emails → SMTP Settings**. O jeito mais simples e grátis é um Gmail com "senha de app":
> - Host `smtp.gmail.com`, porta `465`, usuário = o Gmail, senha = a senha de app (Conta Google → Segurança → Verificação em duas etapas → Senhas de app).
> - Remetente: o mesmo Gmail; nome: `Mesa de Carteiras`.

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

## 5. Primeiro acesso
1. Abra o site → **Criar acesso** → seu nome, **o mesmo e-mail do passo 2**, senha (mínimo 8 caracteres).
2. Chega um código no e-mail → digite → pronto, você está dentro.
3. Para trazer o que já existe na versão do Claude: lá, em **Ajustes → Backup**, clique em **Baixar backup**; aqui, em **Ajustes → Backup**, use **Restaurar backup** com esse arquivo.

## 6. Colocar a equipe
1. **Ajustes → Equipe** → e-mail e nome da pessoa → **Liberar acesso**.
2. A pessoa abre o site → **Criar acesso** com esse e-mail → digita o código que chegar.

## Esqueci a senha
Tela de acesso → **Esqueci a senha** → e-mail → chega um código → digite o código e a senha nova duas vezes → **Alterar senha**. Logado, também dá para trocar em **alterar senha**, no topo.

## O que fica guardado
- Tudo da equipe fica no banco: posições de cada dia, bases título a título, anotações, chamados, pareceres, parâmetros.
- Toda alteração ou exclusão guarda a versão anterior, com quem alterou e quando: **Ajustes → Histórico de alterações**, com botão **Restaurar**.
- O plano gratuito tem 500 MB, o que dá para mais de um ano de bases diárias.
- Projeto gratuito sem uso por 7 dias é pausado pelo Supabase; basta entrar no painel e clicar em **Restore**. Usando o site toda semana, isso não acontece.
