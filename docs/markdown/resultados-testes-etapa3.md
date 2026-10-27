# Resultados dos testes — Etapa 3 (frontend do cadastro)

- **Responsável:** Nicolas
- **Página:** `http://localhost:8080/cadastro.html` (trocar `8080` se o `API_PORT` do `.env` for outro)
- **Logs do Python:** `docker compose logs biometria | grep "POST /encoding"`
- **Logs do Java:** `docker compose logs api | grep -E "Falha ao chamar|dados inválidos|JSON inválido|cadastrado"`

Legenda da coluna **OK?**: ✅ bateu com o esperado · ❌ divergiu (descrever em Observações)

---

## Parte 0 — Preparação

| Passo | Como | OK? |
|---|---|---|
| Containers no ar | `docker compose ps` → `postgres` (healthy), `biometria` e `api` Up | ✅ |
| Python pronto | `http://localhost:8000/saude` → `{"status":"ok"}` | ✅ |
| Banco limpo | DBeaver: `TRUNCATE usuario RESTART IDENTITY CASCADE;` | ✅ |
| Navegador | F12 aberto, aba *Network* com **Disable cache** marcado | ✅ |
| Câmera | Permissão de câmera para `localhost` em **Permitir** | ✅ |

---

## Parte 1 — Páginas e estrutura

| # | Ação | Esperado | OK? |
|---|---|---|---|
| P1 | Abrir `http://localhost:8080/` | Página inicial: "Cadastrar" verde, "Entrar (em breve)" cinza e desabilitado | ✅ |
| P2 | Clicar em "Cadastrar" | Abre `cadastro.html` com o mesmo estilo | ✅ |
| P3 | Clicar em "Voltar ao início" | Volta para a página inicial | ✅ |
| P4 | Abrir `http://localhost:8080/naoexiste.html` | 404 padrão do Spring (JSON) | ✅ |
| P5 | Editar um texto qualquer do `cadastro.html`, salvar e recarregar (sem comando Docker) | A mudança aparece na hora — depois desfazer | ✅ |

---

## Parte 2 — Validação local (sem enviar nada ao servidor)

| # | Ação | Esperado | OK? |
|---|---|---|---|
| V1 | Com foto tirada, clicar em "Cadastrar" com todos os campos vazios | 4 mensagens vermelhas, bordas vermelhas, cursor no Nome | ✅ |
| V2 | Digitar no Nome | O erro do Nome some na hora; os outros continuam | ✅ |
| V3 | Nome só com espaços | "Informe o nome." | ✅ |
| V4 | Email `abc` | "Email em formato inválido." | ✅ |
| V5 | Senha `12345` | "A senha precisa ter pelo menos 6 caracteres." | ✅ |
| V6 | Senha `123456`, confirmação `1234567` | "As senhas não coincidem." | ✅ |
| V7 | Colar 200 caracteres no Nome e no Email (Console: `"a".repeat(200)`) | Os dois campos ficam com 150 (Console: `document.getElementById("nome").value.length`) | ✅ |
| V8 | Erro de campo com foto tirada | A foto **continua** lá | ✅ |

---

## Parte 3 — Câmera

| # | Ação | Esperado | OK? |
|---|---|---|---|
| C1 | Abrir a página | Dica visível, só "Ligar câmera", "Cadastrar" cinza | ✅ |
| C2 | "Ligar câmera" | Pedido de permissão (1ª vez); vídeo ao vivo **espelhado** + "Tirar foto" | ✅ |
| C3 | "Tirar foto" | Preview sem espelho, **luz da câmera apaga**, "Tirar outra", "Cadastrar" verde | ✅ |
| C4 | "Tirar outra" | "Cadastrar" volta a cinza, câmera liga de novo | ✅ |
| C5 | Sem foto, campos preenchidos, **Enter** num campo | Nada é enviado | ✅ |
| C6 | Console com foto tirada: `obterFoto().slice(0, 30)` | Começa com `data:image/jpeg;base64,/9j/` | ✅ |
| C7 | Tamanho da foto: Console `Math.round(obterFoto().length * 3 / 4 / 1024)` | Entre ~30 e 200 (KB). Obtido: **33 KB** | ✅ |
| C8 | Permissão **Bloquear** (ícone à esquerda da URL), recarregar, "Ligar câmera" | Caixa vermelha com a mensagem de câmera | ✅ |
| C9 | Voltar a permissão para **Permitir** (recarregar se o navegador pedir), "Ligar câmera" | Caixa de erro some, vídeo aparece | ✅ |

---

## Parte 4 — Envio ao `POST /usuarios`

Cada teste usa um **email próprio** (se algum cadastrar por engano, não contamina os outros).
Senha padrão dos testes: `senha123` (anotada aqui de propósito: é usada na Parte 6 para conferir que ela **não** aparece nos logs).
Para os testes que dependem da foto, tirar uma foto **válida** (rosto de frente, boa luz), salvo quando o teste diz outra coisa.

| # | Teste | Como | Esperado na tela | Chama o Python? | OK? |
|---|---|---|---|---|---|
| E1 | Cadastro OK | Nome `Nicolas Silva`, email `nicolas@exemplo.com` | "Cadastrando..." → caixa verde "Cadastro realizado, Nicolas Silva! Você entrou como Analista (nível 1)."; campos e foto limpos; "Cadastrar" cinza | Sim | ✅ |
| E2 | Email repetido | Mesmo email do E1 | "Este email já está cadastrado." — **campos e foto mantidos** | Não | ✅ |
| E3 | Email repetido em maiúsculas | `  NICOLAS@Exemplo.com ` (com espaços) | "Este email já está cadastrado." | Não | ✅ |
| E4 | Email fora da regex do Java | `a@b` (passa no navegador) | "Verifique os dados preenchidos." | Não | ✅ |
| E5 | Senha > 72 bytes | Email `senha-longa@exemplo.com`; senha e confirmação com 73 letras (Console: `"a".repeat(73)`) | "Verifique os dados preenchidos." | Não | ✅ |
| E6 | Sem rosto | Email `sem-rosto@exemplo.com`; foto com a mão tampando a câmera (ou apontada para a parede) | "Não conseguimos identificar um rosto na foto. Tire outra foto." | Sim | ✅ |
| E7 | Vários rostos | Email `varios-rostos@exemplo.com`; foto com outra pessoa junto (ou segurando o celular com a foto de um rosto ao lado do seu) | "Mais de um rosto detectado..." | Sim | ✅ |
| E8 | Imagem inválida (barrada no **Java**) | Email `img-java@exemplo.com`; tirar foto, depois no Console: `fotoBase64 = "data:image/jpeg;base64,b2xh"` e clicar em "Cadastrar" | "Não foi possível processar a foto. Tire outra foto." | **Não** | ✅ |
| E9 | JPEG corrompido (barrado no **Python**) | Email `img-python@exemplo.com`; tirar foto, depois no Console: `fotoBase64 = "data:image/jpeg;base64,/9j/b2xh"` e clicar em "Cadastrar" | "Não foi possível processar a foto. Tire outra foto." | Sim | ✅ |
| E10 | Python desligado | `docker compose stop biometria` (conferir no `docker ps`); email `python-off@exemplo.com` | "Cadastrando..." por ~4s → "O serviço de reconhecimento facial está indisponível..."; dados mantidos. Tempo: **4,06 s** | — | ✅ |
| E11 | Python travado + duplo clique | `docker compose start biometria`, esperar subir, `docker compose pause biometria`; email `python-pause@exemplo.com`; durante o "Cadastrando...", clicar várias vezes | ~5s → mesma mensagem do E10; **um único** envio (aba *Network*: 1 requisição `usuarios`). Tempo: **5,03 s** | — | ✅ |
| E12 | Java fora do ar | `docker compose unpause biometria`; `docker compose stop api`; email `java-off@exemplo.com` (a página já estava aberta) | "Não foi possível conectar ao servidor..."; dados mantidos | — | ✅ |
| E13 | Nome com HTML (proteção XSS) | `docker compose start api` (esperar subir); nome `<b>Teste</b>`, email `xss@exemplo.com` | Sucesso; a mensagem mostra o texto **`<b>Teste</b>` literal**, sem negrito | Sim | ✅ |
| E14 | Fallback de mensagens | Console: `mensagemDoErro("ERRO_INTERNO")`, `mensagemDoErro("CODIGO_QUALQUER")`, `mensagemDoErro(undefined)` | Os três: "Erro inesperado. Tente novamente." | — | ✅ |
| E15 | Console ao final | Aba *Console* | Só avisos amarelos (`Cadastro recusado`, `Falha de conexão`, `Falha ao abrir a câmera`); nenhum erro vermelho | — | ✅ |

Depois do E12: conferir que `api` e `biometria` estão Up (`docker compose ps`) antes de seguir.

**Conferência nos logs do Python** (`docker compose logs biometria | grep "POST /encoding"`):
chamadas novas apenas para E1, E6, E7, E9 e E13 (**5**). E2–E5 e E8 não podem aparecer: o Java barra antes. Obtido: **5** | OK? ✅

---

## Parte 5 — Conferência no DBeaver (depois do E13)

```sql
SELECT u.id,
       u.nome,
       u.email,
       length(u.senha_hash)                          AS tamanho_hash,
       left(u.senha_hash, 4)                         AS prefixo_hash,
       jsonb_array_length(u.encoding_facial::jsonb)  AS qtd_numeros_encoding,
       c.nome                                        AS cargo,
       c.nivel_acesso,
       u.ativo,
       u.data_cadastro
FROM usuario u
JOIN cargo c ON c.id = u.cargo_id
ORDER BY u.id;
```

| Coluna / consulta | Esperado | Obtido | OK? |
|---|---|---|---|
| Linhas em `usuario` | exatamente **2** (E1 e E13) | 2 | ✅ |
| Linha 1: `id` / `email` | 1 / `nicolas@exemplo.com` (minúsculas) | 1 / `nicolas@exemplo.com` | ✅ |
| Linha 2: `id` / `nome` / `email` | 2 / `<b>Teste</b>` (texto puro) / `xss@exemplo.com` | 2 / `<b>Teste</b>` / `xss@exemplo.com` | ✅ |
| `tamanho_hash` | 60 (nas duas) | 60 | ✅ |
| `prefixo_hash` | `$2a$` | `$2a$` | ✅ |
| `qtd_numeros_encoding` | 128 | 128 | ✅ |
| `cargo` / `nivel_acesso` | Analista / 1 | Analista / 1 | ✅ |
| `ativo` | true | true | ✅ |
| `data_cadastro` | data do teste | data do teste | ✅ |
| `SELECT count(*) FROM log_acesso;` | 0 (cadastro não grava log) | 0 | ✅ |

---

## Parte 6 — Privacidade nos logs

| Verificação | Comando | Esperado | Obtido | OK? |
|---|---|---|---|---|
| Senha não aparece | `docker compose logs api \| grep -c "senha123"` | 0 | 0 | ✅ |
| Imagem não aparece | `docker compose logs api \| grep -c "/9j/"` | 0 | 0 | ✅ |
| Imagem não aparece no Python | `docker compose logs biometria \| grep -c "/9j/"` | 0 | 0 | ✅ |

---

Limpeza final feita (`TRUNCATE usuario RESTART IDENTITY CASCADE;`)? ☑ sim

## Observações

Todos os testes passaram.