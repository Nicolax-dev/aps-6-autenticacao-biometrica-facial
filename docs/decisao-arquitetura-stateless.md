# Decisão de arquitetura: serviço de biometria *stateless*

> [Voltar ao ***README.md***](../README.md)

**Status:** aprovada e implementada (etapas 1, 2 e 4).
**Serviço:** `biometria-service` (Python + FastAPI + DeepFace).

## 1. Decisão

O serviço Python **não guarda estado entre requisições**. Cada chamada recebe tudo de que precisa e devolve só o resultado:

| Endpoint | Recebe | Devolve |
|---|---|---|
| `POST /encoding` (cadastro) | a imagem | o encoding (128 números) ou o motivo da falha |
| `POST /verificar` (login) | a imagem **e** o encoding cadastrado do usuário | sucesso + confiança, ou o motivo da falha |

Na prática, o Python:

- **não acessa o PostgreSQL** (não tem credenciais do banco nem `depends_on: postgres` no compose);
- **não guarda encodings** em memória, cache ou arquivo;
- **não sabe quem é o usuário**: recebe um vetor de 128 números, sem nome, email ou id;
- **não mantém sessão** entre o cadastro e o login, nem entre os dois passos do login.

Quem guarda e busca os dados é o Java: no cadastro, recebe o encoding do `/encoding` e o salva em `usuario.encoding_facial`; no login, lê esse encoding do banco e o envia ao `/verificar` junto com a foto nova.

### O que não conta como estado

O modelo Facenet é carregado **uma vez, na subida do serviço** (`lifespan` do FastAPI), e fica em memória. Isso não é estado de requisição: são pesos fixos, só de leitura, iguais para todos os usuários. O motivo é desempenho: carregar o modelo na primeira requisição passaria do timeout de 5 s do Java.

Os logs do container (distância, confiança e limiar de cada `/verificar`) também não são estado: o serviço não os lê de volta e eles não influenciam nenhuma decisão.

## 2. Por que essa escolha

1. **Uma fonte só para os dados.** O encoding existe em um lugar: a tabela `usuario`. Não há cópia no Python que possa ficar desatualizada (ex.: usuário recadastrado ou desativado e o cache ainda com o encoding antigo).
2. **Menos superfície para dado biométrico.** Encoding facial é dado pessoal sensível. Só o Java tem credenciais do banco; o Python nunca vê o banco inteiro, só o vetor de uma pessoa, na hora da verificação, e o esquece em seguida.
3. **Responsabilidades separadas.** O Python faz processamento de imagem (detectar rosto, gerar encoding, comparar). Regras de negócio, autorização e persistência ficam no Java. Cada serviço pode ser explicado e testado sozinho.
4. **Testável de forma isolada.** Como o Python não depende de banco, ele é testado só com fotos e JSONs (roteiro `requests/teste-service-biometria.http`), sem precisar de usuários cadastrados.
5. **Reinício sem perda.** Parar, reiniciar ou recriar o container não perde nada: não há estado a reconstruir. O `--reload` do desenvolvimento também não causa efeito colateral.
6. **Combina com a comparação 1:1.** Como o login já identifica o usuário (email + senha), o Java envia **um** encoding. O Python não precisa conhecer a base de usuários, o que seria necessário numa busca 1:N.
7. **Escala sem coordenação** (fora do escopo da APS, mas vem de graça): várias cópias do serviço poderiam rodar lado a lado, já que nenhuma depende do que a outra guardou.

## 3. Custos aceitos (*trade-offs*)

| Custo | Por que é aceitável |
|---|---|
| O encoding trafega pela rede interna a cada login | São 128 números (poucos KB), na rede interna do Docker, desprezível perto da própria imagem. |
| O Java precisa buscar o encoding antes de chamar o Python | É uma consulta por email, que o Java já faz para conferir a senha. |
| O Python não consegue identificar alguém sozinho (1:N) | O sistema foi desenhado como 1:1 de propósito (login como filtro de entrada). |
| Os logs de distância se perdem ao recriar o container | São evidência de calibração, não dado do sistema; o que importa (resultado e confiança) fica no `log_acesso`. |

## 4. Alternativas descartadas

- **Python acessando o PostgreSQL direto** (buscar o encoding pelo id do usuário): exigiria credenciais do banco em dois serviços, um mapeamento das tabelas também no Python e acoplaria o serviço de biometria ao schema. Mais pontos de falha, sem ganho real.
- **Cache de encodings no Python** (em memória ou arquivo): criaria uma segunda cópia do dado biométrico, com o problema de invalidar o cache quando o usuário muda ou é desativado. Num projeto deste porte, o custo de buscar no banco é irrelevante.
- **Python guardando os encodings no lugar do banco**: espalharia o dado do usuário em dois lugares e tiraria do PostgreSQL as garantias de integridade (CHECKs, chaves estrangeiras, `ativo`).

## 5. Evidências nos testes

- **Etapa 2 (cadastro):** o `/encoding` só devolve o encoding; quem grava em `usuario.encoding_facial` é o Java (conferido no DBeaver: 128 números salvos).
- **Etapa 4 (login):** o Java lê o encoding do banco e o envia ao `/verificar`; credenciais inválidas e imagem barrada no Java **não chegam** ao Python (conferido pela contagem de `POST /verificar` no log do container).
- **Compose:** o serviço `biometria` não tem `depends_on: postgres` nem variáveis de acesso ao banco.