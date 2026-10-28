# SB · Atuação semanal (Mesa de Carteiras)

Site de acompanhamento da confirmação das carteiras, no mesmo visual do sistema da base.

## O que tem

- **Atuação**: lista de todo dia (risco Alto, "Diário", meta ou prazo D+N da característica, operação quase todo dia, ★) e o foco de cada dia da semana: Seg tranche, Ter/Qua risco inteiro, Qui problemas e chamados a abrir, Sex retornos e excesso. Marcação de "Feito" e edição das anotações na própria tabela.
- **Anotações**: todos os cedentes, com pesquisa (lupa) por nome, código, grupo ou texto, e filtros.
- **Carteiras**: índice de confirmação, C99, Não atende, Nada consta, meta pelo risco Pricing, situação, faltam p/ meta; filtros por dia, risco, grupo econômico e rótulo.
- **Tranche**: valor × limite, excesso, meta de uso, saídas por confirmação.
- **Relatórios**: o que mudou de uma base para a outra, título a título (entraram, saíram do risco, confirmados, perderam confirmação, novos C99 / Não atende / Nada consta), resumo pronto para copiar, semana, grupos econômicos e rótulos.
- **Chamados**: situação (aberto, atrasado, respondido, não efetivo…), dias úteis sem retorno.
- **Parecer**: parecer semanal e parecer de cada cedente.
- **Base para chamados**: monta a planilha de pendências e o texto no padrão SB Crédito.
- **Ajustes**: metas, motivos, tabelas de referência (risco, grupos, limites, característica) e exportação.

Os cálculos seguem a planilha *Controle de Carteiras – Confirmação* (abas Carteiras e Tranche) e foram conferidos com ela.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site pronto, num arquivo só. Abra no navegador. |
| `src/shell.html` | Visual (CSS) e a estrutura da página. |
| `src/core.js` | Leitura da base título a título e cálculos (índice, meta, tranche, movimento entre dias). |
| `src/engine.js` | Leitura da base original para a aba Base para chamados. |
| `src/qprof.js` | Planilha de pendências e texto da pendência. |
| `src/app.js` | Telas e interação. |
| `scripts/build.py` | Junta os arquivos de `src/` no `index.html`. |
| `config.js` | Endereço e chave pública do banco Supabase (vazio = sem login). |
| `supabase/setup.sql` | Cria as tabelas, as regras de acesso e o histórico no Supabase. |
| `supabase/emails/` | Modelos dos e-mails com código (cadastro e troca de senha). |

Depois de mudar algo em `src/`, rode `python scripts/build.py` para gerar o `index.html` de novo.

## Onde os dados ficam

- **Com o banco da equipe (Supabase)**: login com senha, código por e-mail para criar acesso e para recuperar a senha, dados compartilhados por toda a equipe e histórico de todas as alterações. Passo a passo em [GUIA-SUPABASE.md](GUIA-SUPABASE.md).
- **Sem banco** (`config.js` vazio): o site salva tudo só no navegador (bases título a título no IndexedDB). Use Ajustes › Backup para guardar uma cópia.
- **Aberto pelo Claude**: salva na conta do Claude de quem abriu.

A leitura de Excel usa `xlsx-js-style` 1.2.0 e o login usa `@supabase/supabase-js` 2.45.4, os dois carregados do jsDelivr.

## Publicar no Render

O arquivo `render.yaml` já deixa o site pronto para o Render como site estático gratuito.

1. Suba estes arquivos para o GitHub (branch `main`).
2. Abra https://dashboard.render.com/blueprint/new?repo=https://github.com/ErickCripto/SB-atua-o-semanal
3. Conecte o GitHub se o Render pedir, confira o serviço `sb-atuacao-semanal` e clique em **Apply**.

O endereço fica parecido com `https://sb-atuacao-semanal.onrender.com`. A cada novo envio para a `main`, o Render publica de novo sozinho.
