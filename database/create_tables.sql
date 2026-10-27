-- Tabela de cargos/níveis de acesso
CREATE TABLE cargo (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL CHECK (nome <> ''),
    nivel_acesso    SMALLINT NOT NULL CHECK (nivel_acesso IN (1, 2, 3))
);

-- Tabela de usuários (login + encoding facial)
CREATE TABLE usuario (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL CHECK (nome <> ''),
    email           VARCHAR(150) UNIQUE NOT NULL
                        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    senha_hash      VARCHAR(255) NOT NULL CHECK (length(senha_hash) = 60),  -- hash BCrypt tem sempre 60 caracteres
    cargo_id        INTEGER NOT NULL REFERENCES cargo(id),
    encoding_facial TEXT NOT NULL CHECK (encoding_facial::jsonb IS NOT NULL),
    data_cadastro   TIMESTAMP NOT NULL DEFAULT now(),
    ativo           BOOLEAN NOT NULL DEFAULT true
);

-- Tabela de log de acesso
CREATE TABLE log_acesso (
    id                  SERIAL PRIMARY KEY,
    usuario_id          INTEGER REFERENCES usuario(id),  -- nullable: nem sempre há usuário identificado
    data_hora           TIMESTAMP NOT NULL DEFAULT now(),
    sucesso             BOOLEAN NOT NULL,
    -- Gravado porque o cargo pode mudar depois (promoção) e o histórico precisa do nível da época.
    nivel_acesso        SMALLINT
                        CHECK (nivel_acesso IS NULL OR nivel_acesso IN (1, 2, 3)),
    motivo_falha        VARCHAR(100)
                        CHECK (motivo_falha IS NULL OR motivo_falha IN (
                            'CREDENCIAIS_INVALIDAS',
                            'NENHUM_ROSTO_DETECTADO',
                            'MULTIPLOS_ROSTOS_DETECTADOS',
                            'CONFIANCA_ABAIXO_LIMIAR',
                            'IMAGEM_INVALIDA',
                            'SERVICO_BIOMETRICO_INDISPONIVEL'
                        )),                               -- lista sincronizada com o contrato Java-Python
    encoding_confianca  DOUBLE PRECISION
                        CHECK (encoding_confianca IS NULL
                               OR (encoding_confianca >= 0 AND encoding_confianca <= 1)),
    CHECK (
        (sucesso = true  AND motivo_falha IS NULL)
        OR
        (sucesso = false AND motivo_falha IS NOT NULL)
    ),
    CHECK ((usuario_id IS NULL) = (nivel_acesso IS NULL))
);

-- Tabela de informações do Ministério (o dado protegido em si)
CREATE TABLE informacao (
    id              SERIAL PRIMARY KEY,
    titulo          VARCHAR(200) NOT NULL CHECK (titulo <> ''),
    conteudo        TEXT NOT NULL CHECK (conteudo <> ''),
    nivel_acesso    SMALLINT NOT NULL CHECK (nivel_acesso IN (1, 2, 3))
);