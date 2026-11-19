# ADR-EVAL-001 — Organizar quatro aplicações independentes para avaliação

- Status: aceito pelo autor do projeto; revisão do orientador pendente
- Data: 25 de outubro de 2026
- Decisor do projeto: autor do TCC
- Revisão acadêmica: orientador, ainda pendente; não há aprovação do orientador registrada
- Escopo: artefatos experimentais e organização do monorepo

## Contexto

O Elyum pretende adicionar estrutura a aplicações HTTP sem substituir o modelo
mental do framework hospedeiro. A avaliação deve distinguir o efeito do Elyum
das diferenças inerentes entre Fastify e Express.

No diagnóstico que motivou esta decisão, o repositório possuía
`packages/examples`, contendo uma aplicação Elyum/Fastify e nenhum adapter
Express. O nome genérico e a ausência dos tratamentos de controle motivaram
a estrutura-alvo abaixo.

Posteriormente, `packages/express` foi implementado, validado localmente e
integrado no commit `a1175d5b80c2efff070a5c61ac818ba38e04c192`, conforme
[ADR-EXPRESS-001](./ADR-EXPRESS-001.md) e
[relatório da Fase 2](../evaluation/reports/phase-2-implementation-report.md).
O autor aceita esta decisão de organização do projeto; isso não representa
aprovação do orientador nem conclusão dos quatro tratamentos experimentais.

A avaliação precisa suportar:

1. cenários de mudança comparando Elyum/Fastify e Fastify nativo;
2. troca Fastify→Express com e sem Elyum;
3. benchmarks pareados dentro de Fastify e dentro de Express;
4. suíte observável comum e coleta reproduzível;
5. prazo aproximado de um mês até a defesa.

## Drivers

- equivalência funcional verificável;
- isolamento do efeito do Elyum;
- patches e diretórios mensuráveis;
- reprodutibilidade;
- uso idiomático de Fastify e Express;
- ausência de dependências externas que ocultem o overhead;
- escopo implementável no prazo;
- reaproveitamento real do adapter Express em outro trabalho acadêmico.

## Decisão

### 1. Adapter Express

Criar `packages/express` como pacote publicável `@elyum/express`.

Ele deve depender de `@elyum/http`, `@elyum/core` apenas quando necessário e
Express como peer/runtime dependency apropriada. Express não pode entrar em
`@elyum/core` nem `@elyum/http`.

Antes de fixar a API pública, criar um ADR específico para:

- forma de instalação;
- composição com `app.get`, `app.post` e `Router`;
- ordem de middleware;
- tratamento de erros;
- resolução de controllers;
- acesso a request/response nativos;
- propriedade e ciclo de vida do container.

O adapter não cria um roteador concorrente. Express continua responsável por
registro, matching, middleware e ciclo do servidor.

### 2. Pacote privado de avaliação

A decisão de renomear o antigo `packages/examples` para `packages/evaluation`,
privado `@elyum/evaluation`, foi executada na Fase 3. A aplicação atual permanece
com a organização interna original; a estrutura-alvo abaixo não foi criada.
Consultar o [relatório da Fase 3](../evaluation/reports/phase-3-package-rename.md).

Estrutura-alvo:

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
  benchmarks/
  scenarios/
  scripts/
  results/
  package.json
```

Os nomes podem receber um nível `src/` se isso simplificar o TypeScript, desde
que cada aplicação mantenha uma raiz inequívoca para medição.

### 3. Independência de produção

Cada aplicação contém sua própria cópia do código de produção. Não são
permitidos imports de produção entre as quatro aplicações.

Isso evita que uma alteração em um módulo compartilhado modifique vários
tratamentos simultaneamente e permite medir patches por aplicação. Arquivos
inicialmente equivalentes devem ser copiados de uma origem declarada e podem
ser comparados por hash e por mapeamento semântico.

Somente os seguintes artefatos podem ser compartilhados:

- suíte externa de aceitação;
- fixtures e clientes HTTP de teste;
- scripts de coleta;
- gerador de carga;
- schemas de relatório;
- documentação do protocolo.

Esses itens ficam fora das métricas das aplicações.

### 4. Formação dos tratamentos

- EF é a evolução da aplicação atual.
- FN é implementada diretamente com Fastify, sem importar `@elyum/*`.
- EE é derivada de EF, preservando arquivos neutros quando possível e
  substituindo a integração Fastify por `@elyum/express`.
- EN é derivada de FN, preservando arquivos neutros quando possível e
  substituindo a integração Fastify por Express nativo.

As variantes nativas não precisam imitar decorators, reflexão ou DI do Elyum.
Elas devem adotar soluções idiomáticas, mantendo a mesma decomposição semântica
de domínio e aplicação para permitir comparação justa.

### 5. Estudos

- E1: M1, M2 e M3 em EF versus FN.
- E2: P1, comparando EF→EE e FN→EN.
- E3: B1, B2 e B3 em EF versus FN e EE versus EN.

## Alternativas consideradas

### Manter apenas `packages/examples`

Rejeitada porque o nome não comunica a função experimental e a estrutura atual
contém somente um tratamento.

### Criar quatro pacotes de workspace no mesmo nível

Possível, mas rejeitada inicialmente para reduzir configuração duplicada e
manter harness, scripts e resultados sob uma única fronteira privada. Pode ser
reconsiderada se o TypeScript ou os processos isolados ficarem artificiais.

### Compartilhar domínio e casos de uso fisicamente

Rejeitada para a avaliação principal. Embora reduza duplicação, faria uma única
alteração afetar vários tratamentos e impediria medir preservação e churn de
forma independente.

### Comparar apenas aplicações finais sem controles nativos

Rejeitada porque diferenças entre Fastify e Express seriam confundidas com o
efeito do Elyum.

### Introduzir banco de dados

Rejeitada porque latência, driver, pool e ORM ocultariam o custo do pipeline e
aumentariam o escopo dentro do prazo disponível.

## Consequências positivas

- comparação pareada dentro de cada framework;
- portabilidade observável com e sem Elyum;
- patches independentes e auditáveis;
- mesmo adapter Express útil fora do TCC;
- harness centralizado;
- fronteira clara entre produto e experimento.

## Consequências negativas

- duplicação deliberada de código entre aplicações;
- quatro variantes exigem mais manutenção;
- Express amplia implementação e benchmark;
- resultados continuam limitados a uma aplicação e versões específicas;
- a API do adapter Express exigiu uma decisão adicional, registrada em
  ADR-EXPRESS-001 antes da implementação.

## Mitigações

- suíte externa única de aceitação;
- manifesto de equivalência por rota e arquivo;
- geração determinística de fixtures;
- entrega incremental e portas de qualidade por fase;
- congelamento de versões;
- Express adapter mínimo, sem CORS, autenticação própria, servidor próprio ou
  outras conveniências fora do objetivo.

## Critérios de validação acadêmica e experimental ainda pendentes

- orientador aceita a ampliação para portabilidade;
- os quatro tratamentos e três estudos cabem no cronograma;
- nenhuma aplicação nativa importa Elyum;
- todas as variantes passam pela mesma suíte observável;
- scripts conseguem limitar métricas à raiz de uma aplicação.

## Atualização factual — Fases 4 e 5

As quatro árvores de produção e a suíte externa foram implementadas no pacote de
avaliação. O [relatório das Fases 4 e 5](../evaluation/reports/phase-4-and-5-baseline.md)
registra a sequência de commits, manifestos e verificações. A descrição anterior
sobre a estrutura ainda não criada refere-se ao encerramento da Fase 3.
Os contratos v2 regem o baseline; revisão acadêmica, freeze e coleta continuam
separados desta entrega funcional.
