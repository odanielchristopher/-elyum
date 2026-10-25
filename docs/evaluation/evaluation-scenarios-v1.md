# Especificação dos cenários de avaliação do Elyum

## Status

- Estado: rascunho para revisão do autor e do orientador
- Versão: 1.0
- Data: 25 de outubro de 2026
- Escopo: modificabilidade, portabilidade e overhead de desempenho
- Baseline: deve ser congelado antes da execução dos cenários

## 1. Objetivo operacional

Avaliar se a camada arquitetural do Elyum localiza e reduz a propagação de
mudanças em aplicações HTTP, facilita a troca do framework hospedeiro e mantém
um overhead de desempenho mensurável e explicável em comparação com o uso
direto de Fastify e Express.

O estudo não pretende demonstrar produtividade geral de desenvolvedores nem
superioridade universal do Elyum. As conclusões serão limitadas aos artefatos,
cenários, versões e ambiente registrados.

## 2. Perguntas de pesquisa

- **RQ1 — Modificabilidade:** como o Elyum afeta o tamanho e a propagação de
  mudanças funcionais e transversais em uma aplicação HTTP?
- **RQ2 — Portabilidade:** qual parcela da aplicação e de seus componentes pode
  ser preservada ao trocar Fastify por Express, com e sem Elyum?
- **RQ3 — Desempenho:** qual overhead de latência, throughput, CPU e memória é
  introduzido pelo Elyum em relação ao uso direto do mesmo framework HTTP?

## 3. Tratamentos

| Identificador | Aplicação | Finalidade |
| --- | --- | --- |
| EF | Elyum + Fastify | Tratamento estruturado sobre Fastify |
| FN | Fastify nativo | Controle sem Elyum sobre Fastify |
| EE | Elyum + Express | Tratamento estruturado sobre Express |
| EN | Express nativo | Controle sem Elyum sobre Express |

As quatro aplicações devem implementar o mesmo comportamento observável e ter
árvores de produção independentes. Nenhuma aplicação pode importar código de
produção de outra aplicação. A suíte de aceitação, fixtures, scripts de coleta
e geradores de carga podem ser compartilhados e ficam fora das métricas de
modificabilidade.

Os artefatos ficam em `packages/evaluation`, que substitui o atual
`packages/examples`. O adapter Express é um produto do Elyum e deve permanecer
em `packages/express`, fora do pacote privado de avaliação.

## 4. Baseline funcional comum

### 4.1 Rotas

| Método e rota | Comportamento |
| --- | --- |
| `GET /health` | Retorna JSON constante para o pipeline mínimo |
| `POST /products` | Cria produto |
| `GET /products` | Lista produtos |
| `POST /orders` | Cria pedido com preços obtidos do catálogo |
| `GET /orders` | Lista pedidos |
| `GET /orders/:id` | Obtém pedido |
| `PATCH /orders/:id/status` | Confirma ou cancela pedido pendente |
| `POST /orders/preview` | Valida e calcula um pedido sem persistência |

### 4.2 Equivalência obrigatória

As variantes devem preservar:

- contratos de entrada e saída;
- status HTTP, cabeçalhos relevantes e formato de erro;
- regras e transições de domínio;
- dados iniciais e armazenamento em memória;
- comportamento assíncrono dos repositórios;
- relógio e geração de IDs substituíveis;
- ausência de banco, fila, rede externa ou ORM;
- logging desabilitável para benchmark.

Uma variante só pode ser avaliada se passar integralmente pela suíte externa de
aceitação e pelos testes de regressão do monorepo.

## 5. Regras gerais dos cenários de mudança

1. Cada execução parte da tag congelada `evaluation-baseline-v1`.
2. Os cenários não são cumulativos.
3. O requisito e seus testes de aceitação são congelados antes da implementação.
4. M1, M2 e M3 são executados em EF e FN para manter Fastify controlado.
5. Correção funcional de 100% das asserções obrigatórias é porta de entrada
   para interpretar as demais métricas.
6. Lockfiles, arquivos gerados, documentação, resultados e harness externo não
   entram no churn principal.
7. Produção e testes são medidos separadamente.
8. Não existe índice composto de modificabilidade.

Métricas por cenário:

- linhas adicionadas, removidas e churn;
- churn normalizado pelo SLOC do tratamento no baseline;
- arquivos adicionados, removidos, renomeados e modificados;
- componentes arquiteturais afetados;
- dispersão da mudança por arquivos e componentes;
- imports e conceitos específicos de Elyum ou Fastify introduzidos;
- resultado dos testes e falhas intermediárias;
- tempo ativo, apenas como informação contextual;
- interpretação qualitativa do patch.

## 6. M1 — Evolução vertical de regra de negócio

### 6.1 Motivação

Representar uma evolução rotineira que atravessa domínio, aplicação e HTTP sem
depender de uma capacidade exclusiva do Elyum. O cenário funciona também como
controle negativo: uma abstração mínima não deveria aumentar muito o custo de
uma alteração predominantemente de domínio.

### 6.2 Requisito

O cancelamento de um pedido passa a exigir `cancellationReason`:

- obrigatório quando o novo status for `cancelled`;
- texto sem espaços periféricos, entre 10 e 200 caracteres;
- proibido quando o novo status for `confirmed`;
- armazenado de forma imutável no pedido cancelado;
- retornado por `GET /orders/:id` e `GET /orders`;
- ausência ou valor inválido produz erro estável e resposta HTTP equivalente.

O cliente continua sem poder alterar total, preços ou itens durante a mudança
de status.

### 6.3 Aceitação

- cancelar pedido pendente com justificativa válida;
- rejeitar cancelamento sem justificativa;
- rejeitar justificativa curta, longa ou composta apenas por espaços;
- confirmar pedido sem justificativa;
- rejeitar justificativa ao confirmar;
- preservar as regras de transição existentes;
- consultar pedido cancelado e obter a justificativa preservada;
- obter respostas equivalentes em EF e FN.

### 6.4 Componentes esperados, sem prescrever arquivos

- entidade e regra de domínio;
- caso de uso de atualização de status;
- contrato de entrada e validação;
- controller ou handler HTTP;
- mapeamento de erro;
- serialização da saída;
- testes.

### 6.5 Evidência para RQ1

Comparar se o Elyum adiciona, remove ou desloca trabalho de integração em uma
mudança vertical e se domínio e aplicação permanecem independentes do servidor
HTTP.

## 7. M2 — Autorização transversal baseada em papel

### 7.1 Motivação

Avaliar uma política aplicada a múltiplas rotas e verificar se Elyum preserva o
modelo nativo de hooks do Fastify. Guards do Elyum continuam fora do escopo.

### 7.2 Requisito

A autenticação demonstrativa passa a reconhecer dois papéis:

- `customer`;
- `admin`.

Política:

- `GET /health`, `GET /products` permanecem públicos;
- `POST /orders`, `GET /orders` e `GET /orders/:id` aceitam qualquer usuário
  autenticado;
- `POST /products` e `PATCH /orders/:id/status` exigem `admin`;
- credencial ausente ou inválida retorna `401`;
- usuário autenticado sem o papel necessário retorna `403`;
- a política deve ser composta pelos mecanismos nativos do Fastify.

As credenciais são determinísticas e locais ao experimento. Não se implementa
JWT, banco de usuários ou provedor externo.

### 7.3 Aceitação

- público acessa rotas públicas;
- ausência e token inválido produzem `401`;
- `customer` acessa rotas autenticadas comuns;
- `customer` recebe `403` nas rotas administrativas;
- `admin` acessa todas as rotas protegidas;
- falhas mantêm o formato comum de erro;
- política não é duplicada dentro dos casos de uso de domínio.

### 7.4 Evidência para RQ1

Medir dispersão, duplicação, componentes tocados, glue code e preservação dos
hooks nativos. O resultado deve mostrar se a estrutura do Elyum convive com o
Fastify em vez de criar um pipeline concorrente.

## 8. M3 — Correlação e contexto da requisição

### 8.1 Motivação

Representar uma preocupação transversal que percorre entrada HTTP, contexto de
execução, aplicação, respostas e erros, incluindo isolamento concorrente.

### 8.2 Requisito

- aceitar `X-Request-Id` quando fornecido;
- gerar um identificador quando ausente;
- disponibilizar o valor durante a execução de um serviço ou caso de uso sem
  acrescentá-lo manualmente a todas as assinaturas intermediárias;
- devolver `X-Request-Id` em respostas de sucesso e erro;
- impedir vazamento entre requisições simultâneas;
- permitir gerador determinístico nos testes.

Não é necessário implementar logging distribuído, OpenTelemetry ou exportação
para serviço externo.

### 8.3 Aceitação

- preservar identificador recebido;
- gerar identificador quando ausente;
- observar o mesmo valor no caso de uso e na resposta;
- preservar o valor em erro de validação e erro conhecido da aplicação;
- executar requisições concorrentes com IDs distintos sem contaminação;
- obter comportamento equivalente em EF e FN.

### 8.4 Evidência para RQ1

Comparar alteração de assinaturas, acoplamento ao request nativo, configuração
de contexto, componentes afetados e complexidade do caminho de erro.

## 9. P1 — Portabilidade Fastify para Express

### 9.1 Motivação

Avaliar a principal promessa de portabilidade do Elyum com uma mudança de
framework real, mantendo domínio e comportamento observável.

### 9.2 Pares comparados

- EF → EE;
- FN → EN.

EE deve ser derivada de EF e EN deve ser derivada de FN. A ordem de criação, os
commits e a origem dos arquivos devem ser registrados.

### 9.3 Requisito

Trocar o servidor HTTP de Fastify 5 para Express mantendo todas as capacidades
do baseline, incluindo:

- rotas e contratos;
- validação e erros;
- autenticação demonstrativa;
- hooks Fastify substituídos por middleware Express semanticamente equivalente;
- composição e ciclo de inicialização;
- domínio, casos de uso, ports e infraestrutura em memória;
- testes externos de aceitação.

Não se exige que Express imite a API interna do Fastify. Cada implementação deve
ser idiomática para seu framework.

### 9.4 Métricas

- SLOC e percentual de SLOC de produção preservado sem alteração;
- arquivos preservados, alterados, adicionados e removidos;
- churn total e por componente;
- componentes obrigatoriamente reescritos;
- imports específicos do framework removidos e adicionados;
- alterações em domínio, aplicação, infraestrutura e apresentação;
- quantidade e natureza do glue code;
- correção na suíte comum.

As medidas devem ser calculadas por mapeamento explícito de arquivos
semanticamente correspondentes. Similaridade textual automática pode auxiliar,
mas não substitui a inspeção do autor.

### 9.5 Critério de interpretação

A evidência favorável ao Elyum não é “zero linhas alteradas”. Espera-se que
bootstrap, middleware e integração HTTP mudem. O resultado relevante é a
preservação de domínio, casos de uso, contracts e controllers compartilháveis,
com a mudança concentrada no adapter e na composição.

## 10. Benchmarks

Os benchmarks comparam Elyum e uso nativo dentro do mesmo host:

- EF versus FN;
- EE versus EN.

Não usar EF versus EN nem comparar Fastify e Express para concluir sobre o
overhead do Elyum.

### B1 — Pipeline mínimo

`GET /health` retorna corpo JSON constante, sem autenticação, validação,
repositório, geração de ID ou estado mutável.

Finalidade: estimar o custo fixo mínimo da integração e execução.

### B2 — Pipeline representativo válido

`POST /orders/preview` valida o corpo, resolve handler/controller e caso de uso,
consulta produtos em memória, calcula o pedido e serializa a resposta sem
persistência.

Finalidade: medir o overhead em um caminho funcional representativo sem
crescimento de estado.

### B3 — Pipeline representativo inválido

O mesmo endpoint recebe payload inválido e determinístico.

Finalidade: medir validação, normalização e caminho de erros. B3 é secundário e
não substitui B1 e B2.

### 10.1 Métricas

- throughput;
- latência média, p50, p95 e p99;
- CPU;
- RSS e, quando confiável, heap;
- taxa de erros;
- diferença absoluta e razão Elyum/nativo;
- intervalos de confiança das execuções independentes.

Parâmetros de aquecimento, duração, concorrência e número de repetições serão
definidos por piloto e congelados antes da coleta final.

## 11. Invalidação e desvios

Uma execução deve ser marcada, nunca silenciosamente apagada, quando houver:

- falha da infraestrutura de teste;
- diferença funcional entre tratamentos;
- mudança de dependência durante a coleta;
- processo externo relevante não controlado;
- aplicação incorreta do cenário;
- modificação do harness após observar resultados sem nova versão do protocolo.

Desvios do requisito devem ser registrados com data, justificativa, commit e
impacto nas coletas anteriores.

## 12. Referências metodológicas essenciais

- BASILI, V. R.; CALDIERA, G.; ROMBACH, H. D. The Goal Question Metric
  Approach. 1994.
- BENGTSSON, P. O.; LASSING, N.; BOSCH, J.; VAN VLIET, H.
  Architecture-Level Modifiability Analysis (ALMA). Journal of Systems and
  Software, v. 69, n. 1–2, p. 129–147, 2004.
- GEORGES, A.; BUYTAERT, D.; EECKHOUT, L. Statistically Rigorous Java
  Performance Evaluation. OOPSLA, 2007.
- KALIBERA, T.; JONES, R. E. Rigorous Benchmarking in Reasonable Time. ISMM,
  2013.
- RUNESON, P.; HÖST, M. Guidelines for Conducting and Reporting Case Study
  Research in Software Engineering. Empirical Software Engineering, 2009.
- ISO/IEC 25010:2023. Systems and Software Quality Models.
