-- Dados iniciais. O Postgres executa este arquivo só na primeira subida do container.
-- Para rodar de novo sem perder os pesos do Facenet, apague apenas o volume do banco:
--   docker compose down
--   docker volume rm <pasta-do-projeto>_pgdata
--   docker compose up -d
-- Todos os dados de "informacao" são fictícios.

BEGIN;

-- IDs fixos: o Java atribui CARGO_PADRAO_ID = 1 a todo novo cadastro.
INSERT INTO cargo (id, nome, nivel_acesso) VALUES
    (1, 'Analista',           1),
    (2, 'Diretor de Divisão', 2),
    (3, 'Ministro',           3);

-- Como os IDs foram inseridos à mão, a sequência precisa ser ajustada.
SELECT setval('cargo_id_seq', (SELECT MAX(id) FROM cargo));

-- Nível 1
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

-- Nível 2
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

-- Nível 3
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

-- Usuários de nível 2 e 3 não são criados aqui, porque o encoding facial
-- precisa vir de uma foto real. A pessoa se cadastra pela tela (entra como
-- nível 1) e depois é promovida manualmente:
--   UPDATE usuario SET cargo_id = 2 WHERE email = 'diretor@exemplo.com';
--   UPDATE usuario SET cargo_id = 3 WHERE email = 'ministro@exemplo.com';