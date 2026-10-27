# Resultados dos testes — Etapa 2

- **Responsável:** Nicolas
- **Arquivos de teste:** `requests/teste-service-biometria.http` e `requests/teste-api.http`
- **Distâncias do `/verificar`:** `docker compose logs biometria | grep "verificar:"`
- **Logs do Java:** `docker compose logs api | grep -E "Falha ao chamar|dados inválidos|JSON inválido|cadastrado"`

Legenda da coluna **OK?**: ✅ bateu com o esperado · ❌ divergiu (descrever em Observações)

---

## Parte 1 — Serviço Python (`teste-service-biometria.http`)

### S — Serviço no ar

| # | Teste | Esperado | Obtido | OK? |
|---|---|---|---|---|
| S | `GET /saude` | 200 `{"status":"ok"}` | 200 `{"status":"ok"}` | ✅ |

### A — `/encoding` com fotos reais (sempre 200)

| # | Foto | Esperado | `sucesso` | `quantidade_rostos` | Nº de números no `encoding` | `erro` | OK? |
|---|---|---|---|---|---|---|---|
| A1 | `eu.jpg` | sucesso, 1 rosto, 128 números | true | 1 | 128 | null | ✅ |
| A2 | `euSorrindo.jpg` | sucesso, 1 rosto | true | 1 | 128 | null | ✅ |
| A3 | `careta.jpg` | **registrar o obtido** | true | 1 | 128 | null | ✅ |
| A4 | `semRosto.jpg` | `NENHUM_ROSTO_DETECTADO`, 0 rostos | false | 0 | — | `NENHUM_ROSTO_DETECTADO` | ✅ |
| A5 | `multiplosRostos.jpg` | `MULTIPLOS_ROSTOS_DETECTADOS`, nº real de rostos | false | nº real | — | `MULTIPLOS_ROSTOS_DETECTADOS` | ✅ |
| A6 | `eu.jpg` com prefixo `data:` | sucesso, 1 rosto | true | 1 | 128 | null | ✅ |
| A7 | `outraPessoa.jpg` | sucesso, 1 rosto | true | 1 | 128 | null | ✅ |

### B — `/encoding` com imagem inválida (200, `IMAGEM_INVALIDA`)

| # | Entrada | Esperado | Obtido (status + `erro`) | OK? |
|---|---|---|---|---|
| B1 | `"@@@@"` (fora do base64) | 200 `IMAGEM_INVALIDA` | 200 `IMAGEM_INVALIDA` | ✅ |
| B2 | `""` (vazio) | 200 `IMAGEM_INVALIDA` | 200 `IMAGEM_INVALIDA` | ✅ |
| B3 | `"b2xh"` (texto, não imagem) | 200 `IMAGEM_INVALIDA` | 200 `IMAGEM_INVALIDA` | ✅ |
| B4 | `"/9j/b2xh"` (JPEG corrompido) | 200 `IMAGEM_INVALIDA` | 200 `IMAGEM_INVALIDA` | ✅ |
| B5 | `"b2xh\nb2xh"` (quebra escapada) | 200 `IMAGEM_INVALIDA` | 200 `IMAGEM_INVALIDA` | ✅ |
| B6 | `"data:image/jpeg;base64,"` (só prefixo) | 200 `IMAGEM_INVALIDA` | 200 `IMAGEM_INVALIDA` | ✅ |

### C — `/encoding` fora do contrato (422 do FastAPI)

| # | Entrada | Esperado | Obtido (status + `type`) | OK? |
|---|---|---|---|---|
| C1 | `{}` (sem campo) | 422 `missing` | 422 `missing` | ✅ |
| C2 | JSON quebrado | 422 `json_invalid` | 422 `json_invalid` | ✅ |
| C3 | Quebra de linha real na string | 422 `json_invalid` | 422 `json_invalid` | ✅ |
| C4 | `imagem_base64` numérico | 422 `string_type` | 422 `string_type` | ✅ |

### D — `/verificar`, comparação 1:1 contra o encoding de `eu.jpg` (A1)

Limiar: distância **0.40** = confiança mínima **0.80** (contexto, seção 3.1).

| # | Foto vs `eu` | Esperado | Obtido (`sucesso` / `erro`) | Distância | Confiança | OK? |
|---|---|---|---|---|---|---|
| D1 | `eu.jpg` (mesma foto) | sucesso, confiança ~1.0 | true / null | 0.0000 | 1.0000 | ✅ |
| D2 | `euSorrindo.jpg` | sucesso, confiança ≥ 0.80 | true / null | 0.2357 | 0.8822 | ✅ |
| D3 | `careta.jpg` | **registrar o obtido** | false / `CONFIANCA_ABAIXO_LIMIAR` | 0.5820 | 0.7090 | ✅ |
| D4 | `semRosto.jpg` | `NENHUM_ROSTO_DETECTADO` | false / `NENHUM_ROSTO_DETECTADO` | — | — | ✅ |
| D5 | `multiplosRostos.jpg` | `MULTIPLOS_ROSTOS_DETECTADOS` | false / `MULTIPLOS_ROSTOS_DETECTADOS` | — | — | ✅ |
| D6 | `"b2xh"` (inválida) | `IMAGEM_INVALIDA` | false / `IMAGEM_INVALIDA` | — | — | ✅ |
| D7 | encoding com 1 número | 422 `too_short` | 422 `too_short` | — | — | ✅ |
| D8 | sem `encoding_cadastrado` | 422 `missing` | 422 `missing` | — | — | ✅ |
| D9 | `outraPessoa.jpg` | `CONFIANCA_ABAIXO_LIMIAR`, distância > 0.40 | false / `CONFIANCA_ABAIXO_LIMIAR` | 0.8219 | 0.5890 | ✅ |

---

## Parte 2 — API Java, `POST /usuarios` (`teste-api.http`)

Pré-requisito: banco limpo (`TRUNCATE usuario RESTART IDENTITY CASCADE;`).

| # | Teste | Esperado | Obtido (status + corpo) | Tempo | OK? |
|---|---|---|---|---|---|
| 1 | Cadastro OK | 201, id 1, Analista, nível 1 | 201, id 1, Analista, nível 1 | 13 ms | ✅ |
| 2 | Mesmo cadastro de novo | 409 `EMAIL_JA_CADASTRADO` | 409 `EMAIL_JA_CADASTRADO` | 13 ms | ✅ |
| 3 | Email em maiúsculas | 409 `EMAIL_JA_CADASTRADO` | 409 `EMAIL_JA_CADASTRADO` | 11 ms | ✅ |
| 4 | Campos vazios / senha curta | 400 `DADOS_INVALIDOS` | 400 `DADOS_INVALIDOS` | 20 ms | ✅ |
| 5 | Email `a@b` | 400 `DADOS_INVALIDOS` | 400 `DADOS_INVALIDOS` | 30 ms | ✅ |
| 6 | JSON quebrado | 400 `DADOS_INVALIDOS` | 400 `DADOS_INVALIDOS` | 8 ms | ✅ |
| 7 | Não é imagem (barrado no Java) | 400 `IMAGEM_INVALIDA` | 400 `IMAGEM_INVALIDA` | 16 ms | ✅ |
| 8 | JPEG corrompido (barrado no Python) | 400 `IMAGEM_INVALIDA` | 400 `IMAGEM_INVALIDA` | 38 ms | ✅ |
| 9 | Foto sem rosto | 422 `NENHUM_ROSTO_DETECTADO` | 422 `NENHUM_ROSTO_DETECTADO` | 145 ms | ✅ |
| 10 | Foto com vários rostos | 422 `MULTIPLOS_ROSTOS_DETECTADOS` | 422 `MULTIPLOS_ROSTOS_DETECTADOS` | 1116 ms | ✅ |
| 11 | Python desligado (`stop`) | 503 `SERVICO_BIOMETRICO_INDISPONIVEL` | 503 `SERVICO_BIOMETRICO_INDISPONIVEL` | 4085 ms | ✅ |
| 12 | Python travado (`pause`) | 503 `SERVICO_BIOMETRICO_INDISPONIVEL` | 503 `SERVICO_BIOMETRICO_INDISPONIVEL` | ~5 s | ✅ |
| 13 | Rota inexistente | 404 padrão do Spring | 404 padrão do Spring | 11 ms | ✅ |

---

## Parte 3 — Conferência no DBeaver (depois do teste 13)

| Coluna / consulta | Esperado | Obtido | OK? |
|---|---|---|---|
| Linhas em `usuario` | exatamente 1 | 1 | ✅ |
| `id` | 1 | 1 | ✅ |
| `email` | `nicolas@exemplo.com` (minúsculas) | `nicolas@exemplo.com` | ✅ |
| `tamanho_hash` | 60 | 60 | ✅ |
| `prefixo_hash` | `$2a$` | `$2a$` | ✅ |
| `qtd_numeros_encoding` | 128 | 128 | ✅ |
| `cargo` / `nivel_acesso` | Analista / 1 | Analista / 1 | ✅ |
| `ativo` | true | true | ✅ |
| `data_cadastro` | data do teste | data do teste | ✅ |
| `SELECT count(*) FROM log_acesso` | 0 | 0 | ✅ |

Limpeza final feita (`TRUNCATE usuario RESTART IDENTITY CASCADE;`)? ☑ sim

---

## Observações

### Teste do serviço de biometria

Todos os testes passaram.

- A careta (A3/D3) teve o rosto detectado, mas foi rejeitada na comparação: distância 0.5820, acima do limiar de 0.40.

### Teste da API

Todos os testes passaram.

- O teste 11 levou cerca de 4 s, não milissegundos. Com o container parado, o nome `biometria` deixa de resolver na rede do Docker, e a falha só aparece depois dessa tentativa.
- O teste 12 levou cerca de 5 s: o timeout de leitura de 5 s estourou, como esperado.