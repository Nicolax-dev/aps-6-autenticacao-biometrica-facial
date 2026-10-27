# Resultados dos testes — Etapa 4 (login no Java)

- **Responsável:** Nicolas
- **Arquivo de teste:** `requests/teste-login.http` (Partes P, C, V e D)
- **Logs do Java:** `docker compose logs api | grep -E "Login (recusado|concluído)|Falha ao chamar"`
- **Logs do Python:** `docker compose logs biometria | grep "POST /verificar"`

Legenda da coluna **OK?**: ✅ bateu com o esperado · ❌ divergiu (descrever em Observações)

Pré-requisitos: banco limpo (`TRUNCATE usuario RESTART IDENTITY CASCADE;`) e JSONs gerados
(comandos no cabeçalho do `teste-login.http`). Senha de todos os usuários de teste: `123456`.

---

## Parte P — Preparação

| # | Teste | Esperado | Obtido | OK? |
|---|---|---|---|---|
| P1 | Cadastro do Nicolas | 201, id 1, Analista, nível 1 | 201, id 1, Analista, nível 1 | ✅ |
| P2 | Cadastro do diretor | 201, id 2, Analista, nível 1 | 201, id 2, Analista, nível 1 | ✅ |
| P3 | Cadastro do ministro | 201, id 3, Analista, nível 1 | 201, id 3, Analista, nível 1 | ✅ |
| — | `UPDATE` de promoção no DBeaver | diretor → `cargo_id` 2; ministro → `cargo_id` 3 | diretor → 2; ministro → 3 | ✅ |

---

## Parte C — `POST /login/credenciais`

| # | Teste | Esperado | Obtido | Linha no log | OK? |
|---|---|---|---|---|---|
| C1 | Credenciais certas | 204, sem corpo | 204, sem corpo | nenhuma | ✅ |
| C2 | Email com maiúsculas e espaços | 204 | 204 | nenhuma | ✅ |
| C3 | Senha errada | 401 `CREDENCIAIS_INVALIDAS` | 401 `CREDENCIAIS_INVALIDAS` | 1 | ✅ |
| C4 | Email inexistente | 401 `CREDENCIAIS_INVALIDAS` | 401 `CREDENCIAIS_INVALIDAS` | 2 | ✅ |
| C5 | Senha com 73 bytes | 401 `CREDENCIAIS_INVALIDAS` (não 500) | 401 `CREDENCIAIS_INVALIDAS` | 3 | ✅ |
| C6 | Conta desativada | 401 `CREDENCIAIS_INVALIDAS` | 401 `CREDENCIAIS_INVALIDAS` | 4 | ✅ |
| C7 | Campos vazios | 400 `DADOS_INVALIDOS` | 400 `DADOS_INVALIDOS` | nenhuma | ✅ |
| C8 | JSON quebrado | 400 `DADOS_INVALIDOS` | 400 `DADOS_INVALIDOS` | nenhuma | ✅ |

---

## Parte V — `POST /login/verificar`

| # | Teste | Esperado | Obtido | Tempo | Linha no log | OK? |
|---|---|---|---|---|---|---|
| V1 | Nicolas sorrindo | 200, Analista, nível 1, 3 informações | 200, Analista, nível 1, 3 informações | — | 5 | ✅ |
| V2 | Senha errada | 401 `CREDENCIAIS_INVALIDAS` | 401 `CREDENCIAIS_INVALIDAS` | — | 6 | ✅ |
| V3 | Email inexistente | 401 `CREDENCIAIS_INVALIDAS` | 401 `CREDENCIAIS_INVALIDAS` | — | 7 | ✅ |
| V4 | Conta desativada | 401 `CREDENCIAIS_INVALIDAS` | 401 `CREDENCIAIS_INVALIDAS` | — | 8 | ✅ |
| V5 | Não é imagem (Java) | 400 `IMAGEM_INVALIDA` | 400 `IMAGEM_INVALIDA` | — | 9 | ✅ |
| V6 | JPEG corrompido (Python) | 400 `IMAGEM_INVALIDA` | 400 `IMAGEM_INVALIDA` | — | 10 | ✅ |
| V7 | Sem rosto | 422 `NENHUM_ROSTO_DETECTADO` | 422 `NENHUM_ROSTO_DETECTADO` | — | 11 | ✅ |
| V8 | Vários rostos | 422 `MULTIPLOS_ROSTOS_DETECTADOS` | 422 `MULTIPLOS_ROSTOS_DETECTADOS` | — | 12 | ✅ |
| V9 | Outra pessoa | 401 `CONFIANCA_ABAIXO_LIMIAR` | 401 `CONFIANCA_ABAIXO_LIMIAR` | — | 13 | ✅ |
| V10 | Python desligado (`stop`) | 503 `SERVICO_BIOMETRICO_INDISPONIVEL`, ~4s | 503 `SERVICO_BIOMETRICO_INDISPONIVEL` | ~4 s | 14 | ✅ |
| V11 | Python travado (`pause`) | 503 `SERVICO_BIOMETRICO_INDISPONIVEL`, ~5s | 503 `SERVICO_BIOMETRICO_INDISPONIVEL` | ~5 s | 15 | ✅ |
| V12 | Diretor | 200, Diretor de Divisão, nível 2, 6 informações | 200, Diretor de Divisão, nível 2, 6 informações | — | 16 | ✅ |
| V13 | Ministro | 200, Ministro, nível 3, 9 informações | 200, Ministro, nível 3, 9 informações | — | 17 | ✅ |
| V14 | Campos vazios | 400 `DADOS_INVALIDOS` | 400 `DADOS_INVALIDOS` | — | nenhuma | ✅ |

---

## Parte D — Conferência no DBeaver

### D1 — `log_acesso` linha a linha (consulta no fim do `teste-login.http`)

Esperado: **17 linhas**, `data_hora` na hora local (fuso `America/Sao_Paulo`). Obtido: 17 linhas, hora local ✅

| id | Teste | `usuario_id` | `sucesso` | `nivel_acesso` | `motivo_falha` | `encoding_confianca` | OK? |
|---|---|---|---|---|---|---|---|
| 1 | C3 | 1 | false | 1 | `CREDENCIAIS_INVALIDAS` | NULL | ✅ |
| 2 | C4 | NULL | false | NULL | `CREDENCIAIS_INVALIDAS` | NULL | ✅ |
| 3 | C5 | 1 | false | 1 | `CREDENCIAIS_INVALIDAS` | NULL | ✅ |
| 4 | C6 | 1 | false | 1 | `CREDENCIAIS_INVALIDAS` | NULL | ✅ |
| 5 | V1 | 1 | true | 1 | NULL | ~0.88 (≥ 0.80) | ✅ |
| 6 | V2 | 1 | false | 1 | `CREDENCIAIS_INVALIDAS` | NULL | ✅ |
| 7 | V3 | NULL | false | NULL | `CREDENCIAIS_INVALIDAS` | NULL | ✅ |
| 8 | V4 | 1 | false | 1 | `CREDENCIAIS_INVALIDAS` | NULL | ✅ |
| 9 | V5 | 1 | false | 1 | `IMAGEM_INVALIDA` | NULL | ✅ |
| 10 | V6 | 1 | false | 1 | `IMAGEM_INVALIDA` | NULL | ✅ |
| 11 | V7 | 1 | false | 1 | `NENHUM_ROSTO_DETECTADO` | NULL | ✅ |
| 12 | V8 | 1 | false | 1 | `MULTIPLOS_ROSTOS_DETECTADOS` | NULL | ✅ |
| 13 | V9 | 1 | false | 1 | `CONFIANCA_ABAIXO_LIMIAR` | NULL | ✅ |
| 14 | V10 | 1 | false | 1 | `SERVICO_BIOMETRICO_INDISPONIVEL` | NULL | ✅ |
| 15 | V11 | 1 | false | 1 | `SERVICO_BIOMETRICO_INDISPONIVEL` | NULL | ✅ |
| 16 | V12 | 2 | true | 2 | NULL | 1.0 (mesma foto do cadastro) | ✅ |
| 17 | V13 | 3 | true | 3 | NULL | 1.0 (mesma foto do cadastro) | ✅ |

### D2 — Nível gravado é o da época

| Verificação | Esperado | Obtido | OK? |
|---|---|---|---|
| Rebaixar o ministro (`cargo_id = 1`) e consultar a linha 17 | `nivel_acesso` continua **3** | 3 | ✅ |

### D3 — Chamadas ao Python

| Verificação | Esperado | Obtido | OK? |
|---|---|---|---|
| `POST /verificar` novos no log do Python | **7**: V1, V6, V7, V8, V9, V12 e V13. As credenciais inválidas e o V5 não chegam ao Python; V10 e V11 não chegam a ser processados | 7 | ✅ |

---

## Parte E — Privacidade nos logs

| Verificação | Comando | Esperado | Obtido | OK? |
|---|---|---|---|---|
| Senha não aparece | `docker compose logs api \| grep -c "123456"` | 0 | 0 | ✅ |
| Email não aparece | `docker compose logs api \| grep -c "@exemplo.com"` | 0 | 0 | ✅ |
| Imagem não aparece | `docker compose logs api \| grep -c "/9j/"` | 0 | 0 | ✅ |
| Confiança não aparece no Java | `docker compose logs api \| grep -ci "confian"` | 0 | 0 | ✅ |

---

Limpeza final feita (`TRUNCATE usuario RESTART IDENTITY CASCADE;`)? ☑ sim

## Observações

Todos os testes passaram.

- O log de acesso guarda o nível do cargo **da época**: depois de rebaixar o ministro, a linha 17 continuou com nível 3 (D2).
- A validação no Java poupa chamadas ao reconhecimento facial: credenciais inválidas e imagem que não é JPEG/PNG (V5) não chegam ao Python (D3).
- V10 (~4 s) e V11 (~5 s) repetem os tempos do cadastro na etapa 2: resolução de nome com o container parado e timeout de leitura de 5 s, respectivamente.