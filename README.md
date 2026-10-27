# Sistema de Identificação e Autenticação Biométrica

> APS — 6º semestre de Ciência da Computação (UNIP, 2026/2).
> Disciplina vinculada: Processamento de Imagem e Visão Computacional (PIVC).

Sistema que restringe o acesso a informações estratégicas de um banco de dados do **Ministério do Meio Ambiente** (propriedades rurais que usam agrotóxicos proibidos) por meio de **login com senha + reconhecimento facial pela webcam**.

| Nível | Quem acessa | Cargo no sistema |
|---|---|---|
| 1 | Todos | Analista |
| 2 | Diretores de divisão | Diretor de Divisão |
| 3 | Somente o ministro | Ministro |

Cada usuário vê as informações **até o nível do seu cargo**: o ministro vê tudo, o analista só o nível 1. Todas as informações do banco são **fictícias**.

---

## Como funciona

```
Navegador (HTML + CSS + JS)
   │  foto da webcam em base64 + dados do formulário
   ▼
API Java (Spring Boot) ──────────► PostgreSQL
   │  regras, senha (BCrypt),        usuários, cargos, informações
   │  nível de acesso, log           e log de acesso
   │
   │  imagem (+ encoding cadastrado, no login)
   ▼
Serviço de biometria (Python + FastAPI + DeepFace)
   detecta o rosto, gera o encoding (Facenet, 128 números)
   e compara 1:1 pela distância cosseno
```

- **Cadastro**: nome, email, senha e foto pela webcam. O Python gera o encoding facial e o Java salva o usuário, sempre como **Analista (nível 1)**. Diretores e o ministro são promovidos depois pela administração (ver "Promover usuários").
- **Login**: email + senha primeiro; se estiverem certos, abre um popup para a foto. O Python compara o rosto com o encoding daquele usuário (**1:1**). Confirmado o rosto, a tela mostra as informações permitidas pelo cargo.
- **Log de acesso**: toda tentativa de login (sucesso ou falha, com o motivo) é gravada na tabela `log_acesso`.
- O serviço Python **não guarda estado** e não acessa o banco: ver [docs/decisao-arquitetura-stateless.md](docs/decisao-arquitetura-stateless.md).

### Decisão do reconhecimento facial

| Item | Valor |
|---|---|
| Biblioteca | DeepFace |
| Modelo | Facenet (encoding de 128 números) |
| Detector de rosto | OpenCV |
| Métrica | Distância cosseno (0 = idêntico) |
| Limiar | Distância **0.40** (padrão do DeepFace para Facenet + cosseno) |
| Confiança | `1 - distância / 2` → mínimo aceito **0.80** |

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| API e regras de negócio | Java 21 + Spring Boot 4.1.1 (Spring Data JPA, Validation, BCrypt) |
| Reconhecimento facial | Python 3.11 + FastAPI + DeepFace (TensorFlow 2.17) |
| Banco de dados | PostgreSQL 16 |
| Interface | HTML + CSS + JavaScript puro, servido pelo próprio Spring |
| Ambiente | Docker Compose (nada instalado na máquina além do Docker) |
| Ferramentas | DBeaver, VS Code + REST Client, Git/GitHub |

---

## Como rodar

### Pré-requisitos

- **Docker Desktop** (no Windows, com a integração com o WSL ativada). Nada mais precisa ser instalado.
- Uma **webcam** e um navegador atual (Chrome, Edge ou Firefox).
- Opcional: **DBeaver**, para ver o banco e rodar os relatórios.

### 1. Configurar

```bash
git clone https://github.com/Nicolax-dev/aps-6-autenticacao-biometrica-facial.git
cd aps-6-autenticacao-biometrica-facial
cp .env.example .env
```

Preencha o `.env` (ele fica fora do Git). Exemplo:

```
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_PORT=
BIOMETRIA_PORT=8000
API_PORT=8080
```

As portas são as do seu computador; troque se alguma já estiver em uso. Todas ficam acessíveis **só em `127.0.0.1`**. Se faltar alguma variável, qualquer comando `docker compose` para com erro.

### 2. Subir

```bash
docker compose up -d
docker compose ps
```

- A **primeira** subida demora (≈10 min): a imagem do Python tem ≈3,7 GB por causa do TensorFlow, e os pesos do Facenet (~90 MB) são baixados uma vez só.
- O banco é criado na primeira subida com `database/create_tables.sql` e `database/seed.sql` (cargos e informações fictícias).
- Para saber se o reconhecimento facial já está pronto: http://localhost:8000/saude (ou a porta do `BIOMETRIA_PORT`) deve responder `{"status":"ok"}`.

### 3. Usar

Abra **http://localhost:8080** (ou a porta do `API_PORT`).

1. **Cadastrar**: preencha os dados, clique em "Ligar câmera", tire a foto e cadastre. Na primeira vez, permita o uso da câmera para `localhost`.
2. **Entrar**: email e senha → popup da foto → tela com as informações do seu nível.

Dica para a foto: olhe para a câmera, com expressão neutra e boa iluminação.

### Promover usuários (níveis 2 e 3)

Por segurança, ninguém escolhe o próprio cargo: todo cadastro entra como nível 1. Para promover, conecte o DBeaver ao banco (`localhost`, porta `DB_PORT`, banco `DB_NAME`, usuário e senha do `.env`) e rode:

```sql
UPDATE usuario SET cargo_id = 2 WHERE email = 'diretor@exemplo.com';   -- Diretor de Divisão
UPDATE usuario SET cargo_id = 3 WHERE email = 'ministro@exemplo.com';  -- Ministro
```

Para desativar uma conta sem apagar o histórico: `UPDATE usuario SET ativo = false WHERE email = '...';`

### Relatórios

O arquivo [database/relatorios.sql](database/relatorios.sql) tem consultas prontas sobre o `log_acesso` (resumo, falhas por motivo, tentativas por dia e por nível, alertas em contas de nível 3, histórico por usuário e confiança dos acessos aceitos). Abra no DBeaver e execute com `Alt+X`.

### Comandos do dia a dia

| Situação | Comando |
|---|---|
| Ligar tudo | `docker compose up -d` |
| Desligar sem apagar nada | `docker compose stop` |
| Ver logs | `docker compose logs -f api` (ou `biometria`, `postgres`) |
| Mudou código Java | `docker compose up -d --build api` |
| Mudou código Python ou o frontend | nada: recarrega sozinho (no navegador, F5) |

Mais comandos (geração dos JSONs de teste, Swagger) em [docs/markdown/comando.md](docs/markdown/comando.md).

**Cuidado:** `docker compose down -v` apaga **o banco inteiro e os pesos do Facenet**. Para recriar só o banco:

```bash
docker compose down
docker volume ls                        # procure o volume que termina em _pgdata
docker volume rm <nome-do-volume>
docker compose up -d
```

---

## Endpoints

### API Java (porta `API_PORT`)

| Método | Rota | O que faz | Sucesso |
|---|---|---|---|
| `POST` | `/usuarios` | Cadastro (nome, email, senha, foto) | `201` com nome, cargo e nível |
| `POST` | `/login/credenciais` | Confere email e senha | `204` (abre o popup da foto) |
| `POST` | `/login/verificar` | Confere senha + rosto e devolve as informações do nível | `200` com nome, cargo, nível e informações |

Erros sempre no formato `{ "erro": "CODIGO" }` (ex.: `EMAIL_JA_CADASTRADO`, `CREDENCIAIS_INVALIDAS`, `NENHUM_ROSTO_DETECTADO`, `CONFIANCA_ABAIXO_LIMIAR`, `SERVICO_BIOMETRICO_INDISPONIVEL`). A tela traduz cada código para uma mensagem.

### Serviço de biometria (porta `BIOMETRIA_PORT`, só para testes)

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/saude` | Confirma que o serviço está no ar |
| `POST` | `/encoding` | Imagem → encoding facial (128 números) |
| `POST` | `/verificar` | Imagem + encoding cadastrado → sucesso e confiança |

Documentação interativa (Swagger): http://localhost:8000/docs (ou a porta do `BIOMETRIA_PORT`). A API Java usa a rede interna do Docker (`http://biometria:8000`), não essa porta.

---

## Testes

Os testes são manuais e ficaram documentados com o resultado de cada caso:

| O quê | Roteiro | Resultados |
|---|---|---|
| Serviço Python e cadastro pela API | `requests/teste-service-biometria.http`, `requests/teste-api.http` | [etapa 2](docs/markdown/resultados-testes-etapa2.md) |
| Tela de cadastro | — | [etapa 3](docs/markdown/resultados-testes-etapa3.md) |
| Login pela API | `requests/teste-login.http` | [etapa 4](docs/markdown/resultados-testes-etapa4.md) |
| Tela de login | — | [etapa 5](docs/markdown/resultados-testes-etapa5.md) |

Os arquivos `.http` usam a extensão **REST Client** do VS Code e leem as portas do `.env` por um link em `requests/.env` (`ln -s ../.env requests/.env`). As fotos de teste ficam em `biometria-service/fotos/`, **fora do Git** (crie a pasta e coloque as suas: rosto é dado biométrico).

---

## Segurança e limitações conhecidas

O que o sistema trata:

- Senha guardada só como hash **BCrypt**; resposta genérica "Email ou senha inválido" (não revela qual campo errou).
- Fator facial **1:1**: com a senha certa e o rosto errado, o acesso é negado.
- Imagem validada no servidor pelo conteúdo real (*magic bytes* de JPEG/PNG) e pelo tamanho (máx. 5 MB).
- Nível de acesso vem do cargo, definido pela administração, nunca pelo usuário.
- Proteção contra injeção de HTML (XSS) na tela; logs sem senha, imagem nem encoding.
- Serviço de reconhecimento fora do ar ou lento (timeout de 5 s) tratado com mensagem clara e registrado no log.

O que **não** trata (limitação assumida):

- **Ataque de apresentação**: uma foto impressa ou a tela de um celular mostrada para a webcam pode ser aceita. A proteção seria **detecção de vivacidade**, fora do escopo: ver [docs/markdown/deteccao-de-vivacidade.md](docs/markdown/deteccao-de-vivacidade.md).
- O reconhecimento exige rosto de frente, boa iluminação e expressão natural: uma careta exagerada pode ser rejeitada mesmo sendo o próprio usuário.
- **Descoberta de emails pelo tempo de resposta**: um email inexistente é recusado mais rápido que um existente, porque nesse caso o BCrypt não roda. Medindo o tempo, dá para saber quais emails estão cadastrados, mesmo com a mensagem genérica.
- **Sem limite de tentativas**: não há bloqueio de conta nem atraso progressivo depois de várias falhas de login.

---

## Estrutura do repositório

```
├── docker-compose.yml          ← sobe postgres, biometria e api
├── .env.example                ← modelo de configuração
├── database/                   ← create_tables.sql, seed.sql, relatorios.sql
├── biometria-service/          ← Python: FastAPI + DeepFace
│   └── app/                    ← main.py (endpoints), schemas.py (contrato), reconhecimento.py (biometria)
├── api/                        ← Java: Spring Boot
│   └── src/main/
│       ├── java/br/aps6/api/   ← controller, service, client, repository, model, dto, exception, config
│       └── resources/static/   ← telas: index, cadastro e login
├── requests/                   ← roteiros de teste (REST Client)
├── scripts/                    ← geram os JSONs de teste a partir das fotos
└── docs/                       ← decisões de arquitetura e resultados dos testes
```

---

## Equipe

- ***Nicolas*** - [linkedin.com]() 
- ***Antonio*** - [linkedin.com]()
- ***Breno*** - [linkedin.com]()

### Responsabilidades

#### Nicolas
-

#### Antonio
- 

#### Breno
- 