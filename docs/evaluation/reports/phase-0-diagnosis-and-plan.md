# Fase 0 — Diagnóstico e plano da base experimental

- Data: 25 de outubro de 2026.
- SHA inicial: `f7de1cffb0dbbb1d38eb0c251f2821a1cf5fb692`.
- Estado: diagnóstico concluído; ADR Express aceito após as escolhas do autor.
  Pendências de baseline/versionamento permanecem nas fases correspondentes.
- Autorização desta rodada: somente Fases 0 e 1, com parada no ADR proposto.

## Nota de contexto histórico — regularização documental

Este é um registro histórico do diagnóstico no SHA
`f7de1cffb0dbbb1d38eb0c251f2821a1cf5fb692`, seguido das revisões de design
registradas durante as Fases 0–1. O corpo abaixo foi preservado, inclusive
referências a caminhos, arquivos ignorados e capacidades ausentes naquele
momento; essas afirmações não descrevem o estado atual do repositório.

A Fase 2 foi concluída posteriormente e integrada no commit
`a1175d5b80c2efff070a5c61ac818ba38e04c192`. Consultar o
[relatório da Fase 2](./phase-2-implementation-report.md) para suas evidências
e limitações. Nesta regularização, ADR-EVAL foi movido para `docs/adr/`,
relatórios para `docs/evaluation/reports/`, e a política de ignore documental
foi removida. Somente links relativos e esta nota contextualizam o registro;
não se atribuem ao diagnóstico original conhecimentos da implementação posterior.

## Fontes lidas integralmente

- [Brief de construção](../codex-evaluation-build-brief.md).
- [Cenários v1](../evaluation-scenarios-v1.md).
- [ADR-EVAL-001](../../adr/ADR-EVAL-001.md), encontrado em `docs/evaluation/`,
  embora a solicitação o identifique em `docs/adr/`.
- As seis specs: [visão](../../specs/product-vision.md),
  [DI](../../specs/dependency-injection.md),
  [HTTP](../../specs/http-architecture.md),
  [convenções](../../specs/project-conventions.md),
  [testes](../../specs/testing-strategy.md) e
  [aplicação](../../specs/reference-application.md).
- `AGENTS.md`, configurações, APIs públicas e implementação relacionadas abaixo.

## Estado verificado

`git status --porcelain=v1 --untracked-files=all` estava vazio no início.
Isso descreve arquivos rastreados/não ignorados: `.gitignore:74-75` ignora
`docs` e `AGENTS.md`, e `git ls-files docs AGENTS.md` não retorna arquivos.
Os documentos existentes são locais e foram preservados. Os novos documentos
também ficam ignorados; não se alterou a política de versionamento, o índice
ou qualquer arquivo existente. Rastreabilidade em commits requer resolver essa
política antes das fases de congelamento.

Versões instaladas, verificadas com `node --version`, `pnpm --version` e
`pnpm list -r --depth 0`:

- Node.js `24.15.0`; pnpm `10.28.2`.
- `@typescript/native` → `typescript@7.0.2`;
  `typescript` → `@typescript/typescript6@6.0.2`.
- Fastify `5.12.3`; fastify-plugin `6.0.0`.
- Vitest `4.0.18`; tsup `8.5.1`; ESLint `9.39.2`; Prettier `3.8.1`.
- Zod `4.5.4`; Yup `1.7.1`; reflect-metadata `0.1.14`.
- Pacotes Elyum existentes: `0.1.0`; root privado: `1.0.0`.
- Express não consta como dependência direta dos pacotes atuais.
- CI usa Node `22.x`; este diagnóstico local não reproduz esse ambiente.
- Nenhuma tag `evaluation*` encontrada; não há baseline congelado nesta árvore.

## Implementação versus especificação

### Base HTTP e Fastify existente

`packages/http/src/index.ts` exporta contratos, decorators, compilador,
executor, contexto, resultados e exceções. `ControllerCompiler.compile()` lê
metadata na preparação, valida rota/handler/parâmetros e congela o descritor.
`executeController()` abre o contexto antes da resolução, aceita resolver sync
ou async, aplica extração/validação, detecta conflito de resposta e devolve
instruções sem serializar. Esses elementos podem ser reutilizados sem alterar
o core ou introduzir tipos Express no HTTP.

`packages/fastify/src/index.ts` oferece plugin default/nomeado, opções, runtime
e registrador. `fastify.controller()` compila e chama `fastify.route()` com
opções nativas. Suporta container interno, container fornecido ou resolver
externo; discovery é opt-in. Controllers ausentes são registrados transient;
providers existentes são preservados. Resolução usa root; não há child por
request. `reply.sent` distingue resposta manual. `onError` recebe o erro
original; sem resposta, o erro segue ao Fastify. O adapter não fornece hoje
serializador padrão seguro próprio para erros.

Inspeção de imports em `packages/core/src` e `packages/http/src` não encontrou
imports de `express` ou `fastify`. Não há `packages/express` nem API Express
implementada. Não é necessário redesenhar compilador/executor para começar.

### Aplicação e avaliação

Há uma única aplicação em `packages/examples`, privada `@elyum/examples`.
`src/fastify/routes/index.ts` registra seis rotas: criar/listar produtos,
criar/listar/obter pedidos e atualizar status. Produtos são públicos; pedidos
usam hook nativo com token demonstrativo. O handler da aplicação mapeia erros
conhecidos; desconhecidos voltam ao pipeline Fastify.

Domínio/aplicação usam ports de repositórios assíncronos, relógio e IDs; total
vem do catálogo. `createContainer()` fixa as implementações concretas atuais.
`buildApplication(options)` cria estado isolado e aceita opções Fastify, mas
não oferece parâmetros explícitos para substituir relógio e IDs. Os testes
HTTP usam Fastify real com `inject`; Vitest define metadata de construtor nas
fixtures, enquanto o build TypeScript emite metadata.

Faltam `GET /health`, preview sem persistência, FN/EE/EN, manifesto, suíte
externa comum e ferramentas experimentais. O bootstrap fixa porta `3000` e
não instala encerramento por sinais. São lacunas para o novo baseline, não
justificativa para alterar comportamento nesta rodada. Não há prova atual de
paridade Express, portabilidade, removibilidade ou overhead.

## Conflitos, tensões e lacunas de definição

1. **Local do ADR de avaliação.** A solicitação aponta `docs/adr/ADR-EVAL-001.md`;
   existe somente `docs/evaluation/ADR-EVAL-001.md`. Foi lido nesse local,
   sem mover ou duplicar o original.
2. **Conveniências Express.** A visão ilustra `Elyum(app, { cors })` e admite
   parsing/CORS opcionais; o brief exclui essas conveniências no milestone.
   Resolução confirmada na discussão posterior: JSON passa a ser opt-in no
   adapter com opções nativas; sem opção, parser fica com a aplicação. CORS
   continua fora do milestone. Visão e brief foram alinhados a essa escolha.
3. **Escopo por request.** A estratégia de testes exige comportamento de
   providers request-scoped e estado por request, mas DI/HTTP e o brief adiam
   child containers até descarte e benchmark. Proposta: primeiro milestone
   testa singleton/transient, rejeição documentada de scoped e isolamento do
   contexto HTTP existente; não anuncia suporte scoped. Ajuste textual da
   estratégia depende de aprovação. Contexto HTTP não equivale a container filho.
4. **Erros padrão.** HTTP descreve fallback seguro e classificação conhecida;
   Fastify hoje delega erros originais e não serializa. O ADR Express propõe
   middleware explícito com fallback seguro. Paridade futura requer handler da
   aplicação comum em semântica, sem alterar Fastify nesta rodada.
5. **Rastreabilidade.** O brief exige log de IA versionado, commits e protocolo;
   `docs/` está ignorado. Criar os arquivos locais não satisfaz versionamento.
   A política precisa ser aprovada antes de registrar artefatos em Git.
6. **Documentação de status.** A visão ainda lista exemplos como incompletos,
   embora já exista API Fastify; nome do pacote Express ainda é questão aberta
   na visão, enquanto ADR-EVAL propõe `@elyum/express`. Atualização futura deve
   distinguir estado existente, novo pacote e decisões ainda propostas.
7. **Autenticação do preview.** O baseline não define explicitamente se
   `POST /orders/preview` exige credencial; M2 também não o inclui na política.
   Isso precisa ser fixado na especificação de aceitação antes da Fase 4,
   sem completar a solução dos patches medidos.
8. **Contrato do baseline.** Cenários não fixam JSON exato de health/preview,
   status de preview, seed do catálogo ou serialização completa de erros de
   parser. A aplicação atual é referência para rotas existentes; os contratos
   novos precisam ser aprovados antes da suíte e do congelamento.
9. **Ambiente/checks.** CI usa Node 22 e não executa `typecheck:ts6`, embora as
   specs exijam ambos os typechecks. Prever alinhamento do gate, sem modificar
   toolchain/CI agora. Checks locais não demonstram CI remoto verde.
10. **Aprovação por fase.** O brief pede plano aprovado ao sair da Fase 0;
    a instrução desta rodada autoriza produzir também o ADR antes da parada.
    O plano foi apresentado e a Fase 1 foi redigida como proposta. Isso não
    constitui aprovação automática do plano, do ADR-EVAL ou da API Express.

11. **Interpretação de APIs nativas (esclarecida pelo autor).** Preservar o
    Express significa manter suas características e mecanismos, não exigir
    `app.get`/`app.post` em cada rota Elyum. A direção confirmada é
    `elyum(app | router)` devolve a mesma instância enriquecida, com
    `.controller(...handlers)`, exatamente um controller em ordem livre e
    método/caminho inferidos. `@Next()` específico de Express permite continuar
    a cadeia; JSON é opt-in. As specs foram alinhadas às escolhas confirmadas.
    `compile()` continua futuro. Política de erros confirmada: callback que não
    responde delega o original; fallback seguro somente sem callback configurado.

As escolhas de escopo Express, erro e composição foram confirmadas pelo autor
e incorporadas ao ADR aceito. Contratos do baseline e rastreabilidade continuam
pendências das próximas fases; não foram resolvidos por inferência.

## Plano de mudanças e dependências

Os caminhos futuros abaixo são previsão de escopo; não foram criados.

### Fases 0–1 — esta entrega

- Criar este diagnóstico, `docs/adr/ADR-EXPRESS-001.md` e
  `docs/evaluation/ai-usage-log.md`.
- Nenhum fonte, teste, configuração ou lockfile é editado. Na revisão posterior,
  specs/brief são alinhados somente às escolhas confirmadas pelo autor.
- Saída alcançada para a API Express: alternativa A e política de erros
  confirmadas, ADR `accepted`. A entrega continua documental; Fase 2 ainda
  não executada. Pendências de baseline e versionamento estão registradas.

### Fase 2 — adapter, somente após aprovação

- Prever `packages/express/package.json`, `tsconfig.json`,
  `tsconfig.build.json`, `vitest.config.ts`, `src/index.ts`,
  `src/adapter/express-controller.adapter.ts`, `src/types/`, `src/errors/`,
  `src/middleware/`, `tests/express-adapter.spec.ts`, `tests/public-api.spec.ts`
  e documentação mínima do pacote.
- Integrar `package.json` root, `tsconfig.json`, `vitest.config.ts` e
  `pnpm-lock.yaml` pelo pnpm. Dependências: `@elyum/http`, `@elyum/core` para
  modos DI, validação quando usada diretamente; Express peer 5.x com versão
  exata de desenvolvimento e tipos compatíveis fixados na implementação.
- Atualizar visão/HTTP/DI/testes apenas nas decisões aceitas. Implementar a
  extensão neutra mínima do executor exigida por `@Next()` e sua regressão
  Fastify; não refatorar domínio ou demais partes incidentalmente.
- Prever decorator Express `Next`, controle de delegação, enriquecimento do
  alvo nativo e JSON opt-in com opções nativas.
- Saída: contrato público/tipos e integração Express real, mapping completo,
  erros originais, resposta manual e middleware nativo verificados.
- Validar `pnpm --filter @elyum/express test:ci`,
  `pnpm --filter @elyum/express build` e os quatro checks root.

### Fase 3 — rename isolado

- `packages/examples/**` → `packages/evaluation/**`, ainda com uma aplicação.
- Ajustar nome NPM, nome Vitest, referências em `tsconfig.json`, scripts root,
  lockfile e referências documentais. O workflow atual chama scripts root,
  sem caminho literal de examples; só alterá-lo se necessário ao gate aprovado.
- Dependência: Fase 2 aceita. Saída: commit exclusivamente organizacional,
  sem mudança de comportamento; build e quatro checks root passam.

### Fase 4 — quatro aplicações

- Criar árvores independentes em
  `packages/evaluation/applications/{elyum-fastify,fastify-native,elyum-express,express-native}/`.
- Prever composition roots, entrypoints, testes locais, health/preview e
  `applications/manifest.json`; adaptar build e README do pacote.
- Dependências: contratos pendentes resolvidos; origem EF→EE e FN→EN
  registrada. Saída: `buildApplication` sem TCP em cada variante, porta
  configurável, shutdown, dependências controladas e testes locais passando.
- Validar build/testes filtrados de evaluation e quatro checks root.

### Fase 5 — equivalência externa

- `packages/evaluation/tests/acceptance/**`, `tests/equivalence/**` e fixtures
  externas; mesma matriz e contratos por variante, relógio/ID/state isoláveis.
- Dependência: quatro aplicações. Saída: 100% da matriz obrigatória nas quatro
  variantes e regressão root, sem condicionais que mascarem diferenças.
- Comando previsto: `pnpm --filter @elyum/evaluation test:ci`.

### Fase 6 — ferramentas

- `packages/evaluation/scripts/**`, manifestos de componentes e schemas de
  resultados; imports proibidos, hashes, numstat, SLOC e mapeamento semântico.
- Saída: scripts determinísticos auditáveis, produção/testes separados,
  relatório com SHA/versões/ambiente/data; sem índice composto ou interpretação.
- Acrescentar comandos documentados ao pacote; nomes finais ainda não existem.

### Fase 7 — harness

- `packages/evaluation/benchmarks/**`, scripts e schemas de saída bruta.
- Dependência: equivalência. Saída: carga fora do servidor, parâmetros
  configuráveis, aquecimento, repetições independentes e ordem controlada.
- Validar apenas funcionamento do harness; piloto define parâmetros futuros.
  Nenhuma medição oficial nesta entrega ou no CI compartilhado.

### Fase 8 — congelamento

- Protocolos/manifestos/log de IA/documentação, versões e tag
  `evaluation-baseline-v1`; nenhuma tag criada nesta rodada.
- Resolver versionamento de docs antes. Saída: equivalência, build, quatro
  checks root e revisão humana; SHA registrado e baseline imutável.

### Fase 9 — preparação da execução humana

- Especificações e aceitação congeladas, formulários e comandos em
  `packages/evaluation/scenarios/**`/documentação; seis branches na tag.
- Autor implementa M1–M3. IA não escreve, corrige, refatora nem sugere solução
  dos patches medidos. Coleta somente leitura após commit final informado.
- Saída: commits humanos congelados e saídas de comandos aprovados preservadas,
  inclusive falhas; nenhuma correção automática do cenário.

### Fase 10 — coleta

- `packages/evaluation/results/**` e registros de ambiente/protocolo.
- P1 compara EF→EE e FN→EN; benchmarks somente EF/FN e EE/EN.
- Dependências: piloto e parâmetros congelados. Scripts determinísticos geram
  dados brutos; interpretação e conclusões pertencem ao autor.

## Validação executada nesta rodada

No SHA inicial, com dependências já instaladas, todos concluíram com código 0:

- `pnpm test:ci`.
- `pnpm typecheck`.
- `pnpm typecheck:ts6` (executado após o typecheck principal).
- `pnpm ci:lint`.

São checks locais do estado existente, sem instalação limpa, sem Express e
sem coleta experimental. Podem atualizar artefatos ignorados de build/cache.
Não são prova de nova API, paridade futura ou desempenho. A revisão final dos
documentos verifica links, diferenças e ausência de alterações rastreadas.
