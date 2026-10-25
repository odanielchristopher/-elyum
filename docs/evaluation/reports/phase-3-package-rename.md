# Fase 3 — Renomeação do pacote de avaliação

- Data: 25 de outubro de 2026.
- Branch: `chore/evaluation-package-foundation`.
- SHA inicial da tarefa: `a1175d5b80c2efff070a5c61ac818ba38e04c192`, igual ao
  `origin/main` local e ao SHA consultado diretamente no GitHub antes de alterações.
- SHA de partida desta fase: `e7ce90daeae60bf6e0cc754f89dd3cb6b705691b`,
  commit documental independente concluído antes do rename.
- Objetivo: executar somente a Fase 3 do
  [plano de construção](../codex-evaluation-build-brief.md).

## Alterações

`git mv` moveu `packages/examples` para `packages/evaluation`. O pacote continua
privado, versão `0.1.0`, com nome `@elyum/evaluation` e a mesma estrutura interna.
Dentro dele, somente `package.json` e o nome de projeto em `vitest.config.ts`
receberam edição textual; os demais arquivos foram apenas movidos.

Foram atualizados os scripts `pretypecheck`/`typecheck:ts6` e a referência do
projeto no `tsconfig.json` da raiz. O Vitest da raiz não tinha caminho para o
pacote anterior e não precisou mudar. Os tsconfigs locais mantêm referências
relativas na mesma profundidade, sem alterações. O workflow chama scripts
da raiz e também não precisou mudar.

O pnpm atualizou somente o nome do importer no lockfile: uma linha removida
e uma adicionada, sem mudança de resolução ou dependências.

Documentação viva foi alinhada: brief, cenários, ADR-EVAL, contexto posterior
no ADR Express e localização da aplicação na spec de referência. Os relatórios
históricos das Fases 0 e 2 permanecem intactos neste segundo commit, incluindo
seus caminhos antigos contextualizados. O log de IA registra esta fase.

## Preservação de comportamento

A comparação byte a byte com `a1175d5` confirmou identidade de 44 arquivos
movidos, excluindo apenas os dois arquivos com nomes de pacote/projeto alterados.
Isso inclui todos os fontes e testes da aplicação, além dos tsconfigs locais.
O exemplo próprio do Express, em `packages/express/examples`, manteve seus dois
arquivos idênticos. A mudança é exclusivamente organizacional.

Nenhuma rota, regra, controller, caso de uso, autenticação ou resposta HTTP foi
alterada. Nenhuma reorganização interna, variante, `/health` ou preview foi
adicionada ao pacote de avaliação. Não foram criados benchmarks, scripts de
métricas, branches de cenário, resultados experimentais ou tag de baseline.

## Comandos executados e resultados

Todos os gates abaixo concluíram com código de saída 0:

- `pnpm install --lockfile-only --offline --ignore-scripts`: atualização do
  importer pelo gerenciador; diff revisado antes da instalação congelada.
- `pnpm install --frozen-lockfile`: lockfile atualizado, resolução dispensada;
  hooks normais de preparação executados.
- `pnpm test:ci`: 309 testes passando em 27 arquivos. O pacote renomeado
  executou os mesmos 20 testes; Express manteve 46 e Fastify manteve 35.
- `pnpm typecheck`: passou com referências e nome novos.
- `pnpm typecheck:ts6`: passou.
- `pnpm ci:lint`: lint e formatação passaram.
- `pnpm build`: build completo passou, incluindo `packages/evaluation`.
- `git diff --check`: sem erros.
- `git status --short`: inspecionado antes do commit, com somente o rename,
  referências necessárias, documentação viva e este relatório. O estado final
  após commit/push será apresentado na entrega.

Também foram verificados links Markdown locais, rastreamento dos documentos,
ausência de referências operacionais ao pacote antigo e identidade dos arquivos
com o ponto de partida. Referências antigas restantes são históricas ou
explicam a própria renomeação, sem uso em scripts/configuração.

## Limitações e desvios

- Validação local em Node `24.15.0` e pnpm `10.28.2`; nenhum CI remoto ou
  execução em Node 22 foi verificado nesta fase.
- `evaluation-protocol.md` não existe no conjunto documental recebido e não
  foi criado por inferência. O protocolo e o congelamento continuam futuros.
- Os documentos estavam ignorados e não possuíam histórico Git anterior.
  Foram adicionados ao índice e movidos com `git mv` no primeiro commit;
  essa primeira versão não recupera um histórico que nunca foi versionado.
- A revisão do orientador sobre ADR-EVAL permanece pendente. Aceitação pelo
  autor não equivale à aprovação acadêmica nem à execução das fases futuras.
- Não houve alteração de API ou comportamento, merge, abertura/alteração de PR
  ou avanço à Fase 4. Push é limitado à branch solicitada.

## Uso de IA

Codex auxiliou na leitura, organização documental, correção de links, rename,
atualização de referências e execução dos checks sob instrução explícita do
autor. As decisões aprovadas continuam atribuídas ao autor; conteúdo assistido
por IA e evidências locais estão registrados em [ai-usage-log](../ai-usage-log.md).
Após o congelamento do baseline, permanece proibida a implementação, correção,
refatoração ou sugestão de solução por IA dos patches medidos M1, M2 e M3.
