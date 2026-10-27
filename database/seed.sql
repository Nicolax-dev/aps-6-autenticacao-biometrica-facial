-- =====================================================================
-- seed.sql — dados iniciais do sistema
-- Executado automaticamente pelo container do Postgres na primeira subida
-- (docker-compose.yml). Para rodar de novo, recrie só o banco
-- (os pesos do Facenet ficam):
--   docker compose down
--   docker volume rm <pasta-do-projeto>_pgdata   -- conferir com: docker volume ls
--   docker compose up -d
-- Não use "docker compose down -v": apaga também os pesos do Facenet.
-- Todos os dados de "informacao" são FICTÍCIOS, criados para demonstração.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Cargos
-- IDs fixos: o Java usa CARGO_PADRAO_ID = 1 no cadastro (seção 8.1).
-- ---------------------------------------------------------------------
INSERT INTO cargo (id, nome, nivel_acesso) VALUES
    (1, 'Analista',           1),
    (2, 'Diretor de Divisão', 2),
    (3, 'Ministro',           3);

-- Ajusta a sequência do SERIAL, já que os IDs foram inseridos manualmente
SELECT setval('cargo_id_seq', (SELECT MAX(id) FROM cargo));

-- ---------------------------------------------------------------------
-- 2. Informações protegidas (fictícias)
-- ---------------------------------------------------------------------

-- Nível 1 — acesso livre
INSERT INTO informacao (titulo, conteudo, nivel_acesso) VALUES
    ('Agrotóxicos proibidos no Brasil',
     'Lista de princípios ativos com uso proibido em território nacional, entre eles paraquate, carbofurano e endossulfam. O uso, comercialização ou armazenamento dessas substâncias é infração ambiental.',
     1),
    ('Como denunciar uso irregular de agrotóxicos',
     'Denúncias podem ser feitas de forma anônima pelos canais oficiais do Ministério. Informe município, localização aproximada da propriedade e, se possível, registros fotográficos.',
     1),
    ('Impactos em recursos hídricos',
     'Resíduos de agrotóxicos podem atingir lençóis freáticos, rios e zonas costeiras, afetando abastecimento de água, pesca e biodiversidade aquática.',
     1);

-- Nível 2 — diretores de divisão
INSERT INTO informacao (titulo, conteudo, nivel_acesso) VALUES
    ('Relatório de fiscalização — Bacia do Rio Verde (fictício)',
     'Foram vistoriadas 42 propriedades na região. Em 7 delas foram encontrados resíduos de carbofurano no solo. Três propriedades estão a menos de 500 m de pontos de captação de água.',
     2),
    ('Monitoramento de lençóis freáticos — Região Centro-Oeste (fictício)',
     'Amostras de 15 poços artesianos apresentaram concentração de paraquate acima do limite de referência. Recomenda-se ampliar a coleta para os municípios vizinhos no próximo trimestre.',
     2),
    ('Propriedades sob investigação — resumo por estado (fictício)',
     'SP: 12 propriedades | GO: 9 | MT: 15 | PR: 6. Dados consolidados das divisões regionais, sem identificação nominal dos proprietários.',
     2);

-- Nível 3 — somente o ministro
INSERT INTO informacao (titulo, conteudo, nivel_acesso) VALUES
    ('Operação Nascente Limpa — planejamento (fictício)',
     'Operação conjunta de fiscalização prevista para o próximo mês, com foco nas 15 propriedades de MT. Data e equipes envolvidas não devem ser divulgadas antes da execução.',
     3),
    ('Lista nominal de proprietários investigados (fictícia)',
     'Fazenda Santa Aurora (J. M. Pereira) — reincidente, 3 autuações. Fazenda Boa Vista do Sul (Agro Ribeiro Ltda.) — contaminação de nascente confirmada. Sítio Três Irmãos (A. C. Lopes) — armazenamento irregular de endossulfam.',
     3),
    ('Nota estratégica ao gabinete (fictícia)',
     'Há indícios de rede de contrabando de agrotóxicos proibidos pela fronteira sul abastecendo propriedades investigadas. Recomenda-se articulação com órgãos de segurança antes de qualquer divulgação pública.',
     3);

COMMIT;

-- =====================================================================
-- 3. Usuários de nível 2 e 3 (NÃO inseridos por este script)
--
-- O encoding facial precisa ser gerado a partir da foto real da pessoa,
-- então não dá para criá-lo em SQL. Fluxo:
--   1) A pessoa se cadastra normalmente pela tela (entra como nível 1).
--   2) Um membro da equipe promove o usuário pelo DBeaver:
--
-- UPDATE usuario SET cargo_id = 2 WHERE email = 'diretor@exemplo.com';  -- Diretor de Divisão
-- UPDATE usuario SET cargo_id = 3 WHERE email = 'ministro@exemplo.com'; -- Ministro
-- =====================================================================-- =====================================================================
-- seed.sql — dados iniciais do sistema
-- Executado automaticamente pelo container do Postgres na primeira subida
-- (docker-compose.yml). Para rodar de novo, recrie só o banco
-- (os pesos do Facenet ficam):
--   docker compose down
--   docker volume rm <pasta-do-projeto>_pgdata   -- conferir com: docker volume ls
--   docker compose up -d
-- Não use "docker compose down -v": apaga também os pesos do Facenet.
-- Todos os dados de "informacao" são FICTÍCIOS, criados para demonstração.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Cargos
-- IDs fixos: o Java usa CARGO_PADRAO_ID = 1 no cadastro (seção 8.1).
-- ---------------------------------------------------------------------
INSERT INTO cargo (id, nome, nivel_acesso) VALUES
    (1, 'Analista',           1),
    (2, 'Diretor de Divisão', 2),
    (3, 'Ministro',           3);

-- Ajusta a sequência do SERIAL, já que os IDs foram inseridos manualmente
SELECT setval('cargo_id_seq', (SELECT MAX(id) FROM cargo));

-- ---------------------------------------------------------------------
-- 2. Informações protegidas (fictícias)
-- ---------------------------------------------------------------------

-- Nível 1 — acesso livre
INSERT INTO informacao (titulo, conteudo, nivel_acesso) VALUES
    ('Agrotóxicos proibidos no Brasil',
     'Lista de princípios ativos com uso proibido em território nacional, entre eles paraquate, carbofurano e endossulfam. O uso, comercialização ou armazenamento dessas substâncias é infração ambiental.',
     1),
    ('Como denunciar uso irregular de agrotóxicos',
     'Denúncias podem ser feitas de forma anônima pelos canais oficiais do Ministério. Informe município, localização aproximada da propriedade e, se possível, registros fotográficos.',
     1),
    ('Impactos em recursos hídricos',
     'Resíduos de agrotóxicos podem atingir lençóis freáticos, rios e zonas costeiras, afetando abastecimento de água, pesca e biodiversidade aquática.',
     1);

-- Nível 2 — diretores de divisão
INSERT INTO informacao (titulo, conteudo, nivel_acesso) VALUES
    ('Relatório de fiscalização — Bacia do Rio Verde (fictício)',
     'Foram vistoriadas 42 propriedades na região. Em 7 delas foram encontrados resíduos de carbofurano no solo. Três propriedades estão a menos de 500 m de pontos de captação de água.',
     2),
    ('Monitoramento de lençóis freáticos — Região Centro-Oeste (fictício)',
     'Amostras de 15 poços artesianos apresentaram concentração de paraquate acima do limite de referência. Recomenda-se ampliar a coleta para os municípios vizinhos no próximo trimestre.',
     2),
    ('Propriedades sob investigação — resumo por estado (fictício)',
     'SP: 12 propriedades | GO: 9 | MT: 15 | PR: 6. Dados consolidados das divisões regionais, sem identificação nominal dos proprietários.',
     2);

-- Nível 3 — somente o ministro
INSERT INTO informacao (titulo, conteudo, nivel_acesso) VALUES
    ('Operação Nascente Limpa — planejamento (fictício)',
     'Operação conjunta de fiscalização prevista para o próximo mês, com foco nas 15 propriedades de MT. Data e equipes envolvidas não devem ser divulgadas antes da execução.',
     3),
    ('Lista nominal de proprietários investigados (fictícia)',
     'Fazenda Santa Aurora (J. M. Pereira) — reincidente, 3 autuações. Fazenda Boa Vista do Sul (Agro Ribeiro Ltda.) — contaminação de nascente confirmada. Sítio Três Irmãos (A. C. Lopes) — armazenamento irregular de endossulfam.',
     3),
    ('Nota estratégica ao gabinete (fictícia)',
     'Há indícios de rede de contrabando de agrotóxicos proibidos pela fronteira sul abastecendo propriedades investigadas. Recomenda-se articulação com órgãos de segurança antes de qualquer divulgação pública.',
     3);

COMMIT;

