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

Depois de mudar algo em `src/`, rode `python scripts/build.py` para gerar o `index.html` de novo.

## Onde os dados ficam

Aberto pelo Claude (claude.ai), o site salva tudo na sua conta: anotações, chamados, posições de cada dia e as bases título a título. Aberto direto do arquivo ou do GitHub Pages, ele salva só no navegador, e a comparação título a título entre bases não fica guardada.

A leitura de Excel usa a biblioteca `xlsx-js-style` 1.2.0 (carregada do jsDelivr quando necessário).
