		-- =====================================================================
-- relatorios.sql — relatórios do log de acesso.
--
-- Consultas somente de leitura (SELECT), para rodar no DBeaver.
-- NÃO é executado na subida do Postgres: não vai para o initdb.
--
-- =====================================================================


-- ---------------------------------------------------------------------
-- R1. Resumo geral
-- Quantas tentativas houve, quantas deram certo e a taxa de sucesso.
-- ---------------------------------------------------------------------
SELECT count(*)                                          AS total_tentativas,
       count(*) FILTER (WHERE sucesso)                   AS sucessos,
       count(*) FILTER (WHERE NOT sucesso)               AS falhas,
       round(100.0 * count(*) FILTER (WHERE sucesso)
             / NULLIF(count(*), 0), 1)                   AS taxa_sucesso_pct,
       min(data_hora)                                    AS primeira_tentativa,
       max(data_hora)                                    AS ultima_tentativa
FROM log_acesso;


-- ---------------------------------------------------------------------
-- R2. Falhas por motivo
-- Quais erros mais acontecem (tratamento de erros funcionando).
-- O percentual é sobre o total de FALHAS, não de tentativas.
-- ---------------------------------------------------------------------
SELECT motivo_falha,
       count(*)                                          AS quantidade,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS pct_das_falhas
FROM log_acesso
WHERE NOT sucesso
GROUP BY motivo_falha
ORDER BY quantidade DESC, motivo_falha;


-- ---------------------------------------------------------------------
-- R3. Tentativas negadas por dia
-- Volume diário e quanto dele foi recusado.
-- ---------------------------------------------------------------------
SELECT data_hora::date                                   AS dia,
       count(*)                                          AS total_tentativas,
       count(*) FILTER (WHERE NOT sucesso)               AS negadas,
       round(100.0 * count(*) FILTER (WHERE NOT sucesso)
             / count(*), 1)                              AS pct_negadas
FROM log_acesso
GROUP BY data_hora::date
ORDER BY dia DESC;


-- ---------------------------------------------------------------------
-- R4. Tentativas por nível de cargo (nível da época)
-- Linha sem nível = email inexistente (nenhum usuário identificado).
-- ---------------------------------------------------------------------
SELECT COALESCE(nivel_acesso::text, 'sem usuario (email inexistente)') AS nivel_acesso,
       count(*)                                          AS total_tentativas,
       count(*) FILTER (WHERE sucesso)                   AS sucessos,
       count(*) FILTER (WHERE NOT sucesso)               AS falhas
FROM log_acesso
GROUP BY log_acesso.nivel_acesso
ORDER BY log_acesso.nivel_acesso NULLS LAST;


-- ---------------------------------------------------------------------
-- R5. Tentativas negadas em contas de nível 3 (alerta de segurança)
-- Toda falha contra a conta do ministro.
-- ---------------------------------------------------------------------
SELECT l.data_hora,
       u.nome,
       u.email,
       CASE WHEN l.motivo_falha = 'CREDENCIAIS_INVALIDAS'
            THEN 'senha'
            ELSE 'facial'
       END                                               AS etapa_da_falha,
       l.motivo_falha
FROM log_acesso l
JOIN usuario u ON u.id = l.usuario_id
WHERE l.nivel_acesso = 3
  AND NOT l.sucesso
ORDER BY l.data_hora DESC;


-- ---------------------------------------------------------------------
-- R6. Tentativas por usuário
-- Histórico de cada conta, incluindo quem nunca tentou entrar.
-- falhas_senha = CREDENCIAIS_INVALIDAS; falhas_etapa_facial = todos os outros motivos.
-- Cargo e ativo são os ATUAIS (o nível da época está em R4/R8).
-- ---------------------------------------------------------------------
SELECT u.id,
       u.nome,
       u.email,
       c.nome                                            AS cargo_atual,
       c.nivel_acesso                                    AS nivel_atual,
       u.ativo,
       count(l.id)                                       AS total_tentativas,
       count(l.id) FILTER (WHERE l.sucesso)              AS sucessos,
       count(l.id) FILTER (WHERE l.motivo_falha = 'CREDENCIAIS_INVALIDAS')
                                                         AS falhas_senha,
       count(l.id) FILTER (WHERE NOT l.sucesso
                             AND l.motivo_falha <> 'CREDENCIAIS_INVALIDAS')
                                                         AS falhas_etapa_facial,
       max(l.data_hora) FILTER (WHERE l.sucesso)         AS ultimo_acesso_ok,
       max(l.data_hora)                                  AS ultima_tentativa
FROM usuario u
JOIN cargo c           ON c.id = u.cargo_id
LEFT JOIN log_acesso l ON l.usuario_id = u.id
GROUP BY u.id, u.nome, u.email, c.nome, c.nivel_acesso, u.ativo
ORDER BY u.id;


-- ---------------------------------------------------------------------
-- R7. Confiança dos acessos aceitos (calibração do limiar)
-- ---------------------------------------------------------------------
SELECT count(*)                                          AS acessos_aceitos,
       round(min(encoding_confianca)::numeric, 4)        AS confianca_minima,
       round(avg(encoding_confianca)::numeric, 4)        AS confianca_media,
       round(max(encoding_confianca)::numeric, 4)        AS confianca_maxima,
       round((2 * (1 - max(encoding_confianca)))::numeric, 4) AS distancia_minima,
       round((2 * (1 - min(encoding_confianca)))::numeric, 4) AS distancia_maxima
FROM log_acesso
WHERE sucesso;


-- ---------------------------------------------------------------------
-- R8. Últimas tentativas, legíveis. Conferência rápida do log.
-- ---------------------------------------------------------------------
SELECT l.id,
       to_char(l.data_hora, 'DD/MM/YYYY HH24:MI:SS')     AS data_hora,
       COALESCE(u.nome,  '(email inexistente)')          AS usuario,
       u.email,
       l.nivel_acesso                                    AS nivel_na_epoca,
       CASE WHEN l.sucesso THEN 'SUCESSO' ELSE 'FALHA' END AS resultado,
       l.motivo_falha,
       round(l.encoding_confianca::numeric, 4)           AS confianca
FROM log_acesso l
LEFT JOIN usuario u ON u.id = l.usuario_id
ORDER BY l.id DESC
LIMIT 20;