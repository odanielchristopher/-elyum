# Protocolo de avaliação do Elyum

## Status

- **Versão:** 0.2
- **Data:** 25 de outubro de 2026
- **Estado:** rascunho consolidado para revisão final do autor; revisão do orientador pendente
- **Objeto:** modificabilidade, portabilidade estrutural e overhead do Elyum
- **Contrato funcional:** `evaluation-contracts-v2.md`
- **Histórico:** a versão 0.1 permanece preservada e não deve ser sobrescrita

O protocolo deve ser congelado antes da coleta. Mudanças posteriores exigem
nova versão, justificativa e análise de impacto.

## 1. Perguntas de pesquisa

- **RQ1 — Modificabilidade:** como o Elyum afeta tamanho e propagação de
  mudanças funcionais e transversais?
- **RQ2 — Portabilidade:** qual parcela da fatia vertical selecionada é
  preservada na troca Fastify→Express, com e sem Elyum?
- **RQ3 — Desempenho:** qual overhead de latência, throughput, CPU e memória é
  introduzido pelo Elyum em relação ao uso direto do mesmo host?

Não se pretende demonstrar produtividade geral, superioridade universal,
portabilidade da aplicação inteira ou limite universal de overhead.

## 2. Estudos

| Estudo | Tratamentos | Evidência |
| --- | --- | --- |
| E1 — mudanças M1–M3 | EF × FN | correção, churn, arquivos, componentes e propagação |
| E2 — portabilidade P1 | EF→EE × FN→EN | preservação estrutural da fatia selecionada |
| E3 — desempenho B1–B3 | EF×FN e EE×EN | throughput, latência, CPU, RSS e erros |

As quatro aplicações são funcionalmente equivalentes no baseline e possuem
produção independente. Artefatos compartilhados ficam fora das métricas.

## 3. Baseline e equivalência

O baseline é regido por `evaluation-contracts-v2.md`. A suíte externa usa HTTP
real, porta efêmera e estado novo. Uma variante só participa quando:

1. passa integralmente pela suíte comum;
2. passa por testes locais e regressão do monorepo;
3. respeita os contratos e a independência de produção;
4. possui versões, ambiente e origem registrados.

Antes da coleta:

1. revisar aplicações e manifesto;
2. executar gates completos;
3. registrar ambiente e versões;
4. validar scripts em dados descartáveis;
5. criar `evaluation-baseline-v1`;
6. registrar tag e SHA neste protocolo.

Correções posteriores não podem ser silenciosas. Uma nova baseline invalida ou
exige reexecução das coletas afetadas.

## 4. E1 — Modificabilidade

### 4.1 Unidade de análise

```text
cenário × tratamento × implementador
```

M1–M3 partem diretamente da tag e não são cumulativos. Cada patch final precisa
de 100% das asserções obrigatórias. Implementação incompleta é registrada como
falha, nunca interpretada como mudança menor.

### 4.2 Implementador e ordem

Há um implementador: o autor. Serão seis patches:

| Cenário | Primeiro | Segundo |
| --- | --- | --- |
| M1 | EF | FN |
| M2 | FN | EF |
| M3 | EF | FN |

Aprendizado entre tratamentos é ameaça explícita. O tempo ativo é contextual,
com início, pausa, retomada e fim registrados; não fundamenta generalizações de
produtividade.

### 4.3 Recursos e IA durante os patches

Permitidos, com registro:

- specs congeladas e documentação oficial ou livre;
- consultas conceituais gerais à IA;
- explicações abstratas de APIs e mecanismos.

Proibidos:

- fornecer cenário, patch, diff ou testes falhando e solicitar solução;
- geração ou reescrita de código/pseudocódigo adaptado;
- diagnóstico contextual do patch;
- indicação de arquivos ou mudanças específicas;
- revisão/correção/refatoração da solução medida.

Prompt, resposta e uso de consulta relevante são preservados. Autocomplete
trivial sem influência material não precisa ser registrado.

### 4.4 Procedimento

1. criar branch limpa diretamente da tag;
2. fornecer requisito e testes congelados;
3. iniciar registro de tempo e consultas;
4. implementar sem assistência proibida;
5. executar aceitação e regressão;
6. encerrar somente com critérios objetivos;
7. produzir commit final do patch;
8. coletar diff e testes em modo somente leitura;
9. arquivar dados brutos e observações.

### 4.5 Métricas

- linhas adicionadas, removidas e churn;
- churn/SLOC do tratamento no baseline;
- arquivos adicionados, removidos, renomeados e modificados;
- dispersão por arquivos;
- componentes afetados;
- imports/conceitos de Elyum ou Fastify introduzidos;
- testes de produção e de aceitação;
- falhas intermediárias e consultas;
- tempo ativo apenas contextual;
- interpretação qualitativa do patch pelo autor.

Produção e testes são separados. Lockfiles, documentação, build, resultados,
formatação não funcional e harness externo são excluídos. Casos ambíguos são
resolvidos antes dos agregados.

`git diff --numstat` é a fonte de churn. `cloc`, em versão fixada e saída JSON,
mede SLOC. Um manifesto prévio classifica arquivos por responsabilidade. Não há
índice composto.

## 5. E2 — Portabilidade P1

P1 mede somente a fatia definida no contrato, embora as quatro aplicações
implementem o baseline completo. Um arquivo entra quando a dependência transitiva
da fatia o utiliza, mesmo que também atenda outra rota.

O script preserva:

- hashes de arquivos;
- mapeamento semântico EF→EE e FN→EN;
- origem dos arquivos e commits;
- `numstat`, SLOC e componentes;
- imports específicos;
- resultado da suíte comum.

Arquivos byte a byte idênticos são preservados. Similaridade textual auxilia,
mas a classificação final é revisada pelo autor. P1 não mede esforço humano:
os artefatos de baseline foram construídos com assistência de IA.

## 6. E3 — Desempenho

### 6.1 Ambiente

- notebook pessoal do autor;
- Node.js `24.15.0`;
- servidor e gerador em processos distintos na mesma máquina;
- `oha` em versão fixada, com saída bruta JSON;
- `pidstat` em versão fixada para CPU e RSS;
- logging desabilitado;
- build de produção;
- loopback `127.0.0.1` e keep-alive idêntico;
- notebook ligado à energia e mesmo perfil de energia;
- processos externos relevantes encerrados e ambiente registrado.

O piloto registra topologia de CPU, afinidade possível, frequência, temperatura,
RAM, kernel, sistema operacional, versões e risco de saturação do gerador.

### 6.2 Piloto

Cada tentativa inicial usa:

- 30 segundos de aquecimento descartado;
- 60 segundos de medição;
- concurrencies exploratórias suficientes para escolher duas cargas finais:
  uma baixa e uma próxima da saturação estável;
- verificação de que `oha` não é o gargalo;
- definição de temperatura máxima permitida no início de cada execução;
- validação de scripts, respostas, CPU e RSS.

Resultados do piloto não entram na análise. Parâmetros finais e temperatura são
congelados antes da coleta.

### 6.3 Coleta final

- B1 e B2: duas cargas × dez repetições por tratamento;
- B3: uma carga escolhida pelo piloto × dez repetições por tratamento;
- total planejado: 200 execuções;
- processo servidor reiniciado por repetição;
- prontidão verificada antes do aquecimento;
- espera até a temperatura ficar abaixo do limite inicial;
- ordem pareada, balanceada e predeterminada por seed;
- respostas verificadas antes de cada bloco;
- descartes somente por critérios prévios; dados descartados permanecem salvos.

### 6.4 Métricas e análise

Por execução:

- requests/s;
- latência média, p50, p95 e p99;
- taxa e contagem de erros;
- CPU média do servidor;
- RSS mediana e máxima;
- uso do gerador para detectar saturação;
- temperatura e metadados do ambiente.

Para cada par próximo no tempo, calcular diferença absoluta e relativa. Relatar
média e mediana dos efeitos relativos, sem eleger uma única medida principal.
Para ambas, calcular intervalo de confiança de 95% por bootstrap pareado com
10.000 reamostragens e seed fixa `20261025`. Valores negativos são preservados.
Todos os dados brutos, não apenas melhores execuções, são publicados.

## 7. Invalidação e desvios

Registrar, sem apagar:

- falha do servidor, harness ou gerador;
- diferença funcional;
- taxa de erro não prevista;
- mudança de dependência;
- temperatura/frequência fora do critério;
- processo externo relevante;
- aplicação incorreta do cenário;
- mudança do protocolo após observação dos resultados.

Cada desvio contém data, combinação, commit, justificativa, decisão e impacto.

## 8. Ameaças à validade

- **Construção:** churn/SLOC são proxies; mitigar com correção, componentes e
  interpretação qualitativa.
- **Interna:** experiência do autor, aprendizado e autoria dos testes; mitigar
  com ordem alternada, cenários independentes e registro explícito.
- **Assistência:** uso desigual de IA; mitigar com fronteira operacional e log.
- **Portabilidade:** P1 avalia somente uma fatia e artefatos assistidos por IA.
- **Desempenho:** mesma máquina, competição de CPU e throttling térmico; mitigar
  com piloto, monitoramento, afinidade quando validada, ordem balanceada,
  resfriamento e múltiplas repetições.
- **Externa:** um domínio, um autor, duas versões de framework, um notebook e
  cargas sintéticas; não generalizar automaticamente.
- **Conclusão:** poucas observações; preservar valores individuais, efeito e
  intervalos, sem testes inadequados de produtividade.

## 9. Política de IA antes e depois da coleta

Antes da tag, IA pode auxiliar adapter, scaffolding, quatro baselines, testes,
scripts, documentação e diagnóstico, com revisão humana e registro.

Depois da tag, IA não pode implementar, corrigir, refatorar, revisar ou sugerir
soluções de M1–M3. Após o commit final informado pelo autor, pode apenas executar
scripts determinísticos somente leitura e registrar saídas; falhas não podem ser
corrigidas ou diagnosticadas pela IA.

IA pode apoiar revisão linguística de texto escrito pelo autor. Não pode fabricar,
selecionar ou embelezar dados, inventar referências, substituir interpretação ou
produzir conclusões em nome do autor.

## 10. Prontidão

### E1

- [ ] contratos e testes congelados;
- [ ] quatro aplicações equivalentes;
- [ ] baseline tagueado;
- [ ] política de IA aceita;
- [ ] `cloc` e coleta de diff validados;
- [ ] branches limpas preparadas.

### E2

- [ ] manifesto da fatia revisado antes dos resultados;
- [ ] hashes e origem registrados;
- [ ] suíte comum verde;
- [ ] scripts estruturais validados.

### E3

- [ ] respostas B1–B3 byte a byte equivalentes;
- [ ] ambiente e versões registrados;
- [ ] piloto concluído;
- [ ] concorrências e limite térmico congelados;
- [ ] CPU/RSS e gerador monitorados;
- [ ] ordem final gerada e salva;
- [ ] armazenamento bruto validado.

## 11. Referências essenciais

- BASILI, V. R.; CALDIERA, G.; ROMBACH, H. D. *The Goal Question Metric
  Approach*. 1994.
- BENGTSSON, P. O. et al. Architecture-Level Modifiability Analysis (ALMA).
  *Journal of Systems and Software*, 2004.
- GEORGES, A.; BUYTAERT, D.; EECKHOUT, L. Statistically Rigorous Java
  Performance Evaluation. OOPSLA, 2007.
- KALIBERA, T.; JONES, R. E. Rigorous Benchmarking in Reasonable Time. ISMM,
  2013.
- RUNESON, P.; HÖST, M. Guidelines for Conducting and Reporting Case Study
  Research in Software Engineering. *Empirical Software Engineering*, 2009.
- ISO/IEC 25010:2023. Systems and Software Quality Models.
