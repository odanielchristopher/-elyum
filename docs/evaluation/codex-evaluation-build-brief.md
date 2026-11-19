# Plano de implementação para o Codex — base experimental do Elyum

> Status: documento histórico. Para o baseline atual, prevalecem os
> [contratos v2](./evaluation-contracts-v2.md), o
> [protocolo v0.2](./evaluation-protocol-v0.2.md) e o
> [plano da fase 4](./codex-phase4-implementation-plan.md). A construção e
> validação funcional estão registradas no
> [relatório das Fases 4 e 5](./reports/phase-4-and-5-baseline.md).

## Papel

Você está trabalhando no monorepo `odanielchristopher/-elyum`. Construa a base
experimental descrita neste documento sem executar nem inventar resultados do
TCC. Preserve as decisões existentes em `product-vision.md`,
`http-architecture.md`, `dependency-injection.md`, `testing-strategy.md`,
`reference-application.md` e `project-conventions.md`.

Antes de alterar código, leia integralmente esses documentos e a especificação
`evaluation-scenarios-v1.md`.

## Resultado esperado

Entregar:

1. `@elyum/express` como adapter mínimo e publicável;
2. `packages/examples` renomeado para `packages/evaluation`;
3. quatro aplicações funcionalmente equivalentes dentro do pacote de avaliação;
4. suíte externa de aceitação executável contra qualquer variante;
5. endpoints B1, B2 e B3;
6. scripts iniciais de equivalência, portabilidade e coleta;
7. documentação para reproduzir build, testes e inicialização;
8. nenhuma solução dos patches medidos de M1, M2 ou M3 produzida pela IA;
9. nenhuma medição final ou conclusão fabricada.

## Restrições obrigatórias

- Não importar `express` ou `fastify` em `@elyum/core` ou `@elyum/http`.
- Não importar `@elyum/*` em `fastify-native` ou `express-native`.
- Não compartilhar código de produção por import entre as quatro aplicações.
- Não adicionar banco, ORM, Redis, fila, API externa, JWT ou autenticação real.
- Não criar guards do Elyum.
- Não ocultar `Fastify` hooks nem `Express` middleware.
- Não criar um roteador genérico próprio do Elyum.
- Não alterar o comportamento de domínio para facilitar um adapter.
- Não gerar, reescrever, completar, corrigir, refatorar nem sugerir a solução dos
  patches medidos de M1, M2 ou M3. O Codex pode preparar as especificações e os
  testes de aceitação antes do congelamento, mas a implementação medida será
  realizada pelo autor sem geração direta de código por IA.
- Não registrar números de benchmark como resultados oficiais antes do piloto e
  do congelamento do protocolo.
- Não fazer refatorações cosméticas não relacionadas dentro dos patches medidos.
- Manter `pnpm test:ci`, `pnpm typecheck`, `pnpm typecheck:ts6` e
  `pnpm ci:lint` passando.

## Fronteira de uso da IA e autoria

### Uso permitido antes da coleta

O Codex pode auxiliar na construção do adapter Express, das quatro aplicações
de baseline, da suíte compartilhada, dos fixtures, dos scripts de coleta, do
harness de benchmark e da documentação. Toda contribuição precisa ser revisada,
compreendida pelo autor, coberta por testes e registrada em
`docs/evaluation/ai-usage-log.md`.

P1 analisa a preservação estrutural entre os quatro artefatos de baseline; não
mede tempo ou produtividade humana de migração. Como os baselines podem receber
assistência de IA, essa condição deve ser declarada, e nenhuma conclusão de P1
pode ser formulada como redução comprovada do esforço de desenvolvedores.

### Uso proibido nos patches medidos

Depois da tag `evaluation-baseline-v1`, o Codex não pode:

- implementar qualquer parte de M1, M2 ou M3;
- preencher TODOs ou fornecer trechos prontos para esses patches;
- diagnosticar uma falha e propor a alteração de código que a corrige;
- revisar o patch com o objetivo de reduzi-lo ou melhorar suas métricas;
- fazer refatoração, formatação automática ou alterações auxiliares na árvore
  medida;
- selecionar, descartar, alterar ou interpretar resultados em favor de um
  tratamento.

Consultas meramente explicativas ou de documentação só podem ocorrer conforme a
política do protocolo, com a mesma possibilidade nos dois tratamentos e
registro no log. Se receber uma solicitação que ultrapasse essa fronteira, o
Codex deve interromper a ação, explicar que ela contaminaria o cenário e não
modificar o código medido.

### Uso permitido depois do commit final do cenário

Após o autor concluir e congelar o commit medido, o Codex pode executar, sem
alterar a árvore, os scripts determinísticos de testes e coleta já aprovados. A
IA pode auxiliar na organização material das saídas, mas não pode substituir a
interpretação dos resultados nem produzir discussão ou conclusão em nome do
autor.

## Estrutura-alvo

```text
packages/
  core/
  http/
  fastify/
  express/
  validation/
  validation-zod/
  validation-yup/
  evaluation/
    applications/
      elyum-fastify/
      fastify-native/
      elyum-express/
      express-native/
    tests/
      acceptance/
      equivalence/
    benchmarks/
    scenarios/
    scripts/
    results/
```

Cada diretório em `applications` precisa de um entrypoint de build e de uma
função `buildApplication` testável sem abrir porta TCP. Cada servidor deve
aceitar porta por variável/argumento e encerrar graciosamente.

## Fase 0 — Diagnóstico e plano

1. Inspecione a árvore e as APIs públicas atuais.
2. Registre o SHA inicial e versões relevantes.
3. Liste os arquivos afetados por fase.
4. Identifique decisões abertas do adapter Express.
5. Não modifique código antes de apresentar o plano resumido.

Porta de saída: plano aprovado e nenhum conflito não resolvido com as specs.

## Fase 1 — ADR da API Express

Crie `docs/adr/ADR-EXPRESS-001.md` com pelo menos duas alternativas de API e
exemplos completos de uso.

Critérios obrigatórios da decisão:

- Express mantém `app.get`, `app.post`, `Router` e middleware visíveis;
- metadata do controller não é relida por requisição;
- `ControllerCompiler` é reutilizado;
- `executeController` continua framework-neutral;
- body, query, params, headers, request e response nativos são mapeados;
- `res.headersSent` participa da detecção de resposta manual;
- middleware de erro preserva erro original e respeita resposta enviada;
- resolução síncrona e assíncrona de controller é possível;
- container fornecido pela aplicação tem propriedade explícita;
- não criar request child container no primeiro milestone sem política de
  descarte e benchmark.

Pare para aprovação da alternativa. Não consolide API pública enquanto o ADR
estiver `proposed`.

## Fase 2 — Implementar `@elyum/express`

Após aprovação do ADR:

1. criar package, tsconfig, build e exports;
2. implementar compilação fora do hot path;
3. implementar handler Express sobre `executeController`;
4. integrar middleware e pipeline de erros segundo o ADR;
5. preservar acesso a request e response nativos;
6. adicionar testes unitários, integração real com Express e teste de API
   pública;
7. documentar exemplo mínimo.

Não adicionar conveniências como CORS, logger ou criação automática do servidor
neste milestone.

Porta de saída: testes do pacote, tipos e integração real passando.

## Fase 3 — Renomear o pacote de avaliação

Renomeie `packages/examples` para `packages/evaluation` em um commit isolado.

Atualize:

- nome do package;
- project references;
- scripts de root;
- imports e caminhos do CI;
- documentação;
- lockfile somente pelo gerenciador de pacotes.

Não mude comportamento nesse commit.

Porta de saída: todos os comandos de CI continuam passando com a aplicação
Elyum/Fastify ainda funcional.

## Fase 4 — Construir as quatro variantes

### EF — Elyum/Fastify

Migre a aplicação atual sem alterar seu comportamento e acrescente `GET
/health` e `POST /orders/preview` conforme a especificação comum.

### FN — Fastify nativo

Crie uma implementação idiomática com Fastify 5. Não reproduza decorators,
reflection metadata ou o container Elyum artificialmente. Preserve separação
semântica de domínio, aplicação, infraestrutura e apresentação.

### EE — Elyum/Express

Derive da EF. Copie arquivos neutros sem modificá-los quando possível e troque
a integração por `@elyum/express` e middleware Express.

### EN — Express nativo

Derive da FN. Copie arquivos neutros sem modificá-los quando possível e troque
a integração por Express idiomático.

Registre em `applications/manifest.json`:

- origem de cada variante;
- mapeamento de arquivos semanticamente correspondentes;
- arquivos neutros esperados como idênticos;
- arquivos específicos do framework;
- dependências proibidas por variante.

Porta de saída: cada aplicação inicia isoladamente e passa seus testes locais.

## Fase 5 — Suíte externa de aceitação

Crie uma factory de alvo que receba a variante e devolva URL ou instância
injetável. Execute exatamente a mesma matriz contra EF, FN, EE e EN.

Cobrir no mínimo:

- health;
- criação e listagem de produtos;
- duplicidade de produto;
- criação, leitura e listagem de pedidos;
- produto inexistente;
- autenticação demonstrativa;
- transições válidas e inválidas;
- validação de body e params;
- formato de erros conhecidos;
- erro desconhecido delegado ao pipeline nativo;
- preview sem persistência;
- relógio, IDs e estado reiniciáveis.

As asserções não podem desviar por variante, salvo diferenças nativas não
observáveis no contrato e explicitamente justificadas.

Porta de saída: 100% da matriz passa nas quatro variantes.

## Fase 6 — Ferramentas de avaliação

Implemente scripts separados para:

1. validar imports proibidos e independência entre aplicações;
2. calcular hashes dos arquivos neutros;
3. coletar `git diff --numstat` sob uma raiz de tratamento;
4. contar SLOC de produção e testes separadamente;
5. classificar arquivos por componente usando manifesto versionado;
6. comparar EF→EE e FN→EN por mapeamento de arquivos;
7. salvar JSON bruto sem interpretação automática favorável ou desfavorável.

Todo relatório deve registrar commit, versões, sistema e data. Não calcular um
índice composto de modificabilidade.

## Fase 7 — Harness de benchmark

O gerador de carga deve rodar fora do processo do servidor. Parametrize:

- variante;
- endpoint B1, B2 ou B3;
- aquecimento;
- duração;
- concorrência;
- repetições;
- timeout;
- payload e seed.

Salvar dados brutos por execução. Alternar ou randomizar a ordem dos
tratamentos e reiniciar o servidor entre repetições independentes.

Não escolher parâmetros finais sem piloto. Não executar benchmark oficial no
CI compartilhado.

## Fase 8 — Congelamento

Antes de cenários e coleta final:

1. revisar equivalência;
2. registrar versões;
3. revisar manifestos;
4. rodar CI completo;
5. criar tag `evaluation-baseline-v1`;
6. preencher SHA no protocolo;
7. impedir correções silenciosas no baseline.

## Fase 9 — Preparação e entrega de M1, M2 e M3 para execução humana

Cada combinação parte diretamente da tag:

```text
evaluation/m1-elyum-fastify
evaluation/m1-fastify-native
evaluation/m2-elyum-fastify
evaluation/m2-fastify-native
evaluation/m3-elyum-fastify
evaluation/m3-fastify-native
```

O Codex pode preparar, antes do início da execução medida:

1. branches limpas apontando exatamente para a tag;
2. especificações congeladas e testes de aceitação já aprovados;
3. comandos documentados para executar aceitação, regressão e coleta;
4. formulário de registro de início, pausas, consultas e término;
5. verificação de que a árvore de trabalho está limpa.

Em seguida, o Codex deve encerrar sua participação na implementação. O autor
implementará cada requisito, executará os testes e produzirá o commit final de
cada branch sem geração ou reescrita direta de código por IA.

Somente depois de o autor informar que o commit final foi congelado, o Codex
poderá executar os scripts determinísticos de coleta em modo somente leitura e
arquivar as saídas brutas. Se os testes falharem, deve registrar a falha sem
corrigir ou sugerir a solução do patch.

## Fase 10 — Portabilidade e desempenho

Para P1, compare EF→EE e FN→EN usando manifesto, hashes, diff por arquivo e
inspeção qualitativa. Não confunda mudança inevitável de integração com falha de
portabilidade.

Para desempenho, compare somente pares com o mesmo host:

- EF versus FN;
- EE versus EN.

Execute piloto, congele parâmetros e somente depois faça a coleta final.

## Definition of done

- ADR Express aceito;
- `@elyum/express` testado com Express real;
- quatro variantes independentes;
- zero imports proibidos;
- suíte comum integralmente verde;
- CI do monorepo verde;
- baseline tagueado e documentado;
- M1, M2 e M3 implementados pelo autor sem geração direta de código por IA;
- log de uso de IA atualizado e coerente com os commits;
- scripts geram dados auditáveis;
- nenhum resultado ou conclusão inventado;
- README permite que outra pessoa reproduza build, teste e execução.

## Estratégia para o prazo de um mês

### Semana 1

- ADR Express;
- adapter Express mínimo;
- renomeação do pacote;
- consolidação de EF.

### Semana 2

- FN, EE e EN;
- suíte externa de aceitação;
- equivalência e baseline.

### Semana 3

- execução humana de M1, M2 e M3, sem geração direta de código por IA;
- piloto e coleta final dos benchmarks;
- coleta da portabilidade.

### Semana 4

- validação dos dados;
- tabelas e gráficos;
- redação de arquitetura, resultados, discussão, ameaças e conclusão;
- revisão com orientador.

Se houver atraso, preserve nesta ordem: equivalência, P1, M1–M3, B1–B2. B3 e
análises secundárias são os primeiros itens a serem reduzidos; nunca reduza a
correção ou a rastreabilidade dos dados.
