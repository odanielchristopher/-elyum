# Contratos dos cenários de avaliação do Elyum

## Status

- **Versão:** 2.0
- **Data:** 25 de outubro de 2026
- **Estado:** rascunho consolidado para revisão final do autor; revisão do orientador pendente
- **Escopo:** baseline funcional, M1–M3, P1 e B1–B3
- **Substitui:** decisões funcionais ainda abertas em `evaluation-scenarios-v1.md`
- **Não substitui:** o registro histórico do protocolo 0.1

Este documento congela o comportamento que deve orientar a construção dos quatro
tratamentos. Ele não contém soluções para os patches medidos. Mudanças posteriores
devem receber nova versão, justificativa, data e avaliação do impacto.

## 1. Tratamentos

| ID | Tratamento | Regras de implementação |
| --- | --- | --- |
| EF | Elyum + Fastify | Controllers Elyum, adapter Fastify, validação Elyum/Zod e mecanismos nativos Fastify |
| FN | Fastify nativo | Sem imports `@elyum/*`; Zod direto e composição manual |
| EE | Elyum + Express | Controllers Elyum, adapter Express, validação Elyum/Zod e middleware Express |
| EN | Express nativo | Sem imports `@elyum/*`; Zod direto e composição manual |

As quatro aplicações implementam o baseline completo e mantêm árvores de produção
independentes. Não são permitidos imports de produção entre elas. Podem ser
compartilhados apenas suíte externa, clientes HTTP, fixtures, scripts, schemas de
resultado e documentação, todos fora das métricas das aplicações.

## 2. Contrato operacional comum

Cada variante pode expor um `buildApplication()` nativo, mas deve fornecer:

```ts
type RunningApplication = {
  baseUrl: string;
  close(): Promise<void>;
};

startApplication({
  host: '127.0.0.1',
  port: 0,
  logger: false,
  clock?,
  idGenerator?,
}): Promise<RunningApplication>;
```

- A suíte compartilhada usa HTTP real em `127.0.0.1` e porta efêmera.
- Cada teste cria estado novo e encerra a aplicação em `finally`.
- `clock` e `idGenerator` são substituíveis nos testes.
- Quando omitidos, usam `SystemClock` e UUID aleatório.
- Logging permanece desabilitável e fica desligado em testes e benchmarks.
- Não se adiciona no baseline um gerador de request ID; isso pertence a M3.

## 3. Regras HTTP comuns

Todas as respostas do baseline, inclusive erros da aplicação, contêm:

```http
X-Request-Source: evaluation
```

- EF/FN implementam o header por hook nativo Fastify.
- EE/EN implementam o header por middleware nativo Express.
- A suíte compara `Content-Type` normalizado, `X-Request-Source` e headers
  explicitamente definidos pelos cenários.
- Para JSON, exige-se media type `application/json`; diferenças irrelevantes de
  capitalização ou parâmetros são normalizadas.
- Erros nativos do host, como rota inexistente e JSON malformado, ficam fora da
  equivalência obrigatória de corpo. Seu status é registrado.
- Erros conhecidos da aplicação exigem o mesmo status e `code`. `message` é
  obrigatória, mas não é comparada, salvo no payload oficial de B3.
- Erros de validação exigem mesmo status, `code`, quantidade e ordem de itens,
  além dos mesmos `field` e `code` por item. As mensagens não são normativas,
  salvo em B3.
- Campos desconhecidos de payload são descartados, preservando o comportamento
  atual.
- A ordem de `GET /products` e `GET /orders` não integra o contrato. A suíte
  compara itens por identidade.
- A ordem dos itens de pedido e preview preserva a ordem da entrada.

## 4. Seed fixo

Toda aplicação inicia com estes produtos:

| ID | Nome | Descrição | `priceInCents` | `createdAt` |
| --- | --- | --- | ---: | --- |
| `11111111-1111-4111-8111-111111111111` | Mechanical Keyboard | Mechanical keyboard | 25000 | `2026-01-01T00:00:00.000Z` |
| `22222222-2222-4222-8222-222222222222` | Wireless Mouse | Wireless mouse | 10000 | `2026-01-01T00:00:00.000Z` |
| `33333333-3333-4333-8333-333333333333` | Monitor | 24-inch monitor | 90000 | `2026-01-01T00:00:00.000Z` |

O seed é parte do estado observável: aparece em `GET /products` e participa da
regra de unicidade case-insensitive por nome. Novas instâncias reiniciam o estado.

## 5. Baseline funcional

Todas as rotas são públicas no baseline.

| Método e rota | Status principal | Comportamento |
| --- | ---: | --- |
| `GET /health` | 200 | Retorna JSON estático do pipeline mínimo |
| `POST /products` | 201 | Cria produto com ID e data gerados |
| `GET /products` | 200 | Lista seed e produtos criados |
| `POST /orders` | 201 | Precifica pelo catálogo e persiste pedido pendente |
| `GET /orders` | 200 | Lista pedidos |
| `GET /orders/:id` | 200 | Obtém pedido |
| `PATCH /orders/:id/status` | 200 | Confirma ou cancela pedido pendente |
| `POST /orders/preview` | 200 | Valida e calcula sem persistir, gerar ID ou consultar relógio |

### 5.1 Health

```json
{"status":"ok","version":"0.1.0"}
```

O corpo é constante. A rota não usa autenticação, validação, repositório,
relógio, geração de ID ou estado mutável.

### 5.2 Produtos

Entrada de criação:

```json
{
  "name": "Desk Lamp",
  "description": "Adjustable desk lamp",
  "priceInCents": 15000
}
```

Regras preservadas:

- `name`: string, `trim`, 1 a 100 caracteres;
- `description`: string com até 255 caracteres; vazia é permitida e a entidade
  remove espaços periféricos;
- `priceInCents`: inteiro positivo;
- nomes duplicados são comparados sem diferenciar maiúsculas/minúsculas e
  retornam `409 / PRODUCT_ALREADY_EXISTS`.

Resposta de produto:

```json
{
  "id": "44444444-4444-4444-8444-444444444444",
  "name": "Desk Lamp",
  "description": "Adjustable desk lamp",
  "priceInCents": 15000,
  "createdAt": "2026-02-01T12:00:00.000Z"
}
```

### 5.3 Pedidos

Entrada de criação:

```json
{
  "customerId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "items": [
    {
      "productId": "11111111-1111-4111-8111-111111111111",
      "quantity": 2
    }
  ]
}
```

Regras:

- `customerId` e `productId` são UUIDs;
- `items` contém ao menos um item;
- `quantity` é inteiro positivo;
- preços sempre vêm do catálogo;
- itens repetidos permanecem linhas independentes e não são agregados;
- produto ausente retorna `404 / PRODUCT_NOT_FOUND`;
- pedido ausente retorna `404 / ORDER_NOT_FOUND`;
- pedido novo tem `status: "pending"`;
- resposta inclui `id`, `customerId`, `items`, `status`, `createdAt` e
  `totalInCents`.

No baseline, atualização aceita somente:

```json
{"status":"confirmed"}
```

ou:

```json
{"status":"cancelled"}
```

Somente pedidos pendentes podem mudar. Nova transição retorna
`409 / INVALID_ORDER_STATUS_TRANSITION`.

### 5.4 Preview e B2

Payload oficial:

```json
{
  "customerId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "items": [
    {"productId":"11111111-1111-4111-8111-111111111111","quantity":2},
    {"productId":"22222222-2222-4222-8222-222222222222","quantity":3},
    {"productId":"33333333-3333-4333-8333-333333333333","quantity":1}
  ]
}
```

Resposta oficial:

```json
{
  "customerId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "items": [
    {"productId":"11111111-1111-4111-8111-111111111111","quantity":2,"unitPriceInCents":25000},
    {"productId":"22222222-2222-4222-8222-222222222222","quantity":3,"unitPriceInCents":10000},
    {"productId":"33333333-3333-4333-8333-333333333333","quantity":1,"unitPriceInCents":90000}
  ],
  "totalInCents": 170000
}
```

Não há `id`, `createdAt`, `status` ou persistência.

### 5.5 B3

Payload oficial:

```json
{
  "customerId": "invalid-customer-id",
  "items": [
    {"productId":"invalid-product-id","quantity":0}
  ]
}
```

Resposta `400` integralmente congelada:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed with 3 errors",
  "errors": [
    {"field":"customerId","code":"invalid_format","message":"Invalid customer ID."},
    {"field":"items.0.productId","code":"invalid_format","message":"Invalid product ID."},
    {"field":"items.0.quantity","code":"too_small","message":"Quantity must be a positive integer."}
  ]
}
```

Para B1, B2 e B3, o corpo bruto, o status e os headers normativos devem ser
idênticos entre tratamentos para não confundir custo com tamanho de resposta.

## 6. M1 — Cancelamento justificado

### Requisito

O corpo de cancelamento passa a ser:

```json
{
  "status": "cancelled",
  "cancellation": {
    "reason": "Customer requested cancellation"
  }
}
```

- `reason` sofre `trim` e é validado entre 10 e 200 caracteres;
- ausência, `null`, string vazia, somente espaços e limites inválidos retornam
  `400 / VALIDATION_ERROR`;
- `cancellation` é proibido quando `status` é `confirmed`, inclusive com
  `null` ou string vazia;
- pedido cancelado retorna `cancellation: { reason }` no PATCH, GET individual e
  listagem;
- pedidos `pending` e `confirmed` omitem `cancellation`;
- a justificativa armazenada é imutável;
- a entidade protege a invariável mesmo fora do caminho HTTP;
- regras anteriores de transição permanecem.

### Aceitação mínima

1. cancelar com 10 e com 200 caracteres após `trim`;
2. persistir o texto normalizado;
3. rejeitar ausência, `null`, vazio, espaços, 9 e 201 caracteres;
4. rejeitar `cancellation` em confirmação;
5. confirmar sem `cancellation`;
6. retornar a justificativa em consulta/listagem;
7. preservar `409 / INVALID_ORDER_STATUS_TRANSITION` em nova transição;
8. obter comportamento equivalente em EF e FN.

## 7. M2 — Introdução de autenticação e autorização por papel

M2 introduz autenticação e autorização; o baseline não possui autenticação.

Credenciais exatas:

- `Bearer customer-token`;
- `Bearer admin-token`.

| Rota | Público | Customer | Admin |
| --- | :---: | :---: | :---: |
| `GET /health` | ✓ | ✓ | ✓ |
| `GET /products` | ✓ | ✓ | ✓ |
| `POST /orders/preview` | ✓ | ✓ | ✓ |
| `POST /products` | — | — | ✓ |
| `POST /orders` | — | ✓ | ✓ |
| `GET /orders` | — | ✓ | ✓ |
| `GET /orders/:id` | — | ✓ | ✓ |
| `PATCH /orders/:id/status` | — | — | ✓ |

- Em rota pública, token inválido é ignorado.
- Em rota protegida, credencial ausente ou inválida retorna
  `401 / UNAUTHORIZED`.
- Customer autenticado sem permissão retorna `403 / FORBIDDEN`.
- A política usa hooks nativos Fastify em EF e FN.
- A política não é duplicada dentro de domínio ou casos de uso.
- `X-Request-Source: evaluation` permanece em todas as respostas.

M2 mede a introdução completa de autenticação e autorização, e não apenas a
evolução de um autenticador preexistente. Essa amplitude deve aparecer na análise.

## 8. M3 — Correlação e contexto da requisição

- `X-Request-Id` fornecido deve ser UUID válido.
- Ausência gera UUID novo por gerador específico de request IDs.
- Valor vazio, malformado ou inválido retorna `400 / VALIDATION_ERROR`.
- No erro de ID inválido, um novo UUID válido é gerado para rastrear o próprio
  erro e é devolvido em `X-Request-Id`.
- O mesmo ID aparece nas respostas de sucesso e erro.
- O ID fica disponível durante a execução de serviço/caso de uso sem ser
  transportado manualmente por todas as assinaturas intermediárias.
- O gerador é substituível nos testes, mas não existe no baseline.
- Requisições simultâneas não podem contaminar seus contextos.
- `X-Request-Source` continua presente.

A suíte HTTP comum verifica preservação, geração, erro e concorrência. Cada
tratamento adiciona teste de integração próprio demonstrando acesso ao mesmo ID
durante a execução de um caso de uso. A implementação interna pode variar; a
propriedade observada deve ser equivalente.

## 9. P1 — Portabilidade da fatia vertical

Pares:

- EF → EE;
- FN → EN.

Fatia medida:

```text
GET  /health
POST /orders/preview
POST /orders
GET  /orders
GET  /orders/:id
```

Todas as aplicações continuam implementando o baseline completo. Para P1,
entram os arquivos e componentes da dependência transitiva real da fatia,
inclusive arquivos compartilhados com rotas fora dela. O manifesto registra
mapeamento semântico, origem, hash, componente e regra de inclusão.

Métricas:

- SLOC e percentual preservado sem alteração;
- arquivos preservados, alterados, adicionados e removidos;
- churn total e por componente;
- imports de framework removidos/adicionados;
- componentes obrigatoriamente reescritos;
- glue code;
- correção na suíte comum.

P1 é uma comparação estrutural de artefatos construídos com assistência de IA,
não uma medida de tempo ou produtividade humana. A conclusão limita-se à
portabilidade da fatia vertical selecionada.

## 10. Regras de prontidão

Nenhum cenário medido começa antes de:

- revisão humana deste contrato;
- implementação e equivalência das quatro aplicações;
- suíte comum integralmente verde;
- ferramentas de métricas validadas em patch piloto descartável;
- protocolo e ambiente congelados;
- tag `evaluation-baseline-v1` criada e registrada;
- política de IA aceita;
- revisão do orientador registrada ou pendência declarada de forma explícita.
