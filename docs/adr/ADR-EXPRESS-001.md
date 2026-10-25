# ADR-EXPRESS-001 — Composição nativa do adapter Express

- Status: **accepted** (primeiro milestone implementado e validado localmente).
- Data: 25 de outubro de 2026.
- Decisor: autor do projeto, com revisão acadêmica quando aplicável.
- Escopo: primeiro milestone de `@elyum/express`.
- Escolhas confirmadas pelo autor: instância nativa enriquecida, ordem livre,
  exatamente um controller, `@Next()` específico do Express e JSON opt-in.
- Decisão: alternativa A, consolidada pelas escolhas do autor nesta discussão.
- Aprovação final: 25 de outubro de 2026, com confirmação da política de erros.
- Implementação: `packages/express`, Express `5.3.0`, tipos Express `5.0.6`.
- Evidências: [relatório da Fase 2](../evaluation/reports/phase-2-implementation-report.md).

## Contexto e referências

O executor e o compilador HTTP são reutilizados pelo novo adapter Express. A API deve
permitir adoção progressiva e remoção compreensível, mantendo roteamento,
middleware e servidor sob propriedade da aplicação.

Fontes: [diagnóstico/plano](../evaluation/reports/phase-0-diagnosis-and-plan.md),
[brief](../evaluation/codex-evaluation-build-brief.md),
[ADR-EVAL-001](ADR-EVAL-001.md),
[cenários](../evaluation/evaluation-scenarios-v1.md),
[visão](../specs/product-vision.md), [HTTP](../specs/http-architecture.md),
[DI](../specs/dependency-injection.md),
[convenções](../specs/project-conventions.md),
[testes](../specs/testing-strategy.md) e
[aplicação](../specs/reference-application.md).

Adota-se Express **5.x** no primeiro milestone; suporte 4.x não é assumido.
Express `5.3.0` e `@types/express` `5.0.6` estão fixados; congelamento do
baseline experimental continua em fase posterior. A integração recebe uma instância existente de `Express` ou `Router`
e devolve a **mesma instância**, enriquecida com `.controller()` e o namespace
`.elyum`: `elyum(appOrRouter, options?)`. `.use()`, `.get()`, `.post()`,
`.listen()` e a natureza callable do Router permanecem nativos, com seus
retornos e tipos preservados. Não há wrapper, Proxy ou alteração de protótipo.

A instalação não sobrescreve propriedades preexistentes `controller`/`elyum`:
colisões devem falhar claramente. Nova chamada sem opções sobre alvo já
instalado reutiliza a instalação; reconfiguração implícita não é permitida.
O adapter não cria Router, servidor, CORS ou logger e não usa estado global.
Parsing JSON é uma conveniência Express explicitamente opt-in, descrita abaixo.

### Significado de preservar o framework nativo

O autor esclareceu que preservar funcionalidades nativas significa manter as
características do microframework escolhido. Não exige escrever `app.get` ou
`app.post` em toda rota Elyum. Assim como `fastify.controller(Controller,
{ onRequest })` registra uma rota por metadata e mantém hooks/plugins,
`elyum(app).controller(...handlers)` pode inferir método e
caminho mantendo o modelo de middleware, Router e pipeline de erros Express.

`app.get`, `app.post`, `app.use`, `Router`, configurações e demais APIs nativas
continuam disponíveis no mesmo alvo. O adapter delega registro e matching ao
Express; não introduz um roteador próprio. Esta interpretação substitui a
restrição excessiva da revisão anterior deste ADR, que descartava o registro
por controller somente por não mostrar `app.post` em cada declaração.

## Alternativa A — integração ligada ao alvo com `.controller()`

API principal confirmada:

```ts
import elyum from '@elyum/express';

const app = elyum(express(), { json: { limit: '1mb' } });
const routes = elyum(Router());
routes.controller(authenticate, HealthCheckController, renderHealth);
app.use('/api', routes);
```

`controller(...handlers)` recebe uma sequência plana de middleware Express e
**exatamente uma classe de controller**, em qualquer posição. Durante o
registro, identifica a classe pela metadata de rota e valida a declaração;
zero ou múltiplos controllers são erros de configuração. Compila essa classe
e substitui somente sua posição pelo handler do adapter. Demais funções
permanecem na posição original, sem ordenação automática.

Por exemplo, `routes.controller(authenticate, HealthController, render)`
com metadata `@Get('/health')` registra semanticamente
`router.get('/health', authenticate, compiledHandler, render)`. O controller
não precisa ser último. Não se emite aviso apenas por haver middleware depois
dele: `@Next()` permite continuação intencional. Nenhum logger é introduzido.

Os middleware são funções nativas; não se cria pipeline concorrente nem hook
universal Elyum. Middleware de erro continua sendo registrado nativamente via
`.use()`. O retorno de `.controller()` é o próprio alvo enriquecido, permitindo
encadeamento com métodos Express. O import `elyum` é a factory: `.use()` é
chamado na instância retornada, não na factory.

Exemplo completo de aplicação com a API implementada, sem imports locais omitidos:

```ts
import 'reflect-metadata';

import elyum, { Next } from '@elyum/express';
import { Body, Get, Post, Response, UnauthorizedException } from '@elyum/http';
import express, {
  Router,
  type NextFunction,
  type RequestHandler,
  type Response as ExpressResponse,
} from 'express';

@Get('/health')
class HealthCheckController {
  execute(@Response() response: ExpressResponse, @Next() next: NextFunction) {
    response.locals.health = { status: 'ok' };
    next();
  }
}

@Post('/echo')
class EchoController {
  async execute(@Body() body: unknown) {
    return { received: body };
  }
}

const authenticate: RequestHandler = (request, _response, next) => {
  if (request.headers.authorization !== 'Bearer demo-token') {
    next(new UnauthorizedException('Provide the demonstration token.'));
    return;
  }
  next();
};

export function buildApplication() {
  const app = elyum(express(), { json: { limit: '1mb' } });
  const routes = elyum(Router());
  const renderHealth: RequestHandler = (_request, response) => {
    response.json(response.locals.health);
  };

  app.controller(HealthCheckController, renderHealth);
  routes.controller(authenticate, EchoController);
  routes.use(routes.elyum.errorHandler());
  app.use('/api', routes);

  app.get('/native', (_request, response) => {
    response.json({ source: 'express' });
  });
  app.use(app.elyum.errorHandler());

  return app;
}

export function start(port = Number(process.env.PORT ?? 3000)) {
  const server = buildApplication().listen(port);
  const shutdown = () => server.close();
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}
```

`start()` é chamado pela aplicação, não pelo adapter. O exemplo demonstra a
composição, não define o contrato dos endpoints experimentais. `@Post('/echo')`
é relativo ao Router; `/api` pertence ao mount nativo. Não há normalização ou
inclusão automática do prefixo na metadata. As duas integrações do exemplo
possuem containers independentes; compartilhar providers exige fornecer o
mesmo container explicitamente. O Router instala seu próprio error handler
após suas rotas; o app instala o seu após o mount e as rotas de aplicação.
Health usa deliberadamente `@Next()` para continuar em `renderHealth`; Echo
retorna um corpo e é terminal. `@Next()` torna Health específico de Express,
por isso esse exemplo não deve ser copiado como controller neutro do baseline.

Vantagens: método/caminho inferidos da metadata sem duplicação, uso semelhante
a `fastify.controller`, middleware Express reconhecível na ordem declarada e
suporte a módulos por Router. O registro continua no Express, incluindo ordem,
matching e prefixos. Rotas nativas e Elyum podem coexistir no mesmo alvo.

Custos: a integração adiciona propriedades ao alvo e precisa preservar tipos,
identidade e comportamento Express. Lifetime e compartilhamento de DI devem
ser explícitos. Continuação usa a nova opção neutra do executor; `@Next()` é
exportado pelo pacote Express. A sintaxe não tenta imitar opções de hooks Fastify.

### Nome: `controller`, não `usecase`

Uma classe com metadata de rota, parâmetros e resultado HTTP é um controller,
mesmo quando o handler convencional se chama `execute`. O caso de uso pertence
à aplicação e é chamado pelo controller quando necessário; não recebe metadata
HTTP para ser registrado como rota. `controller` mantém esse limite e a
consistência com o adapter Fastify. `usecase` confundiria responsabilidades.
Não se exige uma classe adicional de caso de uso para uma resposta trivial.

## Alternativa B — compilação explícita para registro manual futuro

Uma integração poderia futuramente oferecer `compile(Controller)` para
composição manual com `app.get`, `app.post` e métodos de Router. Esta é uma
alternativa secundária, fora do primeiro milestone. Sua assinatura final e
retorno não são consolidados por este ADR.

Exemplo completo de uma possível API futura, em que `compile()` retorna um
`RequestHandler` e método/caminho são escritos pela aplicação:

```ts
import 'reflect-metadata';

import elyum from '@elyum/express';
import { Body, Get, Post, UnauthorizedException } from '@elyum/http';
import express, { Router, type RequestHandler } from 'express';

@Get('/health')
class HealthCheckController {
  execute() {
    return { status: 'ok' };
  }
}

@Post('/echo')
class EchoController {
  async execute(@Body() body: unknown) {
    return { received: body };
  }
}

const authenticate: RequestHandler = (request, _response, next) => {
  if (request.headers.authorization !== 'Bearer demo-token') {
    next(new UnauthorizedException('Provide the demonstration token.'));
    return;
  }
  next();
};

export function buildApplication() {
  const app = express();
  const router = Router();
  const elyumAdapter = elyum(app);
  const apiAdapter = elyum(router);

  app.use(express.json());
  app.get('/health', elyumAdapter.compile(HealthCheckController));
  router.post('/echo', authenticate, apiAdapter.compile(EchoController));
  router.use(apiAdapter.elyum.errorHandler());
  app.use('/api', router);
  app.use(elyumAdapter.elyum.errorHandler());

  return app;
}

export function start(port = Number(process.env.PORT ?? 3000)) {
  const server = buildApplication().listen(port);
  const shutdown = () => server.close();
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}
```

Vantagens: controle explícito da chamada nativa e posicionamento do handler,
como escape hatch para composição especializada.

Custos: repete método/caminho já presentes na metadata e permite divergência
entre controller e chamada Express. Uma API futura precisará decidir como
tratar esse binding; o adapter não consegue verificá-lo apenas observando o
handler. Esses custos não justificam tornar `compile()` a API principal agora.

A alternativa anterior baseada em descritor `{ method, path, handler }` é
outra possibilidade futura para esse escape hatch; não integra a superfície
pública proposta para o primeiro milestone.

## Política comum às duas alternativas

### Compilação e execução

Cada integração mantém um `ControllerCompiler`, criado com `controllerMethod`
opcional. Na alternativa A, `controller()` compila sincronamente na
composição: lê e valida metadata, prepara DI, cria o handler que fecha sobre
o descritor e registra a rota no alvo nativo. Na alternativa B futura,
`compile()` faria a preparação sem registrar a rota. Falhas de configuração
devem identificar controller, rota e correção antes de abrir porta. Não é necessário cache global.

Por requisição, o handler usa apenas o compilado e `executeController()`;
nenhuma releitura de decorators/reflection ou recompilação é permitida.
O executor permanece sem imports Express e sem envio/serialização. O contexto
HTTP existente é aberto antes da resolução e da validação.

### Extração e escape hatches

- `body` = `req.body`, já processado pelo parser nativo configurado.
- `query` = `req.query`, preservando a configuração nativa de parser.
- `params` = `req.params`, incluindo regras nativas de `Router`/`mergeParams`.
- `headers` = `req.headers`, sem copiar ou transformar os valores.
- `raw` = `req`; `response` = `res`.
- `method` = `req.method`; `url` = `req.originalUrl`; `path` = `req.path`;
  IP/protocolo/hostname vêm dos getters nativos e respeitam `trust proxy`.
- `@Request()`/`@Response()` e contexto devolvem os mesmos objetos nativos,
  tipáveis como `express.Request`/`express.Response`.

As factories customizadas e os validators existentes continuam no executor,
sequenciais por índice e sem duplicar `parse`. Não há compilação nativa de
schemas neste milestone. Parsers devem anteceder as rotas que precisam deles.

### JSON opt-in

`elyum(target, { json: { limit: '1mb' } })` instala `express.json(options)` no
alvo durante a instalação e passa as opções nativas sem criar outro parser.
Sem a opção `json`, não instala parser. A aplicação pode usar `express.json`,
`express.raw` ou outro middleware diretamente; não há necessidade de `json: false`.

A posição da instalação é a posição do parser na pilha. Se middleware precisa
executar antes, a aplicação o registra no alvo antes de chamar `elyum(target,
{ json })`. Não instalar JSON novamente em Routers filhos que já recebem body
processado do app, salvo escolha explícita da aplicação. Isso não adiciona
CORS, logger, parser global obrigatório ou servidor próprio.

### Continuação nativa com `@Next()`

`@Next()` pertence exclusivamente a `@elyum/express` e injeta uma função
compatível com `NextFunction`, ligada ao `next` daquela execução. Preserva
`next()`, `next(error)`, `next('route')` e `next('router')`, incluindo os
significados que o Express define para cada contexto. Não é método do `res`.
A função precisa registrar a delegação e encaminhar a chamada ao Express;
não promete identidade por referência com o callback original.

A ordem declarada é também a ordem de execução, sujeita ao controle nativo:
sem `next`, middleware posterior não executa automaticamente. Enviar uma
resposta manual e depois chamar `next()` permanece uma possibilidade nativa;
não se cria uma proibição Elyum. Após delegar, a aplicação continua responsável
por não fazer escritas concorrentes ou responder novamente a jusante.

Contrato observável implementado:

- `@Next()` presente, mas não chamado: não altera os modos de resposta atuais.
- Continuação chamada e retorno `undefined`: nenhuma resposta automática Elyum,
  mesmo se o middleware seguinte ainda não respondeu ou já respondeu.
- Continuação chamada e retorno de corpo/`httpResult`: erro de conflito com
  controller/rota identificados; o corpo retornado não é enviado.
- `next(error)` preserva o valor original e não é reencaminhado outra vez
  somente por finalizar a execução do controller.
- Erro novo lançado/rejeitado depois de delegar também precisa chegar ao
  pipeline nativo; não deve ser engolido nem confundido com o erro já delegado.
- Não se chama `next()` automaticamente ao enviar resposta ou retornar corpo.
- O exemplo de uso suportado chama `next` durante a execução sync/async
  aguardada do controller e retorna `void`; callbacks desacoplados depois da
  conclusão não são um novo contrato de lifecycle suportado neste milestone.

O executor mantém os resultados automática/manual e agora aceita
`isExecutionDelegated?: () => boolean`. Após invocar o controller, consulta a
delegação antes de inspecionar resposta enviada: retorno `undefined` delegado
produz `{ kind: 'manual' }`; retorno com corpo produz conflito. Isso evita
classificar uma resposta enviada por middleware posterior como conflito do
controller. A chamada nativa e seus argumentos ficam no adapter. Regressão
Fastify foi executada; tipos Express não entram em `@elyum/http` ou `@elyum/core`.

`@Next()` usa factory customizada de parâmetro e associa continuação ao request
por WeakMap; a função é capturada antes da invocação do controller. Erros e
controller de origem são associados sem alterar o erro/request e ficam
acessíveis ao middleware de um app pai quando surgem em Router montado.

A detecção de conflito após delegação é diagnóstica: o middleware seguinte
pode já ter executado. O adapter não pode desfazer essa execução nem mandar
outra resposta. Não se adia a chamada nativa para inventar um pipeline serial
próprio. Repetições indevidas de `next` não geram envio automático adicional;
limites e erros tardios devem ser cobertos pela integração real.

Controllers que importam `@Next()` assumem acoplamento ao Express; controllers
neutros que retornam resultados ou usam apenas contratos compartilhados não
recebem essa dependência. O baseline de portabilidade não precisa usar `@Next`
artificialmente, e seu uso não soluciona nenhum patch medido M1–M3.

### Respostas

Predicate de resposta manual: `res.headersSent || res.writableEnded`.
`headersSent` participa obrigatoriamente, inclusive em resposta parcialmente
enviada/stream. Sem delegação explícita, manual retorna sem enviar ou chamar
`next()` no sucesso. Se `@Next()` foi chamado, aplica-se antes a política de
delegação acima, sem envio automático.

Automática: status e headers do resultado são aplicados via Express. Corpo
objeto/array usa serialização JSON nativa; demais valores compatíveis usam
envio nativo, sem envelopes. `undefined` encerra sem corpo mantendo status
compilado; `204` é explícito via `httpResult`. Deve-se testar como Express
trata corpos e headers em HEAD/204, sem criar serializador próprio.

Defaults existentes: POST `201`, demais `200`. Streams, redirect e recursos
específicos usam `@Response()` e retornam `void`. Enviar manualmente e retornar
valor produz `ControllerExecutionError` pelo executor; o adapter o encaminha
sem tentar escrever outra resposta. Uma resposta só com headers enviados é
manual; concluir o stream permanece responsabilidade da aplicação.

### Resolução e propriedade do container

As duas alternativas propõem as mesmas três estratégias mutuamente exclusivas:

1. Sem opções: integração cria seu próprio root Elyum, com lifetime da
   instância da integração. Não existe container global.
2. `{ container }`: aplicação empresta o container. Preservam-se providers;
   autoriza-se registrar controller ausente como transient na preparação.
   Isso é mutação explícita do container emprestado. Integração não fecha,
   descarta, limpa ou substitui recursos da aplicação.
3. `{ resolveController }`: resolver externo, sync ou async, sem container
   exposto ou inspecionado. A aplicação registra e controla suas instâncias.

Exemplos de configuração propostos, usando APIs core já existentes:

```ts
import { ElyumFactory, type Constructor } from '@elyum/core';
import elyum from '@elyum/express';
import express from 'express';

const app = express();
const container = ElyumFactory.createRoot();
const borrowed = elyum(app, {
  container,
  autoRegisterDependencies: true,
});

function resolveSync<T extends object>(controller: Constructor<T>): T {
  return container.resolve(controller);
}

async function resolveAsync<T extends object>(controller: Constructor<T>) {
  return container.resolve(controller);
}

const externalSync = elyum(express(), {
  resolveController: resolveSync,
});
const externalAsync = elyum(express(), {
  resolveController: resolveAsync,
});
```

Resolvers externos exigem que a aplicação registre os controllers antes do
uso; as configurações acima ilustram estratégias, não registram rotas.

`autoRegisterDependencies` é opt-in, desabilitado por padrão, apenas nos modos
container. Reutiliza `DependencyRegister`, valida o grafo antes de registrar
descobertas, não substitui providers e permite somente singleton/transient.
`container` com `resolveController`, ou discovery com resolver externo, falha
em tipos e runtime. Providers existentes mantêm seu escopo suportado.

Não há suporte a provider scoped neste milestone, nem `fork()` por request.
Com discovery ligado, scoped alcançável falha na preparação, como Fastify.
Com discovery desligado ou resolver externo, a aplicação é responsável pelo
grafo explicitamente registrado; não se promete detectar todos os scopes de
factories opacas. Isso precisa constar na documentação e nos testes de limites.

`ContainerDI` atual não oferece `dispose()`. Não se inventa esse método:
aplicação fecha servidor/recursos próprios, e a integração interna não cria
recursos que precisem de descarte. Suporte request-scoped depende de outro
milestone, política de cleanup e benchmark comparativo aprovados.

### Middleware e erro original

Ordem de composição:

1. Configuração e middleware nativos da aplicação, incluindo parser.
2. Middleware por Router/rota, incluindo autenticação quando necessária.
3. Handler compilado: resolução, extração/validação, controller e resposta.
4. Middleware de erro específico da aplicação, se ela optar por interceptar
   diretamente erros antes do fallback Elyum.
5. `target.elyum.errorHandler()`, instalado explicitamente após as rotas do
   respectivo alvo e, no app, após os mounts que deve atender.
6. Middleware diagnóstico nativo posterior/default Express para erros
   encaminhados após resposta comprometida.

Sem delegação explícita, o controller é terminal em sucesso. Middleware
posterior só executa se houver continuação; autenticação deve preceder o
controller que protege. Um middleware de erro tem os quatro parâmetros nativos.
A factory `elyum(appOrRouter)` não instala fallback: ele é instalado pela
aplicação após as rotas para participar do fluxo Express correto.

O handler encaminha falhas para `next(error)` **uma única vez**, sem embrulhar,
mutar ou serializar o original, e sem também rejeitar a mesma Promise para o
Express encaminhá-la novamente. Erros de resolução, validator e controller
mantêm identidade e cause. Falhas do parser/middleware anterior entram no
mesmo pipeline, mesmo sem controller associado.

`target.elyum.errorHandler()` devolve `ErrorRequestHandler` e segue a política
confirmada pelo autor:

- Se `headersSent` ou `writableEnded`, chama `next(error)` e não escreve.
  O diagnóstico posterior pode registrar o conflito; o pipeline Express
  decide sobre conexão já comprometida.
- Caso configurado, chama `onError(error, { request, response, controller? })`.
  Contexto de controller é opcional para falhas anteriores à execução;
  não se adicionam propriedades ao objeto do erro original.
- `onError` retorna `void | Promise<void>`: se enviou resposta, encerra;
  se não respondeu, chama `next(error)` com o erro original, sem fallback
  Elyum nessa passagem. Se lançar outra falha, encaminha essa falha ao
  middleware seguinte, sem reinvocar o callback. A presença do callback é
  suficiente para escolher a política da aplicação, inclusive para erros
  conhecidos; seu retorno não é interpretado como resposta HTTP.
- Somente quando **não houver `onError` configurado**, o middleware explícito
  aplica o fallback: `ValidationError` retorna `400` com
  `{ code: 'VALIDATION_ERROR', message, errors }`; `HttpException` usa seu
  `statusCode` e `toJSON()`. Outros erros retornam `500` com
  `{ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' }`.
  Mensagem/stack/cause internos nunca entram no payload desconhecido.
- Erros de domínio/parser específicos não são inferidos por propriedade
  arbitrária `statusCode`: a aplicação os mapeia em seu middleware ou callback.
  O fallback sozinho não define o contrato de equivalência da avaliação.

O callback configurado controla a política da aplicação: ignorar um erro
faz o erro original seguir ao próximo middleware, como no adapter Fastify.
Sem callback, o middleware Elyum explicitamente instalado fornece o fallback
seguro. Se a aplicação não instalar `target.elyum.errorHandler()`, o handler
continua encaminhando falhas ao pipeline nativo, sem serialização pelo adapter.

A semântica de callback que não responde fica alinhada ao Fastify. O fallback
sem callback é uma capacidade do middleware Express explícito; não altera o
Fastify atual, que continua delegando seus erros nativamente. Paridade de
payloads entre aplicações permanece responsabilidade do contrato de aceitação.

## Decisão e consequências

Adota-se **A**, com factory default `elyum(app | router, options?)`,
`.controller(...handlers)` na própria instância e `.elyum.errorHandler()`
explícito. Exatamente um controller ocupa sua posição na sequência; `@Next()`
permite continuação Express. JSON é opt-in por opções nativas.
Método/caminho são inferidos da metadata. Preservam-se middleware, Router,
configuração, montagem e ciclo de vida Express; não se exige repetir a chamada
nativa em toda rota. O compilador e o serviço interno podem continuar sendo
classes coesas sem exigir uma classe pública de instalação. A remoção exige
retirar a instalação, converter `.controller()` e substituir integração de DI,
parâmetros e eventuais `@Next()`; não é demonstrada apenas por tirar a factory.

`controller` representa o papel HTTP da classe e mantém consistência com
Fastify. `usecase` não é alias da API. As escolhas de composição e a política
de erros foram confirmadas pelo autor; esta decisão registra o design, sem
apresentar suas capacidades como implementadas.

Não expor B no primeiro milestone. `compile()` fica como possibilidade futura
e secundária; a aprovação deste ADR não autoriza implementá-lo agora.

Nenhuma alternativa prova overhead baixo ou portabilidade. As duas reutilizam
o executor e exigem escrita de composição ao trocar de framework. Nenhuma
expõe `.path` estático em controllers ou modifica protótipos Express.

## Verificação exigida na implementação

- Testes unitários de preparação, método/caminho inferidos e opções conflitantes;
  exatamente um controller e preservação da posição de cada middleware.
- Identidade `elyum(target) === target`, callable Router, tipos/overloads e
  encadeamento nativos, colisões e reinstalação sem reconfiguração implícita.
- JSON opt-in ausente/presente, opções nativas, ordem e erro de parsing.
- `@Next()` antes/depois de await, execução do middleware posterior, ausência
  de chamada, `next(error)` por identidade, `next('route')`/`next('router')`,
  resposta manual seguida de next, conflitos e erros posteriores à delegação.
- Regressão do executor/Fastify sem política de continuação configurada.
- Integração com Express 5 real: app/Router/prefixos, métodos suportados,
  injeção body/query/params/headers e identidade request/response.
- Contrato compartilhável com Fastify: validação exatamente uma vez, handlers
  sync/async, defaults, `httpResult`, vazio, resposta manual e conflito.
- DI: interno/emprestado/resolver externo sync e async, providers preservados,
  transient/singleton, discovery e limites de scoped.
- Erro original por identidade em falhas de resolver/validator/controller,
  callback sync/async, callback que responde/lança, parser/middleware nativos,
  headers já enviados e encaminhamento sem duplicação.
- Callback configurado que não responde: erro conhecido/desconhecido original
  chega ao middleware seguinte e nenhum fallback Elyum é enviado; sem callback,
  o middleware explícito aplica o fallback conhecido/seguro. Verificar também
  callback async que responde e callback que lança outro erro.
- Ordem observável dos middleware e isolamento concorrente do contexto HTTP,
  sem adicionar funcionalidades dos cenários M1–M3.
- Teste de API pública e fixtures de tipos, build de exports e consumo do
  pacote; metadata emitida no build, além das fixtures Vitest.
- `pnpm test:ci`, `pnpm typecheck`, `pnpm typecheck:ts6`, `pnpm ci:lint`.

Os exemplos ilustram a API implementada. O exemplo executável do pacote foi
compilado e verificado via HTTP; consumidores CJS/ESM foram compilados e
executados fora do workspace. Isso não significa que cada bloco ilustrativo
deste ADR foi executado, nem que houve publicação ou avaliação experimental.

## Conflitos, aprovação e pendências futuras

O [registro da Fase 0](../evaluation/reports/phase-0-diagnosis-and-plan.md) enumera
conflitos de caminho, CORS/parser, scope, erros, rastreabilidade e baseline.
As escolhas confirmadas abaixo foram alinhadas na visão, arquitetura HTTP,
estratégia de testes e brief. Somente essas escolhas foram incorporadas às
specs. A confirmação final da política de erros encerra a pendência do ADR.

### Escolhas já confirmadas

- Nome `controller`; factory default recebe app ou Router e preserva a instância.
- Ordem livre de middleware e exatamente um controller, sem exigir posição final.
- `@Next()` específico de `@elyum/express`, com continuação nativa explícita.
- JSON opcional por configuração nativa; `compile()` futuro e secundário.
- Nenhuma criação de router próprio, child container por request ou logger.

### Política de erros confirmada

O autor escolheu encaminhar o erro original ao próximo middleware quando
`onError` configurado não enviar resposta, como no Fastify. O fallback seguro
é exclusivo da ausência de callback configurado no middleware Elyum explícito.
A alternativa de aplicar fallback após callback que não responde foi rejeitada.

### Pendências de implementação e fases futuras

- Tipos públicos, extensão neutra do executor e build CJS/ESM estão implementados
  e verificados localmente; publicação e protocolo experimental não foram executados.
- Versionamento de `docs/` e `AGENTS.md` regularizado posteriormente nesta
  branch, sem alterar as decisões da API. Contratos de health/preview e baseline
  experimental continuam pendentes das fases correspondentes.

Não resta decisão de API bloqueante neste ADR. O status `accepted` registra
a aprovação do design; não aceita implicitamente ADR-EVAL, contratos
experimentais ou parâmetros de benchmark.

**Limite da entrega original da Fase 2:** implementada após aprovação explícita do plano.
`packages/examples` permanece com nome e comportamento existentes. As Fases 3
em diante, publicação, benchmarks e cenários medidos não foram executados.

## Referências nativas consultadas

- [Express 5 API](https://expressjs.com/en/5x/api/): app, Router e objetos nativos.
- [Using middleware](https://expressjs.com/en/guide/using-middleware/): composição
  e ordem nativas; um handler terminal não avança automaticamente.
- [Error handling](https://expressjs.com/en/guide/error-handling/): middleware
  de quatro argumentos, Promise rejection no Express 5 e delegação quando
  headers já foram enviados.

Documentação oficial consultada em 25 de outubro de 2026. As escolhas de API,
DI e fallback acima são decisões do projeto, não prescrições do Express.
