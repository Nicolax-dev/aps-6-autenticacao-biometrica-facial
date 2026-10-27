# Guia de comandos

Referência rápida dos comandos usados no projeto: gerenciamento dos containers com Docker Compose e geração de payloads para testar os endpoints do serviço de biometria.

## Sumário

- [Docker](#docker)
  - [Subindo os serviços](#subindo-os-serviços)
  - [Visualizando logs](#visualizando-logs)
  - [Parando os serviços](#parando-os-serviços)
  - [Removendo containers e volumes](#removendo-containers-e-volumes)
- [Testando os endpoints](#testando-os-endpoints)
  - [Pelo Swagger](#pelo-swagger)
  - [Por scripts](#por-scripts)

---

## Docker

### Subindo os serviços

```bash
# Sobe todos os serviços
docker compose up -d

# Reconstrói as imagens de todos os serviços e sobe
docker compose up -d --build

# Reconstrói apenas a imagem do serviço informado e sobe
docker compose up -d --build nome_do_servico
```

| Parte | Descrição |
|---|---|
| `docker` | Chama o cliente Docker. |
| `compose` | Usa o arquivo `docker-compose.yml` para orquestrar múltiplos containers. |
| `up` | Cria e inicia os serviços definidos no arquivo. |
| `-d` | *Detached mode*: executa em segundo plano, sem travar o terminal. |
| `--build` | Reconstrói as imagens antes de subir. Sem um nome depois, reconstrói as de todos os serviços. |
| `--build nome_do_servico` | Reconstrói somente a imagem do serviço especificado. |

### Visualizando logs

```bash
# Logs do PostgreSQL
docker compose logs postgres

# Logs do serviço Python, acompanhando ao vivo
docker compose logs -f biometria
```

| Parte | Descrição |
|---|---|
| `logs` | Mostra os registros de execução dos containers. |
| `postgres` / `biometria` | Nome do serviço definido no `docker-compose.yml`. |
| `-f` | *Follow*: acompanha os logs em tempo real. |

> Com `-f`, o `Ctrl + C` apenas para de exibir os logs. O container continua rodando.

### Parando os serviços

```bash
docker compose stop
```

Desliga todos os containers **sem apagar** os containers nem os dados. Para religar, use `docker compose start` ou `docker compose up -d`.

### Removendo containers e volumes

```bash
# Desliga e remove os containers (mantém os volumes)
docker compose down

# Desliga e remove os containers E os volumes
docker compose down -v
```

- **`down`**: desliga e remove os containers. Os volumes são mantidos, então nenhum dado é perdido. O próximo `up -d` recria os containers.
- **`down -v`**: além de remover os containers, apaga os volumes.

> ***CUIDADO:***
> `docker compose down -v` apaga o banco inteiro (todos os usuários cadastrados) e os pesos do FaceNet. Use apenas quando quiser resetar o ambiente de propósito.

---

## Testando os endpoints

### Pelo Swagger

Converta a imagem para Base64 e copie o resultado direto para a área de transferência:

```bash
base64 -w 0 biometria-service/fotos/img_eu.jpg | clip.exe
```

Depois é só colar (`Ctrl + V`) no corpo da requisição.

> O `clip.exe` funciona no WSL. No Linux, use `xclip -selection clipboard`; no macOS, `base64 -i arquivo.jpg | pbcopy`.

#### `POST /encoding`

```json
{
  "imagem_base64": "COLE_O_BASE64_AQUI"
}
```

#### `POST /verificar`

```json
{
  "imagem_base64": "COLE_O_BASE64_AQUI",
  "encoding_cadastrado": [/* COLE_AQUI_O_ARRAY_RETORNADO_PELO_/encoding */]
}
```

### Por scripts

Os scripts geram arquivos JSON prontos para usar como corpo das requisições.

> ***IMPORTANTE:***
> As fotos precisam estar na pasta `biometria-service/fotos`. Execute os comandos a partir da raiz do projeto.

#### `gerar-json-cadastro.sh`

Uso: `scripts/gerar-json-cadastro.sh <imagem> <email> <arquivo_de_saida>`

```bash
chmod +x scripts/gerar-json-cadastro.sh
F=biometria-service/fotos

# Cadastro
scripts/gerar-json-cadastro.sh $F/img_careta.jpg          teste@exemplo.com         $F/cadastro-careta.json
scripts/gerar-json-cadastro.sh $F/img_eu.jpg              nicolas@exemplo.com       $F/cadastro-eu-ok.json
scripts/gerar-json-cadastro.sh $F/img_eu.jpg              teste-py-off@exemplo.com  $F/cadastro-python-off.json
scripts/gerar-json-cadastro.sh $F/img_euSorrindo.jpg      teste@exemplo.com         $F/cadastro-eu-sorrindo.json
scripts/gerar-json-cadastro.sh $F/img_multiplosRostos.jpg teste@exemplo.com         $F/cadastro-multiplos-rostos.json
scripts/gerar-json-cadastro.sh $F/img_outraPessoa.jpg     teste@exemplo.com         $F/cadastro-outra-pessoa-ok.json
scripts/gerar-json-cadastro.sh $F/img_semRosto.jpg        teste@exemplo.com         $F/cadastro-sem-rosto.json
scripts/gerar-json-cadastro.sh $F/img_eu.jpg              diretor@exemplo.com       $F/cadastro-diretor.json
scripts/gerar-json-cadastro.sh $F/img_eu.jpg              ministro@exemplo.com      $F/cadastro-ministro.json

# Login
scripts/gerar-json-cadastro.sh $F/img_euSorrindo.jpg      nicolas@exemplo.com       $F/login-eu-sorrindo.json
scripts/gerar-json-cadastro.sh $F/img_semRosto.jpg        nicolas@exemplo.com       $F/login-sem-rosto.json
scripts/gerar-json-cadastro.sh $F/img_multiplosRostos.jpg nicolas@exemplo.com       $F/login-multiplos-rostos.json
scripts/gerar-json-cadastro.sh $F/img_outraPessoa.jpg     nicolas@exemplo.com       $F/login-outra-pessoa.json
```

#### `gerar-json-verificar.sh`

Uso: `scripts/gerar-json-verificar.sh <imagem> <arquivo_de_saida>`

```bash
chmod +x scripts/gerar-json-verificar.sh
F=biometria-service/fotos

# /verificar: um arquivo por foto
scripts/gerar-json-verificar.sh $F/img_careta.jpg          $F/verificar-careta.json
scripts/gerar-json-verificar.sh $F/img_eu.jpg              $F/verificar-eu.json
scripts/gerar-json-verificar.sh $F/img_euSorrindo.jpg      $F/verificar-eu-sorrindo.json
scripts/gerar-json-verificar.sh $F/img_multiplosRostos.jpg $F/verificar-multiplos-rostos.json
scripts/gerar-json-verificar.sh $F/img_outraPessoa.jpg     $F/verificar-outra-pessoa.json
scripts/gerar-json-verificar.sh $F/img_semRosto.jpg        $F/verificar-sem-rosto.json

# /encoding com o prefixo que o navegador envia (data:image/jpeg;base64,...)
printf '{"imagem_base64":"data:image/jpeg;base64,%s"}' "$(base64 -w 0 $F/img_eu.jpg)" > $F/encoding-eu-prefixo.json
```

#### Observações

- `chmod +x` dá permissão de execução ao script. O Git guarda essa permissão, então os colegas não precisam repeti-lo após clonar o repositório.
- `F=...` é apenas uma variável do terminal para não repetir o caminho em todos os comandos.