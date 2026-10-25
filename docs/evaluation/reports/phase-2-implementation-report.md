# Fase 2 — Implementação do adapter Express

- Data: 25 de outubro de 2026.
- SHA de partida: `f7de1cffb0dbbb1d38eb0c251f2821a1cf5fb692`.
- Decisão: [ADR-EXPRESS-001](../../adr/ADR-EXPRESS-001.md), aceito pelo autor.
- Estado: implementado, validado localmente e integrado.
- Commit de integração: `a1175d5b80c2efff070a5c61ac818ba38e04c192`.

## Entrega

`packages/express` é um pacote publicável com build CJS/ESM e declarações por
formato. Usa Express `5.3.0` em desenvolvimento, peer `^5.0.0` e tipos `5.0.6`.
Exporta factory default/nomeada `elyum`, `Next`, erro de configuração e tipos
públicos. Não expõe `compile()` ou classe interna de adapter.

A factory enriquece a mesma instância app/Router, preservando APIs nativas e
encadeamento. Registro exige exatamente um controller entre middleware em
ordem livre. Compilação ocorre no registro; Express mantém matching e mounts.
JSON é opt-in. DI segue as estratégias root interno/emprestado/resolver externo,
com discovery opcional e sem suporte a child containers por request.

O executor HTTP recebeu `isExecutionDelegated?: () => boolean`, verificado
antes de resposta enviada. Delegação com retorno undefined não envia; corpo
retornado após delegação gera conflito. `@Next()` chama imediatamente a
continuação Express. Erros mantêm identidade, callback que não responde delega
o original e fallback seguro ocorre somente sem callback no middleware explícito.

O core recebeu apenas `ELYUM_EXPRESS_CONFIGURATION`; não recebeu dependência
Express. Nenhum fonte Fastify ou arquivo da aplicação de pedidos foi alterado.

## Evidências executadas

- `pnpm test:ci`: 309 testes, 27 arquivos, todos passando. Express: 46;
  HTTP: 65, incluindo 5 novos de delegação; Fastify: 35, sem mudanças na suíte.
- `pnpm typecheck`: passou, incluindo fontes e fixtures públicas de tipos.
- `pnpm typecheck:ts6`: passou.
- `pnpm ci:lint`: passou, incluindo o pacote Express e exemplo.
- `pnpm build`: passou no monorepo, com JS CJS/ESM e declarações do adapter.
- `pnpm --filter @elyum/express test:package`: consumidores CJS/ESM compilados
  e executados fora do workspace com TypeScript 7 e 6, sem aliases de fontes.
- `pnpm --filter @elyum/express example:build`: exemplo compilado com metadata
  de construtor real. Execução HTTP em porta efêmera verificou `GET /health`
  → 200 e `POST /api/echo` → 201, incluindo DI/discovery e `@Next()`.
- `pnpm --filter @elyum/express pack --pack-destination /tmp/elyum-phase2-pack`:
  arquivo local gerado, sem publicação. Manifesto converte workspace deps;
  contém os quatro artefatos de runtime/declarations e README.
- Instalação offline com `--frozen-lockfile --ignore-scripts`: passou.
- Links locais, ausência de imports de Express/Fastify em core/HTTP e
  `git diff --check` revisados.

Os testes Express usam servidores reais em loopback e portas efêmeras, com
teardown. No ambiente restrito, abertura TCP exigiu execução autorizada fora
do sandbox; não foram substituídos por mocks ou skips.

O teste de artefatos detectou e preveniu um problema que os aliases escondiam:
um export `types` único fazia o default ESM não ser chamável em NodeNext. As
condições `import` e `require` agora apontam para `.d.mts` e `.d.ts`,
respectivamente, com seus runtimes correspondentes.

## Reprodução

Consultar o [README do pacote](../../../packages/express/README.md) para os
comandos de build, teste e execução. O exemplo está em
`packages/express/examples/main.ts`; após build, o servidor é iniciado pelo
código da aplicação e aceita `PORT`. Não é criada conveniência de servidor
pelo adapter.

## Limitações e rastreabilidade

- Validação local em Node `24.15.0`, pnpm `10.28.2`. O workflow usa Node 22;
  CI remoto/execução em Node 22 não foram realizados nesta rodada.
- Não houve instalação independente dos tarballs em outra máquina; o teste
  de consumidores usa dependências instaladas e artefatos locais sem aliases.
- O lockfile foi atualizado pelo pnpm e teve reserialização extensa. Além
  das dependências adicionadas, `internal-slot` passou a resolver
  `side-channel` `1.1.1`, substituindo `1.1.0` e sua resolução anterior de
  `side-channel-list`. Não houve alteração manual do lockfile ou dependências
  diretas dos pacotes anteriores.
- Na entrega original da Fase 2, `docs/` estava ignorado pelo Git e os
  documentos permaneceram locais. Esta regularização remove somente as regras
  de ignore documental e passa a versioná-los; não muda as evidências de teste
  nem elimina as demais limitações da implementação.
- Nenhum suporte scoped/disposal, callback de next desacoplado após concluir
  o handler, benchmark, publicação ou afirmação de overhead/portabilidade.
- `packages/examples` permanece no lugar. Fases 3 em diante e M1–M3 não foram
  executados naquela entrega. O commit de integração foi criado posteriormente,
  conforme registrado acima. A mudança de `.gitignore` pertence à regularização
  documental posterior, não à implementação da Fase 2.
