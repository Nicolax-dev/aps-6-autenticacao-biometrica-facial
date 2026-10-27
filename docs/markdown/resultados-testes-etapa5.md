# Resultados dos testes — Etapa 5 (frontend do login)

- **Responsável:** Nicolas
- **Página:** `http://localhost:8080/login.html` (trocar `8080` se o `API_PORT` do `.env` for outro)
- **Logs do Python:** `docker compose logs biometria | grep "POST /verificar"`
- **Logs do Java:** `docker compose logs api | grep -E "Login (recusado|concluído)|Falha ao chamar"`

Legenda da coluna **OK?**: ✅ bateu com o esperado · ❌ divergiu (descrever em Observações) · ⚠️ diferença explicada em Observações

Senha de todos os usuários de teste: `senha123` (anotada aqui de propósito: a Parte 7 confere que ela **não** aparece nos logs).
"Foto válida" = rosto de frente, expressão neutra e boa luz.
> obs: confira se a senha bate com a gerada no .sh, se não, troque aqui.

### Usuários de teste (criados na Parte 0, nesta ordem, para os ids baterem)

| id | Nome | Email | Cargo / estado | Rosto |
|---|---|---|---|---|
| 1 | `Nicolas Silva` | `nicolas@exemplo.com` | Analista (nível 1) | Nicolas |
| 2 | `Diretor Teste` | `diretor@exemplo.com` | Diretor de Divisão (nível 2), promovido no DBeaver | Nicolas* |
| 3 | `Ministro Teste` | `ministro@exemplo.com` | Ministro (nível 3), promovido no DBeaver | Nicolas* |
| 4 | `<b>Teste</b>` | `xss@exemplo.com` | Analista (nível 1) | Nicolas |
| 5 | `Inativo Teste` | `inativo@exemplo.com` | Analista (nível 1), `ativo = false` | Nicolas |

\* Na demonstração seriam pessoas diferentes; nos testes, o mesmo rosto basta para conferir os níveis.

---

## Parte 0 — Preparação

| Passo | Como | OK? |
|---|---|---|
| Containers no ar | `docker compose ps` → `postgres` (healthy), `biometria` e `api` Up | ✅ |
| Python pronto | `http://localhost:8000/saude` → `{"status":"ok"}` | ✅ |
| Banco limpo | DBeaver: `TRUNCATE usuario RESTART IDENTITY CASCADE;` (zera também o `log_acesso`, pela FK) | ✅ (o log começa no id 1) |
| Navegador | F12 aberto, aba *Network* com **Disable cache** marcado | ✅ |
| Câmera | Permissão de câmera para `localhost` em **Permitir** | ✅ |
| Cadastros | Pela tela `cadastro.html`, os 5 usuários da tabela acima, na ordem (foto válida em todos) | ⚠️ criados "à mão" (ver Observações) |
| Promoções e conta desativada | DBeaver: script abaixo | ✅ (R3, R4 e C4 confirmam) |
| Contagem inicial do Python | `docker compose logs biometria \| grep -c "POST /verificar"` → anotar: **28** | ✅ |

```sql
UPDATE usuario SET cargo_id = 2 WHERE email = 'diretor@exemplo.com';
UPDATE usuario SET cargo_id = 3 WHERE email = 'ministro@exemplo.com';
UPDATE usuario SET ativo = false WHERE email = 'inativo@exemplo.com';
```

---

## Parte 1 — Páginas

| # | Ação | Esperado | OK? |
|---|---|---|---|
| P1 | Abrir `http://localhost:8080/` | "Entrar" verde e clicável (sem "em breve"); abre `login.html` com o mesmo estilo | ✅ |
| P2 | No login, clicar em "Criar cadastro" e voltar; depois "Voltar ao início" | Abrem `cadastro.html` e a página inicial | ✅ |
| P3 | No cadastro, clicar em "Ir para o login" | Abre `login.html` | ✅ |
| P4 | Abrir o login com o *Console* aberto | Só o formulário aparece (sem popup, sem resultado); nenhum erro vermelho | ✅ |

---

## Parte 2 — Validação local (nada é enviado: a aba *Network* não mostra `credenciais`)

| # | Ação | Esperado | OK? |
|---|---|---|---|
| V1 | Clicar em "Continuar" com tudo vazio | "Informe o email." e "Informe a senha.", bordas vermelhas, cursor no Email | ✅ |
| V2 | Digitar no Email | O erro do Email some na hora; o da Senha continua | ✅ |
| V3 | Senha só com espaços | "Informe a senha." | ✅ |
| V4 | Tudo vazio e **Enter** num campo | Igual ao V1; nada enviado | ✅ |

---

## Parte 3 — Credenciais (`POST /login/credenciais`)

| # | Teste | Como | Esperado na tela | Linha no log | OK? |
|---|---|---|---|---|---|
| C1 | Senha errada | `nicolas@exemplo.com` / `errada1` | Caixa vermelha "Email ou senha inválido."; email mantido; senha **apagada**, cursor nela | 1 | ✅ |
| C2 | Email inexistente | `ninguem@exemplo.com` / `senha123` | Mesma mensagem do C1 | 2 | ✅ |
| C3 | Email fora do formato | `abc` / `senha123` (passa na validação local: o login só confere se está vazio) | Mesma mensagem do C1 | 3 | ✅ |
| C4 | Conta desativada | `inativo@exemplo.com` / `senha123` | Mesma mensagem do C1 (não revela que a conta existe) | 4 | ✅ |
| C5 | Credenciais certas | `nicolas@exemplo.com` / `senha123` | *Network*: `credenciais` com **204** e aba *Response* vazia. Popup abre com fundo escurecido, dica visível, só "Ligar câmera", "Entrar" cinza (a câmera **não** liga sozinha) | nenhuma | ✅ |
| C6 | Email com maiúsculas e espaços | "Cancelar", depois `  NICOLAS@Exemplo.com ` / `senha123` | Popup abre | nenhuma | ✅ |

---

## Parte 4 — Popup da foto (`POST /login/verificar`)

Todos os testes começam com o popup aberto pelo login do Nicolas (`nicolas@exemplo.com` / `senha123`), salvo quando o teste diz outra coisa.

| # | Teste | Como | Esperado | Linha no log | OK? |
|---|---|---|---|---|---|
| F1 | Página de trás bloqueada | Com o popup aberto, apertar Tab várias vezes e clicar no campo Email | O foco só circula dentro do popup; o campo de trás não recebe clique | — | ✅ |
| F2 | Cancelar | "Cancelar" | Popup fecha; email e senha **mantidos** | — | ✅ |
| F3 | Esc com câmera ligada | "Continuar" → "Ligar câmera" → Esc | Popup fecha e **a luz da câmera apaga**; ao reabrir, volta a mostrar só "Ligar câmera" | — | ✅ |
| F4 | Câmera bloqueada | Permissão em **Bloquear**, recarregar, logar até o popup, "Ligar câmera". Depois voltar para **Permitir** e recarregar | Caixa vermelha **no popup** com a mensagem de câmera | — | ✅ |
| F5 | Sem rosto | Foto com a mão tampando a câmera → "Entrar" | "Verificando..." → "Não conseguimos identificar um rosto na foto. Tire outra foto." **no popup**; popup aberto, foto mantida, senha não pedida de novo | 5 | ✅ |
| F6 | Vários rostos | "Tirar outra" com outra pessoa junto (ou um rosto na tela do celular ao lado do seu) | "Mais de um rosto detectado..." no popup | 6 | ✅ |
| F7 | Outra pessoa | "Tirar outra" com **só outra pessoa** na câmera (ou a foto dela na tela do celular) | "Não foi possível confirmar sua identidade. Tente novamente." no popup | 7 | ✅ |
| F8 | Imagem barrada no **Java** | Tirar foto; Console: `fotoBase64 = "data:image/jpeg;base64,b2xh"`; "Entrar" | "Não foi possível processar a foto. Tire outra foto." no popup | 8 | ✅ |
| F9 | JPEG corrompido (barrado no **Python**) | Tirar foto; Console: `fotoBase64 = "data:image/jpeg;base64,/9j/b2xh"`; "Entrar" | Mesma mensagem do F8 | 9 | ✅ |
| F10 | Python desligado | `docker compose stop biometria` (conferir no `docker ps`); tirar foto válida; "Entrar" | "Verificando..." por ~4s → "O serviço de reconhecimento facial está indisponível..." no popup; foto mantida. Tempo: ____ | 10 | ✅ |
| F11 | Python travado + cliques + Esc | `docker compose start biometria`, esperar o `/saude` responder, `docker compose pause biometria`; "Entrar"; durante o "Verificando...", clicar várias vezes em "Entrar" e apertar Esc **uma vez** | Popup **não fecha**, "Cancelar" cinza; ~5s → mesma mensagem do F10; *Network*: **1** requisição `verificar`. Tempo: ____ | 11 | ✅ |
| F12 | Credenciais inválidas no `/verificar` | `docker compose unpause biometria`. Com o popup aberto, Console: `document.getElementById("senha").value = "errada1"`; tirar foto válida; "Entrar" | Popup fecha, luz da câmera apaga, "Email ou senha inválido." **na tela de login**, senha apagada com o cursor nela | 12 | ✅ |
| F13 | Java fora do ar (no popup) | Logar até o popup; `docker compose stop api`; tirar foto; "Entrar" | "Não foi possível conectar ao servidor..." **no popup**; foto mantida | — | ✅ |
| F14 | Java fora do ar (na tela de login) | "Cancelar"; "Continuar" | Mesma mensagem **na tela de login**; email e senha mantidos | — | ✅ |

Depois do F14: `docker compose start api`, esperar subir e conferir `api` e `biometria` Up (`docker compose ps`) antes de seguir.

Observação sobre o F11: alguns navegadores fecham o `<dialog>` se o Esc for apertado **duas vezes seguidas** sem outro clique (proteção do próprio navegador). Isso não é erro do sistema; por isso o teste usa um Esc só.

---

## Parte 5 — Resultado, níveis e "Sair"

| # | Teste | Como | Esperado | Linha no log | OK? |
|---|---|---|---|---|---|
| R1 | Analista | `nicolas@exemplo.com` / `senha123` + foto válida | *Network*: `verificar` com **200**. Popup fecha, luz apaga. Título "Olá, Nicolas Silva! Seu cargo: Analista (nível 1)."; **3** informações, todas com a etiqueta "Nível 1" | 13 | ✅ |
| R2 | Sair | "Sair" | Volta ao login com email e senha **vazios** e cursor no Email. Console: `document.getElementById("lista-informacoes").children.length` → `0` | — | ✅ |
| R3 | Diretor | `diretor@exemplo.com` | "...Seu cargo: Diretor de Divisão (nível 2)."; **6** informações: 3 "Nível 1" e depois 3 "Nível 2" | 14 | ✅ |
| R4 | Ministro | `ministro@exemplo.com` | "...Seu cargo: Ministro (nível 3)."; **9** informações, na ordem Nível 1 → 2 → 3 | 15 | ✅ |
| R5 | Nome com HTML (proteção XSS) | `xss@exemplo.com` | Título mostra **`<b>Teste</b>` literal**, sem negrito | 16 | ✅ |
| R6 | Fallback de mensagens | Console: `mensagemDoErro("ERRO_INTERNO")`, `mensagemDoErro("CODIGO_QUALQUER")`, `mensagemDoErro(undefined)` | Os três: "Erro inesperado. Tente novamente." | — | ✅ |
| R7 | Mensagens novas | Console: `mensagemDoErro("CREDENCIAIS_INVALIDAS")` e `mensagemDoErro("CONFIANCA_ABAIXO_LIMIAR")` | "Email ou senha inválido." e "Não foi possível confirmar sua identidade. Tente novamente." | — | ✅ |
| R8 | Nada guardado no navegador | Console: `localStorage.length` e `sessionStorage.length` | `0` e `0` | — | ✅ |
| R9 | Console ao final | Aba *Console* | Só avisos amarelos (`Login recusado`, `Falha de conexão no login`, `Falha ao abrir a câmera`); nenhum erro vermelho | — | ✅ |

**Conferência nos logs do Python** (`docker compose logs biometria | grep -c "POST /verificar"`, menos a contagem inicial da Parte 0):
chamadas novas apenas para F5, F6, F7, F9, R1, R3, R4 e R5 (**8**). C1–C4, F8 e F12 não chegam ao Python (o Java barra antes); F10 e F11 não chegam a ser processados.
Obtido: 33 − 28 = **5** | OK? ⚠️ contagem da rodada posterior ao `TRUNCATE`: bate com os 5 logins com sucesso da Parte 6 (ver Observações)

---

## Parte 6 — Conferência no DBeaver

```sql
SELECT id, usuario_id, sucesso, nivel_acesso, motivo_falha, encoding_confianca, data_hora
FROM log_acesso
ORDER BY id;
```

Esperado: **16 linhas**, `data_hora` na hora local.
Obtido: 16 linhas, hora local (19:55 a 20:05 de 20/10/2026) ✅. ⚠️ São da rodada posterior ao `TRUNCATE`, por isso a sequência difere da esperada (ver Observações); as regras do log valem em todas as linhas.

### Esperado

| id | Teste | `usuario_id` | `sucesso` | `nivel_acesso` | `motivo_falha` | `encoding_confianca` |
|---|---|---|---|---|---|---|
| 1 | C1 | 1 | false | 1 | `CREDENCIAIS_INVALIDAS` | NULL |
| 2 | C2 | NULL | false | NULL | `CREDENCIAIS_INVALIDAS` | NULL |
| 3 | C3 | NULL | false | NULL | `CREDENCIAIS_INVALIDAS` | NULL |
| 4 | C4 | 5 | false | 1 | `CREDENCIAIS_INVALIDAS` | NULL |
| 5 | F5 | 1 | false | 1 | `NENHUM_ROSTO_DETECTADO` | NULL |
| 6 | F6 | 1 | false | 1 | `MULTIPLOS_ROSTOS_DETECTADOS` | NULL |
| 7 | F7 | 1 | false | 1 | `CONFIANCA_ABAIXO_LIMIAR` | NULL |
| 8 | F8 | 1 | false | 1 | `IMAGEM_INVALIDA` | NULL |
| 9 | F9 | 1 | false | 1 | `IMAGEM_INVALIDA` | NULL |
| 10 | F10 | 1 | false | 1 | `SERVICO_BIOMETRICO_INDISPONIVEL` | NULL |
| 11 | F11 | 1 | false | 1 | `SERVICO_BIOMETRICO_INDISPONIVEL` | NULL |
| 12 | F12 | 1 | false | 1 | `CREDENCIAIS_INVALIDAS` | NULL |
| 13 | R1 | 1 | true | 1 | NULL | ≥ 0.80 |
| 14 | R3 | 2 | true | 2 | NULL | ≥ 0.80 |
| 15 | R4 | 3 | true | 3 | NULL | ≥ 0.80 |
| 16 | R5 | 4 | true | 1 | NULL | ≥ 0.80 |

### Obtido

| id | `usuario_id` | `sucesso` | `nivel_acesso` | `motivo_falha` | `encoding_confianca` | OK? |
|---|---|---|---|---|---|---|
| 1 | NULL | false | NULL | `CREDENCIAIS_INVALIDAS` | NULL | ⚠️ (C1 deveria ter `usuario_id` 1) |
| 2 | NULL | false | NULL | `CREDENCIAIS_INVALIDAS` | NULL | ✅ (C2) |
| 3 | NULL | false | NULL | `CREDENCIAIS_INVALIDAS` | NULL | ✅ (C3) |
| 4 | 5 | false | 1 | `CREDENCIAIS_INVALIDAS` | NULL | ✅ (C4) |
| 5 | 5 | false | 1 | `CREDENCIAIS_INVALIDAS` | NULL | ⚠️ (tentativa extra com a conta desativada) |
| 6 a 10 | NULL | false | NULL | `CREDENCIAIS_INVALIDAS` | NULL | ⚠️ (5 tentativas com email inexistente) |
| 11 | 1 | true | 1 | NULL | 0.9461 | ⚠️ sucesso do Nicolas |
| 12 | 1 | true | 1 | NULL | 0.9346 | ⚠️ sucesso do Nicolas (R1) |
| 13 | 2 | true | 2 | NULL | 0.9637 | ✅ (R3, diretor) |
| 14 | 3 | true | 3 | NULL | 0.9836 | ✅ (R4, ministro) |
| 15 | NULL | false | NULL | `CREDENCIAIS_INVALIDAS` | NULL | ⚠️ (email inexistente antes do R5) |
| 16 | 4 | true | 1 | NULL | 0.9396 | ✅ (R5, XSS) |

O que **bateu**: as regras do log estão certas em todas as linhas (falha sem confiança, sucesso com confiança ≥ 0.80, `usuario_id` nulo ⟺ nível nulo, nível de cada cargo correto) e os 5 sucessos estão lá.
O que **não bateu**: nenhuma das falhas faciais/técnicas do F5 ao F12 está no log (nenhum `NENHUM_ROSTO_DETECTADO`, `MULTIPLOS_ROSTOS_DETECTADOS`, `CONFIANCA_ABAIXO_LIMIAR`, `IMAGEM_INVALIDA` ou `SERVICO_BIOMETRICO_INDISPONIVEL`).

| Verificação | Esperado | Obtido | OK? |
|---|---|---|---|
| `SELECT count(*) FROM usuario;` | 5 (o login não cria usuário) | 5 | ✅ |

---

## Parte 7 — Privacidade nos logs

| Verificação | Comando | Esperado | Obtido | OK? |
|---|---|---|---|---|
| Senha não aparece | `docker compose logs api \| grep -c "senha123"` | 0 | 0 | ✅ |
| Email não aparece | `docker compose logs api \| grep -c "@exemplo.com"` | 0 | 0 | ✅ |
| Imagem não aparece | `docker compose logs api \| grep -c "/9j/"` | 0 | 0 | ✅ |
| Imagem não aparece no Python | `docker compose logs biometria \| grep -c "/9j/"` | 0 | 0 | ✅ |
| Confiança não aparece no Java | `docker compose logs api \| grep -i "confian" \| grep -vc "CONFIANCA_ABAIXO_LIMIAR"` | 0 | 0 | ✅ |

---

Limpeza final feita (`TRUNCATE usuario RESTART IDENTITY CASCADE;`)? ☐ sim

## Observações

1. **Todos os testes de tela passaram** (Partes 1 a 5), conferidos pelo responsável.
2. **Rodadas diferentes**: os testes do popup (F5–F12) foram executados e conferidos numa rodada anterior; o banco foi limpo (`TRUNCATE`) depois. Por isso o `log_acesso` da Parte 6 e a contagem do Python (33 − 28 = 5) são da rodada seguinte, que repetiu as credenciais e os logins com sucesso. Mesmo assim, as 16 linhas obedecem a todas as regras do log: falha sem confiança, sucesso com confiança ≥ 0.80, `usuario_id` nulo ⟺ nível nulo, nível de cada cargo correto.
3. **Usuários criados à mão** (pela tela, fora da ordem do roteiro): as linhas 1, 5–10 e 15 são tentativas com email digitado diferente ou repetidas com a conta desativada.
4. **Confiança com foto ao vivo pela webcam**: os 5 logins com sucesso ficaram entre **0.93 e 0.98** — bem acima do mínimo de 0.80.
5. **Comando da confiança corrigido**: `grep -ci "confian"` contava também as linhas `Login recusado: CONFIANCA_ABAIXO_LIMIAR (usuario_id=N)`, que trazem o **código** do erro, não o valor (8 linhas, todas desse tipo). O comando agora ignora o código: resultado 0.