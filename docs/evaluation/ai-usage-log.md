# Registro de uso de IA na base experimental

## 25 de outubro de 2026 — Fases 0 e 1

- Agente: Codex.
- SHA inicial: `f7de1cffb0dbbb1d38eb0c251f2821a1cf5fb692`.
- Autorização: leitura integral dos documentos e specs referenciadas,
  diagnóstico, plano e ADR Express proposto; parar para aprovação.
- Contribuição: `docs/evaluation/phase-0-diagnosis-and-plan.md`,
  `docs/adr/ADR-EXPRESS-001.md` e este registro.
- Fontes: specs locais, implementação/configurações/testes existentes e
  documentação oficial Express citada no ADR. Memória de sessão anterior
  orientou a inspeção inicial; os fatos do diagnóstico foram rechecados.
- Validação: `pnpm test:ci`, `pnpm typecheck`, `pnpm typecheck:ts6` e
  `pnpm ci:lint`, todos com saída 0 no estado existente.
- Limites: exemplos Express são sketches não compilados; nenhum adapter,
  rename, cenário medido, coleta, resultado ou conclusão experimental criado.
- Revisão/compreensão humana: pendentes; ADR permanece `proposed`.
- Commit da contribuição: nenhum. `docs/` está ignorado pelo Git; a decisão
  sobre versionamento está registrada como pendência da Fase 0.
- Aprovação: esta entrada não registra aceite de plano, ADR ou baseline.

## 25 de outubro de 2026 — Revisão da composição Express

- Solicitação: atualizar o ADR conforme o esclarecimento do autor sobre
  preservação das características nativas e composição semelhante ao Fastify.
- Alterações: ADR recomenda factory default `elyum(app | router, options?)`
  com `.controller(Controller, ...middlewares)`, inferência de método/caminho,
  exemplos com app/Router e justificativa de `controller` frente a `usecase`.
- `compile()` foi deslocado para alternativa futura e secundária, fora do
  primeiro milestone; diagnóstico atualizado com a interpretação esclarecida.
- Status: direção de composição confirmada; ADR completo permanece `proposed`.
- Validação: formatação e links locais dos documentos; sem repetir testes de
  código nesta revisão exclusivamente documental.
- Limites: nenhuma implementação Express, rename ou entrada na Fase 2.

## 25 de outubro de 2026 — Escolhas de middleware e continuação registradas

- Autor confirmou a composição ordenada com exatamente um controller em
  qualquer posição e `@Next()` específico do adapter Express.
- Registrados também o retorno da mesma instância nativa enriquecida e JSON
  opt-in com opções nativas, conforme a discussão e preferências confirmadas.
- ADR, visão, arquitetura HTTP, estratégia de testes, brief e diagnóstico
  alinhados; nenhuma capacidade nova é apresentada como implementada.
- Extensão mínima neutra do executor é necessidade planejada de `@Next()`;
  sem alteração de fontes, testes ou dependências nesta rodada.
- Pendência consultada: callback `onError` que não responde delega o erro
  original ou permite fallback do Elyum; ADR completo segue `proposed`.
- Validação documental: formatação, links locais e revisão das alterações;
  os checks de código da Fase 0 não foram reexecutados nesta edição.
- Sem implementação Express, rename, coleta ou avanço para Fase 2.

## 25 de outubro de 2026 — Política de erros confirmada e ADR aceito

- Autor escolheu encaminhar o erro original ao próximo middleware quando
  `onError` configurado não responde; fallback seguro somente sem callback.
- ADR-EXPRESS-001 passou a `accepted` como decisão de design, com rejeição
  explícita do fallback após callback que não responde.
- Visão, arquitetura HTTP, estratégia de testes, brief e diagnóstico alinhados;
  os registros anteriores de propostas/pendências são históricos.
- Nenhuma decisão de API bloqueante restante; tipos exatos e extensão neutra
  do executor pertencem à implementação futura e à sua validação.
- Somente edição documental: sem fontes, testes, dependências, rename ou Fase 2.
- Validação: revisão dos links, coerência do status e formatação dos documentos
  da entrega; sem reexecutar checks de código nesta rodada.

## 25 de outubro de 2026 — Implementação autorizada da Fase 2

- Autor solicitou explicitamente executar o plano da Fase 2 após aceitar o ADR.
- Criado `@elyum/express` com Express 5.3.0 e tipos 5.0.6: instância nativa,
  registro ordenado, `@Next()`, JSON opt-in, DI e middleware de erros explícito.
- Executor HTTP recebeu somente `isExecutionDelegated` opcional e detecção de
  conflito antes de inspecionar resposta enviada. Core recebeu código de erro
  Express; não foram importados frameworks concretos em core/HTTP.
- Integração de aliases, referências e scripts; lockfile gerado pelo pnpm.
  A resolução atualizou também a dependência transitiva side-channel de
  internal-slot, além de adicionar dependências Express; não houve edição
  manual do lockfile. A serialização gerada difere da formatação anterior.
- Testes: 309 no monorepo, dos quais 46 no Express e 65 no HTTP (5 novos);
  Fastify manteve seus 35 testes passando. Builds e ambos os typechecks passaram.
- Consumo CJS/ESM sem aliases verificado; corrigidas condições de export de
  declarações por formato após detectar default ESM não chamável em fixture.
- Exemplo compilado: health 200 e echo 201, incluindo metadata de construtor,
  discovery e continuação nativa; servidores encerrados após verificação.
- Evidências e limitações: `phase-2-implementation-report.md`.
- Sem rename, variantes experimentais, M1–M3, benchmarks, publicação ou commits.
- Documentos seguem ignorados; revisão e compreensão finais do autor pendentes.

## 25 de outubro de 2026 — Regularização documental

- Origem da autorização: instruções explícitas do autor para regularização
  documental e Fase 3, em dois commits na branch
  `chore/evaluation-package-foundation`, sem merge ou PR.
- Decisões aprovadas pelo autor: organização de ADRs/relatórios, versionamento
  de docs/AGENTS e aceitação de ADR-EVAL pelo projeto. Revisão do orientador
  permanece pendente; não se registra aprovação acadêmica por inferência.
- Assistência de IA: definição da API Express discutida nas entradas anteriores,
  implementação, testes e documentação da Fase 2; nesta fase, leitura/revisão,
  movimentação com Git, correção de links e atualização factual dos registros.
- Código Express integrado em `a1175d5b80c2efff070a5c61ac818ba38e04c192`.
  Entradas anteriores sem commit/arquivos ignorados descrevem seu momento
  histórico. Relatórios agora ficam em `docs/evaluation/reports/` e ADR-EVAL
  em `docs/adr/`; os caminhos antigos nas entradas históricas são preservados.
- Conteúdo redigido/revisado com IA não equivale à decisão do autor ou à revisão
  do orientador. Nesta etapa o autor aprovou o escopo; revisão final é humana.
- Validação do commit documental: links locais, diff e limites de arquivos;
  nenhum fonte, dependência, lockfile ou configuração de workspace alterado.
- Restrição de autoria mantida: após `evaluation-baseline-v1`, a IA não poderá
  implementar, corrigir, refatorar ou sugerir soluções dos patches medidos de
  M1, M2 ou M3. Esta regularização não congela baseline nem prepara soluções.

## 25 de outubro de 2026 — Fase 3 organizacional

- Autorização explícita do autor: somente rename após commit documental,
  dois commits separados e push da branch, sem merge, PR ou Fase 4.
- Partida: `e7ce90daeae60bf6e0cc754f89dd3cb6b705691b`; base inicial
  `a1175d5b80c2efff070a5c61ac818ba38e04c192`, conferida com origin/main.
- IA executou `git mv` para a raiz `packages/evaluation`, atualizou nome NPM,
  nome Vitest, referências root, importer pelo pnpm e documentação viva.
- Produção e testes mantidos byte a byte; duas edições locais limitadas aos
  nomes em package.json/vitest.config.ts. Exemplo do adapter Express intacto.
- Instalação congelada, 309 testes, ambos os typechecks, lint/formatação e
  build local passaram; detalhes no
  [relatório da Fase 3](./reports/phase-3-package-rename.md).
- Nenhuma variante, benchmark, solução de cenário, tag ou resultado criado.
  Proibição de assistência na solução dos patches M1–M3 após congelamento
  permanece integral. Revisão do orientador continua pendente.
