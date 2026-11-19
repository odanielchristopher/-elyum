# Fases 4 e 5 — Construção e validação do baseline

Data: 19 de novembro de 2026. Branch: `feat/four-apps-baseline`.
Base: `305798d1a062e92107e4b6b20b6c1cb7a2989d21`, contendo a correção de
confidencialidade de validação. Revisão final do autor e revisão do orientador
permanecem pendentes. Este relatório registra implementação e testes funcionais;
nenhum resultado experimental foi produzido.

## Commits e proveniência

| Commit    | Incremento                                                               |
| --------- | ------------------------------------------------------------------------ |
| `818d7df` | Pacote de referência e contratos/protocolo versionados                   |
| `cbed116` | Movimento estrutural de EF, fontes preservados e hashes registrados      |
| `003c269` | Ciclo de vida EF e dependências substituíveis                            |
| `eb4fbbc` | Adequação funcional inicial de EF ao baseline                            |
| `a4b6c4e` | FN, entrypoints compilados e matriz HTTP inicial                         |
| `02180be` | EE derivada de EF                                                        |
| `a80cf10` | EN derivada de FN                                                        |
| `d6b6830` | Suíte compartilhada e equivalência B1–B3                                 |
| `c8672d8` | Auditoria de dependências, manifestos, testes dos verificadores e README |

Os quatro primeiros commits já existiam antes da última continuação. Este
relatório e a atualização das specs/log constituem o commit documental final.
Não houve squash, merge ou tag.

## Estrutura entregue

Todas as raízes abaixo ficam em `packages/evaluation/applications`:

| Tratamento | Raiz                 | Arquivos de produção | Composição e integração                   |
| ---------- | -------------------- | -------------------: | ----------------------------------------- |
| EF         | `elyum-fastify/src`  |                   41 | Elyum DI/controllers e Fastify nativo     |
| FN         | `fastify-native/src` |                   40 | Composição manual e handlers Fastify      |
| EE         | `elyum-express/src`  |                   41 | Elyum DI/controllers e middleware Express |
| EN         | `express-native/src` |                   40 | Composição manual e handlers Express      |

Cada árvore possui domínio, portas/casos de uso, infraestrutura em memória,
schemas Zod, apresentação e composição/lifecycle próprios. EF/EE mantêm
controllers neutros copiados; FN/EN usam Zod diretamente e não reproduzem
reflection, decorators ou um container. A composição e os handlers HTTP nativos
são explícitos. Nenhum pacote central do Elyum foi alterado nesta execução.

Os componentes fisicamente compartilhados são somente testes externos, fixtures,
cliente `fetch`, scripts e manifestos. O cliente compartilhado não implementa
roteamento, validação, serialização de produção ou uma camada HTTP das aplicações.
Cada tratamento importa apenas sua própria produção e seus pacotes permitidos.

Os oito endpoints, seed e regras observáveis seguem os contratos v2. Cada
`src/index.ts` expõe `startApplication({ host, port, logger, clock?, idGenerator? })`
com `{ baseUrl, close }`, além do builder nativo para testes locais. Entrypoints
CLI aceitam `HOST`/`PORT` e encerram em SIGINT/SIGTERM.

## Suíte e cobertura de contratos

A suíte compartilhada acessa exclusivamente os entrypoints públicos compilados e
HTTP real em `127.0.0.1`, com porta efêmera, estado novo e `close()` em `finally`.
Ela não importa controllers, casos de uso ou frameworks HTTP. O build prévio
exercita os metadados de construtor emitidos pelo `tsc` em EF/EE, sem acrescentar
metadata artificial à produção.

| Grupo                                 |                                         Quantidade |
| ------------------------------------- | -------------------------------------------------: |
| Contrato v2 comum                     |                    82 por tratamento; 328 no total |
| Matriz HTTP inicial comum             |                      3 por tratamento; 12 no total |
| Equivalência de corpo bruto B1–B3     | 3 testes, cada um executado nos quatro tratamentos |
| Testes locais EF existentes/evoluídos |      22: 15 de domínio/aplicação e 7 de integração |
| Verificador de limites de dependência |                                                 17 |
| Verificador de manifestos             |                                                  3 |

Cada tratamento passou em 85 testes comuns. A suíte externa totaliza 343 testes;
o pacote de avaliação tem 365 testes Vitest e 20 testes dos verificadores Node.
O monorepo totaliza 658 testes Vitest e esses 20 testes Node: 678 aprovados.

A matriz cobre:

- health constante e ausência de chamadas a relógio/gerador nesse endpoint;
- catálogo completo, criação de produtos, normalização, limites de campos,
  unicidade por nome e descarte de campos desconhecidos;
- criação, leitura e listagem de pedidos, preços do catálogo, linhas repetidas,
  preservação da ordem dos itens e comparação de listas por identidade;
- validação de body/params, erros únicos/múltiplos e ordem normativa dos itens;
- preview oficial, total, ausência de persistência e consumo zero de relógio/ID;
- produtos/pedidos ausentes, invariável de domínio e transições válidas/inválidas;
- relógio/IDs determinísticos, defaults reais, reinicialização de estado e
  liberação da porta ao encerrar;
- headers e media type normativos, erro inesperado no pipeline nativo, status e
  header de rota ausente/JSON malformado;
- corpo bruto, status e headers normativos idênticos para B1, B2 e B3.

Mensagens de erros fora de B3 são exigidas como texto, mas não comparadas. B3 é
comparado integralmente e só contém `field`, `code`, `message` por item. Corpos de
erros nativos explicitamente excluídos não são forçados a ter equivalência.

## Manifestos e verificações de imports

Em `packages/evaluation/manifests`:

- `applications.json`: inventário por tratamento, pacotes permitidos e
  dependências externas efetivamente importadas; produção compartilhada vazia;
- `component-map.json`: responsabilidade, hash SHA-256, mapeamento semântico
  EF→EE/FN→EN e dependência transitiva para a fatia P1;
- `provenance.json`: commit/arquivo/hash de origem e cópia/adaptação por arquivo;
- `ef-structural-origin.json`: registro preservado do movimento original.

A fatia usa a dependência estática transitiva a partir de `index.ts`. Módulos de
registro e composição que também atendem rotas fora dela entram inteiros, assim
como suas dependências. O launcher `main.ts` fica fora da fronteira usada pelo
harness. Nenhuma métrica de churn/SLOC ou interpretação de P1 foi calculada.

`check:boundaries` passou e rejeita os casos mínimos solicitados: Elyum nas
nativas, host oposto em cada tratamento, imports de produção entre aplicações,
produção fora da própria raiz, framework na suíte comum e acesso a internals.
O parser cobre import/export, import types, require e import dinâmico; carregamento
não literal é rejeitado. Há um registro auditável de entrypoints literais para o
loader da suíte. Os testes negativos exercitam esses bloqueios.

`check:manifests` passou para inventário, hashes e grafo. Seus testes comprovam
funcionamento sem `.git`, rejeição de bytes divergentes e de dependência removida,
sempre numa cópia temporária. `check:origins` também passou contra o histórico
Git completo. A verificação comum não depende de checkout histórico em CI;
regeneração e auditoria profunda de origem precisam daqueles commits.

## Gates executados

Os incrementos FN, EE, EN e suíte passaram por instalação congelada, regressão,
typechecks, lint/formatação, build e diff check. Checks filtrados foram usados
no desenvolvimento. A árvore de código entregue foi validada integralmente com:

| Comando                                            | Resultado                                       |
| -------------------------------------------------- | ----------------------------------------------- |
| `pnpm install --frozen-lockfile`                   | saída 0                                         |
| `pnpm test:ci`                                     | saída 0; 678 testes, incluindo os verificadores |
| `pnpm typecheck`                                   | saída 0                                         |
| `pnpm typecheck:ts6`                               | saída 0                                         |
| `pnpm ci:lint`                                     | saída 0                                         |
| `pnpm build`                                       | saída 0                                         |
| `pnpm --filter @elyum/evaluation check:boundaries` | saída 0; integrado em test:ci                   |
| `pnpm --filter @elyum/evaluation check:manifests`  | saída 0; integrado em test:ci                   |
| `pnpm --filter @elyum/evaluation check:origins`    | saída 0                                         |
| `git diff --check`                                 | saída 0                                         |

Os testes HTTP foram executados com acesso a portas locais, necessário por causa
da restrição do sandbox. A geração/auditoria histórica dos manifestos também
precisou executar subprocessos Git. Essas permissões não alteraram o escopo.

Ambiente de validação: Node `24.22.2`, pnpm `10.28.2`, Fastify `5.12.3`, Express
`5.3.0`, Zod `4.5.4`, compilador nativo TypeScript `7.0.2` e ponte TypeScript
`6.0.2`. O protocolo de benchmark menciona Node `24.15.0`: não houve execução de
benchmark nem congelamento de ambiente nesta etapa; a diferença está declarada.

## Divergências documentais e decisões

- Autenticação demonstrativa, request context de cenários e escopos genéricos
  citados em documentos anteriores não pertencem a este baseline. O contrato v2,
  o plano da fase 4 e a instrução do autor estabelecem a precedência.
- O ADR recebido em `docs/evaluation` é histórico/proposto. O ADR canônico em
  `docs/adr/ADR-EVAL-001.md` registra aceite do autor e revisão acadêmica pendente.
  Os snapshots em `repository-reference` não substituem as specs atuais.
- O brief histórico contempla métricas, tag e cenários posteriores. O plano desta
  execução limita-se ao baseline, suíte, auditoria e documentação.
- Não restou divergência funcional com precedência indefinida que exigisse uma
  decisão inferida. Specs vivas foram atualizadas para refletir a entrega.
- Express usa sua opção nativa `json({ strict: false })` para permitir que JSON
  bem formado chegue à mesma fronteira Zod. A suíte revelou e protege essa
  diferença; JSON malformado continua tratado no pipeline nativo.
- Os testes carregam o build real para preservar metadata de EF/EE. A matriz
  inicial foi introduzida junto com FN e ampliada depois, mantendo a validação
  incremental pedida nas continuações do autor.
- As dependências Express adicionadas reutilizam versões existentes no monorepo.
  A resolução offline tentou remover opcionais não relacionados; esse resultado
  foi descartado e o lockfile foi regenerado pelo pnpm preservando-os. As
  dependências Yup, sem uso nas quatro aplicações, foram retiradas da avaliação.
- Não foram criadas pastas vazias de benchmark/resultados nem um harness de carga.
  O inventário está nos três manifestos definidos pelo plano mais recente.

## Limites e próxima revisão

O [README do pacote](../../../packages/evaluation/README.md) contém comandos de
reprodução. O baseline funcional está pronto para revisão humana, sem pendência
de implementação desta etapa. Manifestos e escolhas de fronteira continuam
revisáveis antes de qualquer coleta. Aceite acadêmico e freeze definitivo não
são presumidos por testes verdes.

Não foram produzidos resultados experimentais, execução oficial de benchmark,
patches M1–M3, mudança experimental medida P1, tags ou merge na main. Não há
alegação de ganho de desempenho, portabilidade ou produtividade neste relatório.
