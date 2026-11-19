# Pacote de referência para as quatro aplicações de avaliação

Este pacote reúne os documentos utilizados para construir o baseline com:

- Elyum + Fastify (EF);
- Fastify nativo (FN);
- Elyum + Express (EE);
- Express nativo (EN).

## Ordem de leitura

1. `evaluation/evaluation-contracts-v2.md`
2. `evaluation/codex-phase4-implementation-plan.md`
3. `evaluation/evaluation-protocol-v0.2.md`
4. `evaluation/codex-evaluation-build-brief.md`
5. `evaluation/adr-eval-001-evaluation-artifacts.md`
6. documentos em `repository-reference/`

Os contratos v2 prevalecem sobre versões anteriores dos cenários. O pacote não
inclui `evaluation-scenarios-v1.md` nem os arquivos v1, pois foram substituídos
pelas decisões consolidadas nos contratos e no protocolo v0.2.

## Limite da execução

O baseline deve ser construído e validado antes da aplicação dos cenários M1,
M2 e M3. Não devem ser antecipadas soluções para esses cenários durante a
criação das quatro aplicações.

## Estado no repositório

A implementação e sua validação estão descritas no
[relatório das Fases 4 e 5](evaluation/reports/phase-4-and-5-baseline.md).
`repository-reference/` e o ADR recebido em `evaluation/` preservam snapshots
históricos do pacote. As decisões vigentes estão em `specs/` e `adr/`; os
contratos v2 e o protocolo v0.2 regem o baseline experimental.
