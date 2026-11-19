# Plano e prompt para o Codex — baseline experimental do Elyum

## Objetivo desta execução

Construir e validar as quatro aplicações equivalentes do baseline e a suíte
externa compartilhada, conforme:

- `docs/evaluation/evaluation-contracts-v2.md`;
- `docs/evaluation/evaluation-protocol-v0.2.md`;
- `docs/adr/ADR-EVAL-001.md`;
- `docs/adr/ADR-EXPRESS-001.md`;
- as specs do repositório e `AGENTS.md`.

Esta execução cobre somente a preparação documental restante, Fase 4 e Fase 5.
Não cobre métricas, benchmark oficial, tag, M1–M3 ou interpretação.

## Fronteiras obrigatórias

- Não implementar, esboçar, antecipar ou deixar TODOs de M1, M2 ou M3.
- O baseline não possui autenticação, papéis, `cancellation.reason` nem
  `X-Request-Id`.
- Não criar soluções que reduzam artificialmente o patch futuro dos cenários.
- Nenhuma aplicação nativa importa `@elyum/*`.
- Nenhuma aplicação importa produção de outra aplicação.
- Zod pode ser dependência comum de instalação, mas o código de validação de
  FN/EN usa Zod diretamente.
- FN/EN usam composição manual, sem container DI externo.
- Fastify/Express permanecem responsáveis por routing e lifecycle nativo.
- Não gerar resultados experimentais nem alegações de desempenho/portabilidade.
- Não criar `evaluation-baseline-v1` nesta execução.

## Estrutura-alvo

```text
packages/evaluation/
  applications/
    elyum-fastify/
    fastify-native/
    elyum-express/
    express-native/
  tests/
    acceptance/
    equivalence/
    helpers/
    fixtures/
  manifests/
    applications.json
    component-map.json
    provenance.json
  scenarios/
  scripts/
  results/
  package.json
```

`benchmarks/`, scripts de coleta e results podem receber apenas diretórios
documentados ou `.gitkeep` se estritamente necessário; nenhum harness ou dado
oficial deve ser produzido agora.

## Sequência de trabalho

### 0. Diagnóstico e plano

1. Confirmar branch limpa e base atual de `main`.
2. Ler integralmente todas as fontes listadas.
3. Apresentar plano por arquivos e dependências antes de editar.
4. Identificar qualquer conflito entre contrato, código e specs.
5. Parar se houver decisão funcional não definida; não decidir por inferência.

### 1. Versionar contratos

Adicionar os dois documentos recebidos em `docs/evaluation/`, corrigindo apenas
links relativos. Atualizar o log de IA e status do brief. Commit documental
independente.

### 2. Reorganizar EF sem comportamento novo

Mover a aplicação atual para `applications/elyum-fastify` preservando bytes
quando possível. Ajustar build/testes/configuração sem adicionar endpoints.
Registrar hashes e origem. Commit exclusivamente estrutural.

### 3. Adequar EF ao baseline v2

Implementar somente capacidades do baseline:

- seed fixo;
- `/health`;
- `/orders/preview`;
- `X-Request-Source` por hook Fastify;
- injeção opcional de clock/ID;
- `startApplication()` com porta efêmera e shutdown;
- contratos e erros definidos.

Remover a autenticação demonstrativa existente, pois M2 a introduzirá depois.
Não deixar infraestrutura de autenticação dormente.

### 4. Construir FN

Criar a aplicação Fastify nativa a partir da decomposição semântica de EF:

- Zod direto;
- composição manual;
- hooks Fastify nativos;
- sem decorators, reflect-metadata, container ou imports Elyum;
- mesmo comportamento observável;
- produção fisicamente independente.

### 5. Construir EE

Derivar de EF com origem e hashes registrados. Preservar código neutro quando
possível e substituir integração Fastify por `@elyum/express` e middleware
Express nativo. Controllers neutros devem ser copiados sem alterações quando o
contrato permitir; não forçar identidade artificial.

### 6. Construir EN

Derivar de FN, preservar código neutro e substituir Fastify por Express nativo.
Usar Zod direto, composição manual e middleware Express. Sem imports Elyum.

### 7. Suíte externa e equivalência

- Usar HTTP real em `127.0.0.1` e porta efêmera.
- Consumir somente `startApplication()`.
- Executar a mesma matriz em EF, FN, EE e EN.
- Não usar condicionais que relaxem expectativas para um tratamento.
- Comparar listas sem ordem; preservar ordem de itens de pedido/preview.
- Comparar erros/headers conforme o contrato.
- Verificar corpos brutos idênticos para B1–B3.
- Isolar e encerrar cada instância mesmo em falha.
- Manter testes locais específicos quando necessário, sem substituir a suíte
  externa.

### 8. Manifestos e auditoria

Registrar antes de qualquer resultado experimental:

- aplicação e host;
- origem EF→EE e FN→EN;
- mapeamento semântico por arquivo;
- responsabilidade arquitetural;
- hashes iniciais;
- arquivos pertencentes à fatia P1;
- justificativa de inclusão transitiva;
- imports proibidos.

Criar check automatizado que falha se FN/EN importarem `@elyum/*` ou se houver
imports de produção entre aplicações.

## Commits sugeridos

1. `docs(evaluation): add baseline contracts and protocol v0.2`
2. `refactor(evaluation): move current app to elyum-fastify`
3. `feat(evaluation): complete elyum-fastify baseline`
4. `feat(evaluation): add native fastify baseline`
5. `feat(evaluation): add elyum express baseline`
6. `feat(evaluation): add native express baseline`
7. `test(evaluation): add shared acceptance and equivalence suite`
8. `docs(evaluation): record phase 4 and 5 evidence`

Não esmagar os commits: a sequência é evidência de proveniência.

## Gates

Executar ao final de cada commit aplicável e integralmente na entrega:

```text
pnpm install --frozen-lockfile
pnpm test:ci
pnpm typecheck
pnpm typecheck:ts6
pnpm ci:lint
pnpm build
git diff --check
```

Adicionar gates filtrados do pacote quando úteis. Não silenciar, pular ou
relaxar testes. Falhas devem ser corrigidas somente dentro do baseline; se a
correção exigir decisão funcional ausente, parar e consultar o autor.

## Definition of done

- quatro aplicações completas e independentes;
- nenhuma importação proibida;
- mesmos contratos e seed;
- suíte HTTP comum 100% verde;
- B1–B3 com status, headers e corpo bruto equivalentes;
- build e gates root verdes;
- manifestos de origem/componente/P1 revisáveis;
- documentação e log de IA atualizados;
- nenhuma tag, coleta, benchmark oficial ou patch M1–M3 criado.

## Prompt copiável

```text
Execute somente a preparação documental restante, a Fase 4 e a Fase 5 da
avaliação do Elyum.

Leia integralmente AGENTS.md, docs/specs/**, docs/adr/**,
docs/evaluation/evaluation-contracts-v2.md,
docs/evaluation/evaluation-protocol-v0.2.md,
docs/evaluation/codex-evaluation-build-brief.md e o código atual de
packages/evaluation e packages/express.

Antes de editar, confirme working tree limpo, base atual de main e apresente um
plano por arquivos. Se encontrar decisão funcional não definida ou conflito
entre documentos, pare e pergunte; não decida por inferência.

Construa em packages/evaluation quatro árvores de produção independentes:
elyum-fastify, fastify-native, elyum-express e express-native. Todas implementam
o baseline completo do contrato v2. As nativas usam Zod direto e composição
manual e não podem importar @elyum/*. Nenhuma aplicação importa produção de
outra. Compartilhe somente suíte externa, fixtures, clientes HTTP, manifestos e
scripts fora das métricas.

Preserve a proveniência: primeiro mova a aplicação atual para elyum-fastify em
commit estrutural; depois complete EF, construa FN, derive EE de EF e EN de FN,
em commits separados. Registre origem, hashes, mapeamento semântico, componentes
e a dependência transitiva da fatia P1.

A suíte compartilhada deve usar HTTP real em 127.0.0.1 com porta efêmera e
somente o contrato startApplication({host, port, logger, clock?, idGenerator?})
→ {baseUrl, close}. Execute a mesma matriz sem condicionais por tratamento e
verifique os corpos brutos B1–B3.

Não implemente, esboce, sugira, deixe TODOs ou prepare soluções de M1, M2 ou M3.
O baseline não possui autenticação, papéis, cancellation.reason ou
X-Request-Id. Remova a autenticação antiga de EF sem deixar infraestrutura
dormente. Não crie benchmark oficial, resultados, conclusões ou a tag
evaluation-baseline-v1.

Use a sequência de commits e os gates definidos em
docs/evaluation/codex-phase4-implementation-plan.md. Atualize o ai-usage-log e
produza relatórios factuais das Fases 4 e 5, sem alegações experimentais.

Ao final, mostre commits, diff resumido, matriz de testes, gates, desvios,
imports proibidos verificados e git status. Envie apenas uma branch de trabalho;
não faça merge na main, não crie tag e pare para revisão humana.
```
